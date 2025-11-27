/**
 * Perlin Noise Generation
 * Creates smooth, organic noise for visual modulation
 */

// Permutation table for noise generation
const PERM = new Uint8Array(512);
const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

// Initialize permutation table with seed
export function initPerlin(seed: number = 0) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  
  // Fisher-Yates shuffle with seed
  let random = seedRandom(seed);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  
  for (let i = 0; i < 512; i++) {
    PERM[i] = p[i & 255];
  }
}

function seedRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function dot3(g: number[], x: number, y: number, z: number): number {
  return g[0] * x + g[1] * y + g[2] * z;
}

/**
 * 3D Perlin noise
 * Returns value in range [-1, 1]
 */
export function noise3D(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  
  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;
  
  return lerp(
    lerp(
      lerp(
        dot3(GRAD3[PERM[AA] % 12], x, y, z),
        dot3(GRAD3[PERM[BA] % 12], x - 1, y, z),
        u
      ),
      lerp(
        dot3(GRAD3[PERM[AB] % 12], x, y - 1, z),
        dot3(GRAD3[PERM[BB] % 12], x - 1, y - 1, z),
        u
      ),
      v
    ),
    lerp(
      lerp(
        dot3(GRAD3[PERM[AA + 1] % 12], x, y, z - 1),
        dot3(GRAD3[PERM[BA + 1] % 12], x - 1, y, z - 1),
        u
      ),
      lerp(
        dot3(GRAD3[PERM[AB + 1] % 12], x, y - 1, z - 1),
        dot3(GRAD3[PERM[BB + 1] % 12], x - 1, y - 1, z - 1),
        u
      ),
      v
    ),
    w
  );
}

/**
 * Fractal Brownian Motion - layered noise for natural textures
 */
export function fbm(
  x: number, 
  y: number, 
  z: number, 
  octaves: number = 4,
  lacunarity: number = 2.0,
  gain: number = 0.5
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency);
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  
  return value / maxValue;
}

/**
 * Generate a 2D noise texture for use in shaders
 * Returns Float32Array with RGBA values
 */
export function generateNoiseTexture(
  width: number, 
  height: number, 
  scale: number = 4,
  time: number = 0
): Float32Array {
  const data = new Float32Array(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const nx = x / width * scale;
      const ny = y / height * scale;
      
      // Multiple noise layers for different purposes
      data[i] = fbm(nx, ny, time * 0.1, 4) * 0.5 + 0.5;           // Natural frequency variation
      data[i + 1] = fbm(nx + 100, ny + 100, time * 0.05, 3) * 0.5 + 0.5; // Coupling variation
      data[i + 2] = fbm(nx * 2, ny * 2, time * 0.2, 2) * 0.5 + 0.5;      // Flow field X
      data[i + 3] = fbm(nx * 2 + 50, ny * 2 + 50, time * 0.2, 2) * 0.5 + 0.5; // Flow field Y
    }
  }
  
  return data;
}

// Initialize with default seed
initPerlin(42);
