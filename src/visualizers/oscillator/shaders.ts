/**
 * GLSL Shaders for Perceptual Audio-Reactive Visualizer
 * 
 * Uses DOSE + 5 effects model:
 * - DOSE: master intensity
 * - SYMMETRY: kaleidoscopic tiling
 * - RECURSION: fractal depth
 * - BREATHING: pulsing oscillation
 * - FLOW: warping motion  
 * - SATURATION: color intensity
 */

export const vertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Update shader - physics simulation
export const updateShader = `#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform sampler2D u_noise;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_deltaTime;

// Audio
uniform float u_bass;
uniform float u_lowMid;
uniform float u_mid;
uniform float u_high;
uniform float u_energy;
uniform float u_beatIntensity;

// Params - new names
uniform float u_dose;
uniform float u_symmetry;
uniform float u_recursion;
uniform float u_breathing;
uniform float u_flow;
uniform float u_saturation;

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

vec2 logPolar(vec2 uv, float intensity) {
  vec2 centered = uv - 0.5;
  float r = length(centered) + 0.001;
  float theta = atan(centered.y, centered.x);
  float logR = log(r * 5.0 + 0.5) * 0.5 + 0.5;
  return mix(uv, vec2(theta / TAU + 0.5, logR), intensity);
}

vec2 kaleidoscope(vec2 uv, float segments) {
  vec2 centered = uv - 0.5;
  float angle = atan(centered.y, centered.x);
  float r = length(centered);
  float segmentAngle = TAU / segments;
  angle = mod(angle, segmentAngle);
  angle = abs(angle - segmentAngle * 0.5);
  return vec2(cos(angle), sin(angle)) * r + 0.5;
}

void main() {
  vec4 prevState = texture(u_state, v_uv);
  float phase = prevState.x;
  float velocity = prevState.y;
  float accumulatedEnergy = prevState.z;
  float prevBeat = prevState.w;
  
  // Coordinate transforms based on effects
  vec2 coord = v_uv;
  if (u_recursion * u_dose > 0.01) {
    coord = logPolar(coord, u_recursion * u_dose * 0.8);
  }
  
  float segments = 3.0 + u_symmetry * u_dose * 9.0;
  if (u_symmetry * u_dose > 0.1) {
    coord = kaleidoscope(coord, segments);
  }
  
  float dist = length(v_uv - 0.5);
  float angle = atan(v_uv.y - 0.5, v_uv.x - 0.5);
  
  vec4 noise = texture(u_noise, v_uv * 2.0 + u_time * 0.01);
  
  // Audio-driven forces scaled by dose
  float bassForce = u_bass * u_bass * 3.0 * u_dose;
  float radialPush = bassForce * (1.0 - dist * 2.0);
  
  float rotationalForce = u_lowMid * 2.0 * u_flow;
  
  float ripplePhase = dist * 15.0 - u_time * 2.0;
  float rippleForce = sin(ripplePhase) * u_mid * 1.5 * u_breathing;
  
  float shimmerForce = sin(u_time * 20.0 + (coord.x + coord.y) * 30.0) * u_high * 0.5;
  
  float beatImpulse = u_beatIntensity * u_beatIntensity * 5.0 * u_dose;
  beatImpulse *= (1.0 - dist * 1.5);
  
  float totalForce = radialPush + rotationalForce * 0.5 + rippleForce + shimmerForce + beatImpulse;
  totalForce += (noise.x - 0.5) * u_flow * 0.5;
  
  // Physics update
  float acceleration = totalForce * (0.5 + u_energy);
  float damping = 0.85 + u_breathing * 0.14;
  velocity = velocity * damping + acceleration * u_deltaTime;
  velocity = clamp(velocity, -3.0, 3.0);
  
  float baseSpeed = 0.3 + u_energy * 0.5;
  phase += (baseSpeed + velocity) * u_deltaTime;
  phase = mod(phase, TAU);
  
  float targetEnergy = u_energy * 0.7 + abs(velocity) * 0.3;
  float energySmooth = 0.9 + u_breathing * 0.09;
  accumulatedEnergy = mix(targetEnergy, accumulatedEnergy, energySmooth);
  
  float focusMask = 1.0 - dist * u_dose * 1.8;
  focusMask = max(focusMask, 0.15);
  accumulatedEnergy *= focusMask;
  accumulatedEnergy *= 0.6 + u_dose * 0.4;
  
  float newBeat = max(u_beatIntensity, prevBeat * 0.85);
  
  fragColor = vec4(phase, velocity, accumulatedEnergy, newBeat);
}
`;

