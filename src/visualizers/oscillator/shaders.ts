/**
 * GLSL Shaders for Coupled Oscillator Simulation
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

// Oscillator physics update shader
export const updateShader = `#version 300 es
precision highp float;

uniform sampler2D u_state;      // Current oscillator phases (in .x)
uniform sampler2D u_noise;      // Perlin noise texture
uniform vec2 u_resolution;      // Simulation grid size
uniform float u_time;
uniform float u_deltaTime;

// Audio reactive uniforms
uniform float u_bass;
uniform float u_lowMid;
uniform float u_mid;
uniform float u_high;
uniform float u_energy;
uniform float u_beatIntensity;

// Parameter uniforms (0-1 mapped to perceptual zones)
uniform float u_depth;          // Kernel radius
uniform float u_curvature;      // Log-polar intensity
uniform float u_turbulence;     // Chaos/order balance
uniform float u_branching;      // Symmetry/kaleidoscope
uniform float u_persistence;    // Phase retention
uniform float u_focus;          // Center weighting

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

// Coupling kernel - determines how neighbors influence each other
float couplingKernel(float dist, float maxDist) {
  // Mexican hat wavelet style: positive center, negative ring, positive outer
  float normalized = dist / maxDist;
  
  // Inner positive coupling (sync)
  float inner = exp(-normalized * normalized * 8.0) * 1.0;
  
  // Middle negative coupling (anti-sync) 
  float middle = -exp(-pow(normalized - 0.4, 2.0) * 20.0) * 0.6;
  
  // Outer weak positive
  float outer = exp(-pow(normalized - 0.8, 2.0) * 10.0) * 0.2;
  
  return inner + middle + outer;
}

// Log-polar transform for tunnel/mandala effects
vec2 logPolar(vec2 uv, float intensity) {
  vec2 centered = uv - 0.5;
  float r = length(centered);
  float theta = atan(centered.y, centered.x);
  
  // Mix between cartesian and log-polar
  float logR = log(r * 10.0 + 1.0) / 3.0;
  vec2 polar = vec2(theta / TAU + 0.5, logR);
  
  return mix(uv, polar, intensity);
}

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  
  // Apply log-polar if curvature > 0
  vec2 sampleUV = v_uv;
  if (u_curvature > 0.01) {
    sampleUV = logPolar(v_uv, u_curvature * 0.5);
  }
  
  // Current phase
  float phase = texture(u_state, sampleUV).x;
  
  // Read noise for organic variation
  vec4 noiseVal = texture(u_noise, v_uv);
  float freqNoise = noiseVal.x;
  float couplingNoise = noiseVal.y;
  vec2 flowField = (noiseVal.zw - 0.5) * 2.0;
  
  // Natural frequency: driven by audio
  // Bass creates slow, powerful pulses
  // Highs create shimmer
  float baseFreq = 0.5 + u_bass * 2.0 + u_high * 0.5;
  
  // Perlin modulates frequency spatially
  float naturalFreq = baseFreq * (0.8 + freqNoise * 0.4);
  
  // Add some variation based on position for complexity
  naturalFreq *= 1.0 + sin(v_uv.x * PI * u_branching * 8.0) * 0.1;
  naturalFreq *= 1.0 + cos(v_uv.y * PI * u_branching * 8.0) * 0.1;
  
  // Kernel radius based on depth parameter
  float kernelRadius = 3.0 + u_depth * 12.0; // 3-15 pixels
  int kernelSize = int(kernelRadius);
  
  // Coupling strength: energy increases sync, turbulence decreases it
  float couplingStrength = (0.3 + u_energy * 0.7) * (1.0 - u_turbulence * 0.5);
  couplingStrength *= (0.8 + couplingNoise * 0.4); // Perlin variation
  
  // Sum coupling from neighbors (Kuramoto model)
  float coupling = 0.0;
  float totalWeight = 0.0;
  
  for (int dy = -kernelSize; dy <= kernelSize; dy++) {
    for (int dx = -kernelSize; dx <= kernelSize; dx++) {
      if (dx == 0 && dy == 0) continue;
      
      float dist = length(vec2(float(dx), float(dy)));
      if (dist > kernelRadius) continue;
      
      // Get kernel weight
      float weight = couplingKernel(dist, kernelRadius);
      
      // Focus parameter: weight center more
      float centerDist = length(v_uv - 0.5);
      weight *= 1.0 + (1.0 - centerDist) * u_focus;
      
      // Sample neighbor phase
      vec2 neighborUV = sampleUV + vec2(float(dx), float(dy)) * texelSize;
      float neighborPhase = texture(u_state, neighborUV).x;
      
      // Kuramoto coupling: sin(neighbor - self)
      coupling += weight * sin(neighborPhase - phase);
      totalWeight += abs(weight);
    }
  }
  
  if (totalWeight > 0.0) {
    coupling /= totalWeight;
  }
  
  // Phase update: dθ/dt = ω + K * coupling
  float dPhase = naturalFreq + couplingStrength * coupling * 5.0;
  
  // Beat injection: sudden phase push on beat
  dPhase += u_beatIntensity * 3.0 * (freqNoise - 0.5);
  
  // Flow field influence for organic drift
  dPhase += dot(flowField, v_uv - 0.5) * u_turbulence * 0.5;
  
  // Update phase with persistence (higher = more tracer-like)
  float newPhase = phase + dPhase * u_deltaTime;
  
  // Wrap to [0, TAU]
  newPhase = mod(newPhase, TAU);
  
  // Store phase and some derived values
  fragColor = vec4(newPhase, coupling, u_energy, 1.0);
}
`;

// Render shader - converts phase to colors
export const renderShader = `#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform sampler2D u_noise;
uniform float u_time;

// Audio
uniform float u_bass;
uniform float u_energy;
uniform float u_beatIntensity;

// Params
uniform float u_curvature;
uniform float u_persistence;
uniform float u_focus;
uniform float u_branching;

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Smooth rainbow based on phase
vec3 phaseToColor(float phase, float coupling, float energy) {
  // Base hue from phase
  float hue = phase / TAU;
  
  // Coupling affects saturation - more sync = more saturated
  float saturation = 0.6 + abs(coupling) * 0.4;
  
  // Energy affects value/brightness
  float value = 0.5 + energy * 0.5;
  
  return hsv2rgb(vec3(hue, saturation, value));
}

// Complementary color scheme
vec3 complementaryColor(float phase, float energy) {
  float t = phase / TAU;
  
  // Oscillate between two complementary colors
  vec3 color1 = vec3(0.1, 0.3, 0.8); // Deep blue
  vec3 color2 = vec3(0.9, 0.6, 0.2); // Warm orange
  
  float blend = sin(t * PI) * 0.5 + 0.5;
  vec3 base = mix(color1, color2, blend);
  
  // Energy brightens
  return base * (0.6 + energy * 0.4);
}

void main() {
  vec4 state = texture(u_state, v_uv);
  float phase = state.x;
  float coupling = state.y;
  float energy = state.z;
  
  // Get noise for color variation
  vec4 noise = texture(u_noise, v_uv);
  
  // Base color from phase
  vec3 color = phaseToColor(phase, coupling, energy);
  
  // Mix in complementary for richness
  vec3 comp = complementaryColor(phase + noise.x * 0.5, energy);
  color = mix(color, comp, 0.3);
  
  // Focus vignette
  float dist = length(v_uv - 0.5);
  float vignette = 1.0 - dist * u_focus * 1.5;
  vignette = smoothstep(0.0, 1.0, vignette);
  
  // Beat flash
  color += vec3(1.0) * u_beatIntensity * 0.3;
  
  // Persistence glow (previous frame would blend here in full impl)
  float glow = 1.0 + u_persistence * 0.5;
  
  // Final color
  color *= vignette * glow;
  
  // Gamma correction
  color = pow(color, vec3(1.0 / 2.2));
  
  fragColor = vec4(color, 1.0);
}
`;

// Simple copy shader for ping-pong
export const copyShader = `#version 300 es
precision highp float;

uniform sampler2D u_source;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_source, v_uv);
}
`;
