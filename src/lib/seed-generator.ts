/**
 * Generate a unique seed for the visualizer session
 * Format: SOMA-[timestamp]-[random]
 */
export function generateSeed(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SOMA-${timestamp}-${random}`;
}

/**
 * Parse a seed to extract deterministic values
 */
export function parseSeed(seed: string): {
  timestamp: number;
  random: string;
  hash: number;
} {
  const parts = seed.split('-');
  const timestamp = parseInt(parts[1], 36);
  const random = parts[2];
  
  // Generate a hash from the seed for deterministic randomness
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  return { timestamp, random, hash };
}

/**
 * Generate a seeded random number (0-1)
 * Using a simple but effective pseudo-random generator
 */
export function seededRandom(seed: string, index: number = 0): number {
  const { hash } = parseSeed(seed);
  const x = Math.sin(hash + index) * 10000;
  return x - Math.floor(x);
}
