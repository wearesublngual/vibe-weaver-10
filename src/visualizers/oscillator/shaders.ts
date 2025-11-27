/**
 * GLSL Shaders for Perceptual Audio-Reactive Visualizer
 * Key insight: Map audio to VELOCITY not just position
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

// Update shader - physics-based with audio driving forces
export const updateShader = `#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform sampler2D u_noise;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_deltaTime;

// Audio - these drive the FORCES, not positions
uniform float u_bass;
uniform float u_lowMid;
uniform float u_mid;
uniform float u_high;
uniform float u_energy;
uniform float u_beatIntensity;

// Params
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

// Log-polar for tunnel effect
vec2 logPolar(vec2 uv, float intensity) {
  vec2 centered = uv - 0.5;
  float r = length(centered) + 0.001;
  float theta = atan(centered.y, centered.x);
  float logR = log(r * 5.0 + 0.5) * 0.5 + 0.5;
  return mix(uv, vec2(theta / TAU + 0.5, logR), intensity);
}

// Kaleidoscope
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
  float velocity = prevState.y; // Track velocity, not just position!
  float accumulatedEnergy = prevState.z;
  float prevBeat = prevState.w;
  
  // Coordinate transforms
  vec2 coord = v_uv;
  if (u_curvature > 0.01) {
    coord = logPolar(coord, u_curvature * 0.8);
  }
  
  float segments = 3.0 + u_branching * 9.0;
  if (u_branching > 0.1) {
    coord = kaleidoscope(coord, segments);
  }
  
  // Spatial info
  float dist = length(v_uv - 0.5);
  float angle = atan(v_uv.y - 0.5, v_uv.x - 0.5);
  
  // Noise for organic feel
  vec4 noise = texture(u_noise, v_uv * 2.0 + u_time * 0.01);
  
  // === AUDIO-DRIVEN FORCES ===
  // Key insight: Audio drives ACCELERATION, which affects velocity, which affects position
  // This creates physics-based motion that "feels" the music
  
  // Bass creates radial force (push outward from center on kick)
  float bassForce = u_bass * u_bass * 3.0; // Square for punch
  float radialPush = bassForce * (1.0 - dist * 2.0); // Stronger at center
  
  // Low-mid creates rotational force
  float rotationalForce = u_lowMid * 2.0;
  
  // Mid creates ripple force
  float ripplePhase = dist * 15.0 - u_time * 2.0;
  float rippleForce = sin(ripplePhase) * u_mid * 1.5;
  
  // High creates shimmer (high frequency oscillation)
  float shimmerForce = sin(u_time * 20.0 + (coord.x + coord.y) * 30.0) * u_high * 0.5;
  
  // Beat creates impulse force
  float beatImpulse = u_beatIntensity * u_beatIntensity * 5.0; // Square for punch
  beatImpulse *= (1.0 - dist * 1.5); // Centered
  
  // Combine forces
  float totalForce = radialPush + rotationalForce * 0.5 + rippleForce + shimmerForce + beatImpulse;
  
  // Add noise-based turbulence
  totalForce += (noise.x - 0.5) * u_turbulence * 0.5;
  
  // === PHYSICS UPDATE ===
  
  // Acceleration from forces
  float acceleration = totalForce * (0.5 + u_energy);
  
  // Update velocity with damping (persistence controls damping)
  float damping = 0.85 + u_persistence * 0.14; // 0.85-0.99
  velocity = velocity * damping + acceleration * u_deltaTime;
  
  // Clamp velocity to prevent instability
  velocity = clamp(velocity, -3.0, 3.0);
  
  // Update phase based on velocity (velocity -> position change)
  float baseSpeed = 0.3 + u_energy * 0.5;
  phase += (baseSpeed + velocity) * u_deltaTime;
  phase = mod(phase, TAU);
  
  // Accumulated energy for color intensity
  float targetEnergy = u_energy * 0.7 + abs(velocity) * 0.3;
  float energySmooth = 0.9 + u_persistence * 0.09;
  accumulatedEnergy = mix(targetEnergy, accumulatedEnergy, energySmooth);
  
  // Focus: reduce energy at edges
  float focusMask = 1.0 - dist * u_focus * 1.8;
  focusMask = max(focusMask, 0.15);
  accumulatedEnergy *= focusMask;
  
  // Depth affects overall complexity
  accumulatedEnergy *= 0.6 + u_depth * 0.4;
  
  // Beat pulse (decaying)
  float newBeat = max(u_beatIntensity, prevBeat * 0.85);
  
  fragColor = vec4(phase, velocity, accumulatedEnergy, newBeat);
}
`;

// Render shader - beautiful colors from physics state
export const renderShader = `#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform sampler2D u_noise;
uniform float u_time;

uniform float u_bass;
uniform float u_energy;
uniform float u_beatIntensity;

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

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Attempt: Attempt to apply palette based on velocity
vec3 velocityPalette(float phase, float velocity, float energy) {
  // Velocity affects hue - positive = warm, negative = cool
  float hueShift = velocity * 0.15;
  float hue = phase / TAU + hueShift + u_time * 0.01;
  hue = fract(hue);
  
  // Energy affects saturation - more energy = more vivid
  float sat = 0.5 + energy * 0.5;
  
  // Absolute velocity affects brightness - motion = light
  float val = 0.25 + energy * 0.5 + abs(velocity) * 0.2;
  val = min(val, 1.0);
  
  return hsv2rgb(vec3(hue, sat, val));
}

// Rich complementary palette
vec3 richPalette(float t, float velocity, float energy) {
  // Base colors that shift with time and velocity
  vec3 deep = vec3(0.08, 0.12, 0.35);   // Deep blue
  vec3 warm = vec3(0.85, 0.35, 0.15);    // Warm orange
  vec3 accent = vec3(0.6, 0.1, 0.5);     // Purple accent
  vec3 highlight = vec3(0.2, 0.8, 0.7);  // Cyan highlight
  
  float blend1 = sin(t * PI) * 0.5 + 0.5;
  float blend2 = sin(t * PI * 0.7 + velocity) * 0.5 + 0.5;
  
  vec3 base = mix(deep, warm, blend1);
  base = mix(base, accent, blend2 * 0.4);
  
  // Velocity shifts toward highlight colors
  base = mix(base, highlight, abs(velocity) * 0.3);
  
  // Energy intensifies
  return base * (0.3 + energy * 0.7);
}

void main() {
  vec2 coord = v_uv;
  
  if (u_curvature > 0.01) {
    coord = logPolar(coord, u_curvature * 0.8);
  }
  
  float segments = 3.0 + u_branching * 9.0;
  if (u_branching > 0.1) {
    coord = kaleidoscope(coord, segments);
  }
  
  vec4 state = texture(u_state, coord);
  float phase = state.x;
  float velocity = state.y;
  float energy = state.z;
  float beat = state.w;
  
  vec4 noise = texture(u_noise, v_uv);
  
  // Color from velocity-aware palette
  vec3 color = velocityPalette(phase, velocity, energy);
  
  // Blend with rich palette
  vec3 rich = richPalette(phase, velocity, energy);
  color = mix(color, rich, 0.4 + u_turbulence * 0.3);
  
  // Add subtle noise variation
  color += (noise.xyz - 0.5) * 0.05 * u_turbulence;
  
  // Focus vignette
  float dist = length(v_uv - 0.5);
  float vignette = 1.0 - dist * u_focus * 1.4;
  vignette = smoothstep(0.0, 1.0, vignette);
  vignette = max(vignette, 0.15);
  
  // Beat flash - white/bright pulse
  vec3 beatColor = vec3(1.0, 0.95, 0.9);
  color = mix(color, beatColor, beat * 0.5);
  
  // Apply vignette
  color *= vignette;
  
  // Persistence glow
  color *= 1.0 + u_persistence * 0.2;
  
  // Ensure visibility
  color = max(color, vec3(0.015));
  
  // Gamma correction
  color = pow(color, vec3(1.0 / 2.2));
  
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
