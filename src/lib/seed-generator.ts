/**
 * Session Seed Generator for SOMA Visualizer
 * Encodes/decodes all slider states into a shareable seed string
 */

import { VisualizerParams, AudioEffectParams, DEFAULT_PARAMS, DEFAULT_AUDIO_PARAMS } from '@/visualizers/types';

/**
 * Generate a random seed (for display only, not state-based)
 */
export function generateSeed(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SR-${timestamp}${random}`;
}

/**
 * Encode current visualizer state into a shareable seed
 * Format: SR-[18 hex chars] = 9 bytes for all params
 */
export function encodeSeed(params: VisualizerParams, audioParams: AudioEffectParams): string {
  const bytes: number[] = [];
  
  // Visual params (6 values, 0-1 → 0-255)
  bytes.push(Math.round(params.dose * 255));
  bytes.push(Math.round(params.symmetry * 255));
  bytes.push(Math.round(params.recursion * 255));
  bytes.push(Math.round(params.breathing * 255));
  bytes.push(Math.round(params.flow * 255));
  bytes.push(Math.round(params.saturation * 255));
  
  // Audio params (3 values, 0-1 → 0-255)
  bytes.push(Math.round(audioParams.echo * 255));
  bytes.push(Math.round(audioParams.drift * 255));
  bytes.push(Math.round(audioParams.break_ * 255));
  
  // Convert to hex string
  const hex = bytes
    .map(b => Math.min(255, Math.max(0, b)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  
  return `SR-${hex}`;
}

/**
 * Decode a seed string back into visualizer params
 * Returns null if invalid seed
 */
export function decodeSeed(seedStr: string): { params: VisualizerParams; audioParams: AudioEffectParams } | null {
  if (!seedStr) return null;
  
  let s = seedStr.trim().toUpperCase();
  if (s.startsWith('SR-')) s = s.slice(3);
  
  // Should be 18 hex characters (9 bytes)
  if (!/^[0-9A-F]{18}$/.test(s)) {
    return null;
  }
  
  // Parse hex bytes
  const bytes: number[] = [];
  for (let i = 0; i < 18; i += 2) {
    bytes.push(parseInt(s.slice(i, i + 2), 16));
  }
  
  // Decode visual params (bytes 0-5)
  const params: VisualizerParams = {
    dose: bytes[0] / 255,
    symmetry: bytes[1] / 255,
    recursion: bytes[2] / 255,
    breathing: bytes[3] / 255,
    flow: bytes[4] / 255,
    saturation: bytes[5] / 255,
  };
  
  // Decode audio params (bytes 6-8)
  const audioParams: AudioEffectParams = {
    echo: bytes[6] / 255,
    drift: bytes[7] / 255,
    break_: bytes[8] / 255,
  };
  
  return { params, audioParams };
}

/**
 * Validate a seed string format
 */
export function isValidSeed(seedStr: string): boolean {
  if (!seedStr) return false;
  let s = seedStr.trim().toUpperCase();
  if (s.startsWith('SR-')) s = s.slice(3);
  return /^[0-9A-F]{18}$/.test(s);
}
