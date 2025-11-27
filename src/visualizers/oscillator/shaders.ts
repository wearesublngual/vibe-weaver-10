/**
 * GLSL Shaders for Perceptual Visualizer
 * Simpler, working foundation with audio reactivity
 */

// Shared vertex shader - fullscreen triangle
export const vertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Simpler update shader - wave interference with audio
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

// Params (0-1, already perceptually mapped)
uniform float u_depth;
uniform float u_curvature;
uniform float u_turbulence;
uniform float u_branching;
uniform float u_persistence;
uniform float u_focus;

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

// Smooth noise lookup
float getNoise(vec2 uv, float scale) {
  return texture(u_noise, uv * scale).x;
}

// Log-polar for tunnel effect
vec2 logPolar(vec2 uv, float intensity) {
  vec2 centered = uv - 0.5;
  float r = length(centered) + 0.001;
  float theta = atan(centered.y, centered.x);
  float logR = log(r * 5.0 + 0.5) * 0.5 + 0.5;
  return mix(uv, vec2(theta / TAU + 0.5, logR), intensity);
}

// Kaleidoscope symmetry
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
  // Get previous state
  vec4 prevState = texture(u_state, v_uv);
  float prevPhase = prevState.x;
  float prevEnergy = prevState.y;
  
  // Transform coordinates based on params
  vec2 coord = v_uv;
  
  // Apply curvature (log-polar tunnel)
  if (u_curvature > 0.01) {
    coord = logPolar(coord, u_curvature * 0.7);
  }
  
  // Apply branching (kaleidoscope symmetry)
  float segments = 3.0 + u_branching * 9.0; // 3-12 segments
  if (u_branching > 0.1) {
    coord = kaleidoscope(coord, segments);
  }
  
  // Center distance for radial effects
  float dist = length(v_uv - 0.5);
  float angle = atan(v_uv.y - 0.5, v_uv.x - 0.5);
  
  // Read noise for organic movement
  vec4 noise = texture(u_noise, v_uv * 2.0);
  float flowNoise = noise.x;
  float colorNoise = noise.y;
  
  // === AUDIO-DRIVEN WAVE GENERATION ===
  
  // Bass creates slow, powerful radial pulses
  float bassPulse = sin(dist * 8.0 - u_time * 2.0 - u_bass * 4.0) * u_bass;
  
  // Low-mid creates rotating spiral arms
  float spiralCount = 3.0 + u_depth * 5.0;
  float spiral = sin(angle * spiralCount + dist * 10.0 - u_time * 1.5 + u_lowMid * 3.0) * u_lowMid;
  
  // Mid frequencies create ripples from center
  float ripples = sin(dist * (15.0 + u_mid * 20.0) - u_time * 3.0) * u_mid * 0.7;
  
  // Highs add shimmer texture
  float shimmer = sin((coord.x + coord.y) * 50.0 + u_time * 8.0) * u_high * 0.3;
  
  // Combine waves - audio drives the mix
  float wave = bassPulse * 0.5 + spiral * 0.3 + ripples * 0.15 + shimmer * 0.05;
  
  // Add noise for organic feel, scaled by turbulence
  wave += (flowNoise - 0.5) * u_turbulence * 0.3;
  
  // Beat injection - sudden brightness on beats
  float beatPush = u_beatIntensity * (1.0 - dist * 1.5);
  
  // === PHASE AND ENERGY CALCULATION ===
  
  // Phase accumulates based on audio energy and wave position
  float phaseSpeed = 0.5 + u_energy * 2.0 + wave * 0.5;
  float newPhase = prevPhase + phaseSpeed * u_deltaTime;
  newPhase = mod(newPhase, TAU);
  
  // Energy tracks overall visual intensity
  // Persistence controls how much previous frame bleeds through
  float targetEnergy = abs(wave) + u_energy * 0.5 + beatPush;
  float energySmooth = mix(0.1, 0.95, u_persistence); // Higher persistence = more trail
  float newEnergy = mix(targetEnergy, prevEnergy, energySmooth);
  
  // Focus affects center vs periphery energy
  float focusMask = 1.0 - dist * u_focus * 2.0;
  focusMask = clamp(focusMask, 0.2, 1.0);
  newEnergy *= focusMask;
  
  // Depth affects overall complexity/density
  newEnergy *= 0.5 + u_depth * 0.5;
  
  // Store: phase, energy, wave value, beat
  fragColor = vec4(newPhase, newEnergy, wave * 0.5 + 0.5, beatPush);
}
`;

// Render shader - converts state to beautiful colors
export const renderShader = `#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform sampler2D u_noise;
uniform float u_time;