// Render shader - transforms uploaded image through psychedelic effects
export const renderShader = `#version 300 es
precision highp float;

uniform sampler2D u_state;    // Physics state for modulation
uniform sampler2D u_noise;    // Noise for organic variation
uniform sampler2D u_image;    // User uploaded image to transform
uniform float u_time;

uniform float u_bass;
uniform float u_lowMid;
uniform float u_mid;
uniform float u_high;
uniform float u_energy;
uniform float u_beatIntensity;

uniform float u_dose;
uniform float u_symmetry;
uniform float u_recursion;
uniform float u_breathing;
uniform float u_flow;
uniform float u_saturation;

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

// Non-linear easing functions for perceptual control
float easeInQuad(float t) { return t * t; }
float easeOutQuad(float t) { return t * (2.0 - t); }
float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}
float smootherStep(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

vec2 logPolar(vec2 uv, float intensity) {
  vec2 centered = uv - 0.5;
  float r = length(centered) + 0.001;
  float theta = atan(centered.y, centered.x);
  float logR = log(r * 5.0 + 0.5) * 0.5 + 0.5;
  return mix(uv, vec2(theta / TAU + 0.5, logR), intensity);
}

// Fixed-segment kaleidoscope with intensity blend
vec2 kaleidoscopeFixed(vec2 uv, float segments) {
  vec2 centered = uv - 0.5;
  float angle = atan(centered.y, centered.x);
  float r = length(centered);
  float segmentAngle = TAU / segments;
  angle = mod(angle, segmentAngle);
  angle = abs(angle - segmentAngle * 0.5);
  return vec2(cos(angle), sin(angle)) * r + 0.5;
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 velocityPalette(float phase, float velocity, float energy, float satMod) {
  float hueShift = velocity * 0.15;
  float hue = phase / TAU + hueShift + u_time * 0.01;
  hue = fract(hue);
  
  float sat = 0.5 + energy * 0.5;
  sat *= (0.5 + satMod * 0.5);
  
  float val = 0.25 + energy * 0.5 + abs(velocity) * 0.2;
  val = min(val, 1.0);
  
  return hsv2rgb(vec3(hue, sat, val));
}

vec3 richPalette(float t, float velocity, float energy) {
  vec3 deep = vec3(0.08, 0.12, 0.35);
  vec3 warm = vec3(0.85, 0.35, 0.15);
  vec3 accent = vec3(0.6, 0.1, 0.5);
  vec3 highlight = vec3(0.2, 0.8, 0.7);
  
  float blend1 = sin(t * PI) * 0.5 + 0.5;
  float blend2 = sin(t * PI * 0.7 + velocity) * 0.5 + 0.5;
  
  vec3 base = mix(deep, warm, blend1);
  base = mix(base, accent, blend2 * 0.4);
  base = mix(base, highlight, abs(velocity) * 0.3);
  
  return base * (0.3 + energy * 0.7);
}

void main() {
  vec2 coord = v_uv;
  
  // Get state for audio-reactive modulation
  vec4 state = texture(u_state, v_uv);
  float velocity = state.y;
  float energy = state.z;
  float beat = state.w;
  
  // ===========================================
  // ENERGY LAYER MODEL
  // User sliders set BASE perceptual state
  // Audio injects ENERGY that temporarily pushes transforms beyond base
  // ===========================================
  
  // Base values from user sliders (with perceptual easing)
  float baseSymmetry = smootherStep(u_symmetry);
  float baseRecursion = easeInOutCubic(u_recursion);
  float baseBreathing = u_breathing;
  float baseFlow = easeOutQuad(u_flow);
  float baseDose = u_dose;
  
  // AUDIO ENERGY INJECTION
  // Each audio band pushes specific transforms beyond base
  // Formula: effective = base + (audioEnergy * headroom * multiplier)
  // Headroom ensures we don't exceed 1.0
  
  // Energy adds to overall dose (loudness = more intense)
  float doseEnergy = u_energy * 0.4;
  float effectiveDose = baseDose + doseEnergy * (1.0 - baseDose);
  
  // Beat pulses RECURSION (kicks create tunnel depth)
  float recursionEnergy = u_beatIntensity * 0.5 + u_bass * 0.3;
  float effectiveRecursion = baseRecursion + recursionEnergy * (1.0 - baseRecursion);
  
  // Mid frequencies push SYMMETRY (vocals/melody → tiling)
  float symmetryEnergy = u_mid * 0.4;
  float effectiveSymmetry = baseSymmetry + symmetryEnergy * (1.0 - baseSymmetry);
  
  // Bass drives BREATHING amplitude (kicks → pulsing)
  float breathingEnergy = u_bass * 0.6;
  float effectiveBreathing = baseBreathing + breathingEnergy * (1.0 - baseBreathing);
  
  // Low-mid drives FLOW intensity (bass guitar → warping)
  float flowEnergy = u_lowMid * 0.5;
  float effectiveFlow = baseFlow + flowEnergy * (1.0 - baseFlow);
  
  // ===========================================
  // APPLY TRANSFORMS with effective values
  // ===========================================
  
  // 1. RECURSION - hyperbolic depth
  float recursionIntensity = effectiveRecursion * effectiveDose * 1.5;
  if (recursionIntensity > 0.01) {
    coord = logPolar(coord, recursionIntensity);
  }
  
  // 2. SYMMETRY - kaleidoscope blend
  float symmetryRaw = effectiveSymmetry * effectiveDose;
  float symmetryStrength = pow(max(symmetryRaw, 0.0), 0.3);
  if (symmetryStrength > 0.01) {
    vec2 kCoord = kaleidoscopeFixed(coord, 6.0);
    coord = mix(coord, kCoord, symmetryStrength);
  }
  
  // 3. BREATHING - radial pulsing (bass-driven timing + amplitude)
  float breathingIntensity = effectiveBreathing * effectiveDose;
  if (breathingIntensity > 0.01) {
    vec2 centered = coord - 0.5;
    float r = length(centered);
    // Bass drives the phase speed, making breathing sync to kicks
    float breathPhase = u_time * 2.0 + u_bass * 5.0;
    float breathWave = sin(r * 8.0 - breathPhase) * 0.5 + 0.5;
    // Amplitude scales with effective breathing (base + audio energy)
    float scale = 1.0 + breathWave * breathingIntensity * 0.2;
    coord = centered * scale + 0.5;
  }
  
  // 4. FLOW - warping distortion (low-mid driven)
  float flowIntensity = effectiveFlow * effectiveDose;
  if (flowIntensity > 0.01) {
    vec4 n = texture(u_noise, coord * 0.5 + u_time * 0.02);
    vec2 flow = vec2(
      sin((n.x - 0.5) * TAU + u_time * 0.3),
      cos((n.y - 0.5) * TAU + u_time * 0.25)
    );
    coord += flow * flowIntensity * 0.18;
  }
  
  // Sample the uploaded image with transformed coordinates
  // Flip Y to correct orientation (WebGL has inverted Y)
  vec2 sampleCoord = clamp(coord, 0.001, 0.999);
  sampleCoord.y = 1.0 - sampleCoord.y;
  vec3 color = texture(u_image, sampleCoord).rgb;
  
  // 5. SATURATION - energy layer model
  // High frequencies drive saturation cycling speed
  float baseSaturation = easeInQuad(u_saturation);
  float saturationEnergy = u_high * 0.4 + u_energy * 0.2;
  float effectiveSaturation = baseSaturation + saturationEnergy * (1.0 - baseSaturation);
  
  float satRaw = effectiveSaturation * effectiveDose;
  // Front-load with pow(0.25), compress top range
  float frontLoaded = pow(max(satRaw, 0.0), 0.25);
  float satIntensity;
  if (frontLoaded < 0.7) {
    satIntensity = frontLoaded;
  } else {
    satIntensity = 0.7 + (frontLoaded - 0.7) * 0.7;
  }
  
  if (satIntensity > 0.005) {
    vec3 hsv = rgb2hsv(color);
    
    // PHASE 1 (0-0.2): VIVID - colors POP hard
    float vividPhase = smoothstep(0.0, 0.2, satIntensity);
    hsv.y = hsv.y * (1.0 + vividPhase * 2.5);
    hsv.y = min(hsv.y, 1.0);
    
    // PHASE 2 (0.15-0.4): Color separation - distinct bands
    float separationPhase = smoothstep(0.15, 0.4, satIntensity);
    if (separationPhase > 0.0) {
      float hueBands = 8.0 - separationPhase * 5.0;
      float quantizedHue = floor(hsv.x * hueBands + 0.5) / hueBands;
      hsv.x = mix(hsv.x, quantizedHue, separationPhase * 0.8);
    }
    
    // PHASE 3 (0.35-0.65): Hue rotation - HIGH FREQUENCIES drive speed
    float rotationPhase = smoothstep(0.35, 0.65, satIntensity);
    if (rotationPhase > 0.0) {
      // High frequencies accelerate hue cycling
      float hueSpeed = 0.4 + u_high * 1.5;
      float hueShift = u_time * hueSpeed;
      hueShift += sin(v_uv.x * 6.0 + v_uv.y * 5.0) * 0.25;
      hsv.x = fract(hsv.x + hueShift * rotationPhase);
    }
    
    // PHASE 4 (0.55-1.0): Psychedelic - rainbow cycling + inversion
    float psychPhase = smoothstep(0.55, 1.0, satIntensity);
    if (psychPhase > 0.0) {
      // Rainbow cycling - energy drives speed
      float lumaHue = hsv.z * 1.5 + u_time * (0.5 + u_energy * 0.8);
      hsv.x = fract(mix(hsv.x, lumaHue, psychPhase * 0.9));
      
      // Inversion blend
      vec3 inverted = vec3(1.0) - color;
      vec3 invertedHsv = rgb2hsv(inverted);
      hsv.x = fract(mix(hsv.x, invertedHsv.x, psychPhase * 0.5));
      
      // Max saturation
      hsv.y = mix(hsv.y, 1.0, psychPhase * 0.8);
    }
    
    // Contrast boost
    float contrast = 1.0 + satIntensity * 1.5;
    hsv.z = (hsv.z - 0.5) * contrast + 0.5;
    hsv.z = clamp(hsv.z, 0.0, 1.0);
    
    // Energy brightness pulse
    hsv.z *= 1.0 + u_energy * satIntensity * 0.3;
    hsv.z = min(hsv.z, 1.0);
    
    color = hsv2rgb(hsv);
  }
  
  // High frequency shimmer overlay
  vec3 shimmer = vec3(
    sin(u_time * 12.0 + v_uv.x * 30.0) * 0.5 + 0.5,
    sin(u_time * 12.0 + v_uv.y * 30.0 + 2.0) * 0.5 + 0.5,
    sin(u_time * 12.0 + (v_uv.x + v_uv.y) * 15.0 + 4.0) * 0.5 + 0.5
  );
  color += shimmer * u_high * effectiveSaturation * effectiveDose * 0.12;
  
  // Beat flash - brief white pulse
  color = mix(color, vec3(1.0, 0.98, 0.95), beat * effectiveDose * 0.35);
  
  // Vignette
  float dist = length(v_uv - 0.5);
  float vignette = 1.0 - dist * effectiveDose * 1.2;
  vignette = smoothstep(0.0, 1.0, vignette);
  vignette = max(vignette, 0.2);
  color *= vignette;
  
  // Final adjustments
  color = clamp(color, 0.0, 1.0);
  color = pow(color, vec3(1.0 / 2.2)); // Gamma
  
  fragColor = vec4(color, 1.0);
}
`;

export const copyShader = `#version 300 es
precision highp float;

uniform sampler2D u_source;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_source, v_uv);
}
`;
