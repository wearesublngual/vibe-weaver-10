/**
 * Perceptual Zone Mapping
 * 
 * Transforms linear slider values (0-1) into perceptual zones:
 * - 0-40%: Subtle, safe, pretty for everyone
 * - 40-80%: Expressive, lush, never incoherent
 * - 80-100%: Experimental, but with guardrails
 */

// Smooth S-curve for gentle transitions between zones
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Ease-in-out cubic for natural feeling curves
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Maps a linear value to perceptual zones
 * 0.0-0.4 → 0.0-0.2 (subtle zone - compressed)
 * 0.4-0.8 → 0.2-0.7 (expressive zone - expanded, sweet spot)
 * 0.8-1.0 → 0.7-1.0 (experimental zone - careful expansion)
 */
export function mapToPerceptualZone(linear: number): number {
  if (linear <= 0.4) {
    // Subtle zone: very gentle, compressed response
    return easeInOutCubic(linear / 0.4) * 0.2;
  } else if (linear <= 0.8) {
    // Expressive zone: this is the sweet spot, expand it
    const normalized = (linear - 0.4) / 0.4;
    return 0.2 + smoothstep(0, 1, normalized) * 0.5;
  } else {
    // Experimental zone: careful expansion with guardrails
    const normalized = (linear - 0.8) / 0.2;
    return 0.7 + easeInOutCubic(normalized) * 0.3;
  }
}

/**
 * Audio reactivity mapping - makes audio response more musical
 * Low values: subtle breathing
 * Mid values: clear, satisfying pulses
 * High values: expressive but controlled
 */
export function mapAudioReactivity(audioLevel: number, intensity: number): number {
  // Apply intensity as a multiplier but with soft ceiling
  const scaled = audioLevel * (0.3 + intensity * 0.7);
  
  // Smooth the response to avoid jitter
  // Use a soft-knee compression curve
  const threshold = 0.3;
  if (scaled <= threshold) {
    return scaled * 0.5; // Quiet parts are subtle
  } else {
    // Louder parts are more responsive but compressed
    const overshoot = scaled - threshold;
    return threshold * 0.5 + overshoot * 0.8;
  }
}

/**
 * Speed/motion mapping - prevents things from getting too fast
 */
export function mapSpeed(baseSpeed: number, storm: number): number {
  // Storm affects speed but with diminishing returns at high values
  const stormEffect = Math.sqrt(storm) * 0.5; // Square root for gentler curve
  return baseSpeed * (1 + stormEffect);
}

/**
 * Density mapping - controls visual complexity
 */
export function mapDensity(baseDensity: number, seafloor: number): number {
  // Seafloor increases density but caps at reasonable levels
  const seafloorMapped = mapToPerceptualZone(seafloor);
  return baseDensity * (1 + seafloorMapped * 1.5);
}

/**
 * Brightness/glow mapping for beacon
 */
export function mapBeacon(beacon: number): {
  centerGlow: number;
  peripheralDim: number;
  saturationBoost: number;
} {
  const mapped = mapToPerceptualZone(beacon);
  return {
    centerGlow: 0.3 + mapped * 0.7,
    peripheralDim: 1 - mapped * 0.3,
    saturationBoost: mapped * 0.4,
  };
}