uniform float u_bass;
uniform float u_energy;
uniform float u_beatIntensity;

uniform float u_curvature;
uniform float u_persistence;
uniform float u_focus;
uniform float u_branching;
uniform float u_depth;
uniform float u_turbulence;

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

// Attempt: Attempt to apply curvature (log-polar tunnel)
vec2 logPolar(vec2 uv, float intensity) {
  vec2 centered = uv - 0.5;
  float r = length(centered) + 0.001;
  float theta = atan(centered.y, centered.x);
  float logR = log(r * 5.0 + 0.5) * 0.5 + 0.5;
  return mix(uv, vec2(theta / TAU + 0.5, logR), intensity);
}

// Attempt: Kaleidoscope symmetry
vec2 kaleidoscope(vec2 uv, float segments) {
  vec2 centered = uv - 0.5;
  float angle = atan(centered.y, centered.x);
  float r = length(centered);
  float segmentAngle = TAU / segments;
  angle = mod(angle, segmentAngle);
  angle = abs(angle - segmentAngle * 0.5);
  return vec2(cos(angle), sin(angle)) * r + 0.5;
}

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Attempt: Attempt to apply palette
vec3 palette(float t, float energy, float wave) {
  // Attempt: Deep, rich colors that shift with the music
  float hue = t / TAU + wave * 0.2 + u_time * 0.02;
  hue = fract(hue);
  
  // Attempt: Saturation based on energy - more energy = more vivid
  float sat = 0.6 + energy * 0.4;
  
  // Attempt: Value/brightness - energy drives it
  float val = 0.3 + energy * 0.7;
  
  return hsv2rgb(vec3(hue, sat, val));
}

// Attempt: Alternative complementary palette
vec3 complementary(float t, float energy) {
  // Attempt: Oscillate between deep blue and warm orange
  vec3 color1 = vec3(0.1, 0.2, 0.6); // Deep blue
  vec3 color2 = vec3(0.8, 0.4, 0.1); // Warm orange
  vec3 color3 = vec3(0.6, 0.1, 0.4); // Purple
  
  float blend = sin(t) * 0.5 + 0.5;
  float blend2 = sin(t * 1.5 + 1.0) * 0.5 + 0.5;
  
  vec3 base = mix(color1, color2, blend);
  base = mix(base, color3, blend2 * 0.3);
  
  return base * (0.4 + energy * 0.6);
}

void main() {
  // Transform coordinates to match update shader
  vec2 coord = v_uv;
  
  if (u_curvature > 0.01) {
    coord = logPolar(coord, u_curvature * 0.7);
  }
  
  float segments = 3.0 + u_branching * 9.0;
  if (u_branching > 0.1) {
    coord = kaleidoscope(coord, segments);
  }
  
  // Read state
  vec4 state = texture(u_state, coord);
  float phase = state.x;
  float energy = state.y;
  float wave = state.z * 2.0 - 1.0; // Unpack from 0-1 to -1 to 1
  float beat = state.w;
  
  // Get noise for color variation
  vec4 noise = texture(u_noise, v_uv);
  
  // Generate color
  vec3 color = palette(phase, energy, wave);
  
  // Mix in complementary colors for richness
  vec3 comp = complementary(phase + noise.y * 0.5, energy);
  color = mix(color, comp, 0.3 + u_turbulence * 0.2);
  
  // Focus vignette - darken edges
  float dist = length(v_uv - 0.5);
  float vignette = 1.0 - dist * u_focus * 1.5;
  vignette = smoothstep(0.0, 1.0, vignette);
  vignette = max(vignette, 0.2); // Never go fully black
  
  // Beat flash - white flash on strong beats
  color += vec3(1.0) * beat * 0.4;
  
  // Persistence glow effect
  float glow = 1.0 + u_persistence * 0.3;
  
  // Apply modifiers
  color *= vignette * glow;
  
  // Ensure minimum visibility
  color = max(color, vec3(0.02));
  
  // Gamma correction
  color = pow(color, vec3(1.0 / 2.2));
  
  fragColor = vec4(color, 1.0);
}
`;

// Copy shader for initialization
export const copyShader = `#version 300 es
precision highp float;

uniform sampler2D u_source;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_source, v_uv);
}
`;
