/**
 * Visualizer Types - Perceptual Effect Model
 * 
 * Based on DMT phenomenology progression:
 * - DOSE controls overall intensity/transformation depth
 * - 5 effects control specific perceptual dimensions
 */

export interface AudioData {
  bass: number;        // 20-150Hz - kick drums, sub bass
  lowMid: number;      // 150-500Hz - bass guitar, low vocals
  mid: number;         // 500-2000Hz - vocals, guitars
  high: number;        // 2000-8000Hz - cymbals, brightness
  energy: number;      // Overall loudness (RMS)
  beatIntensity: number; // Beat detection strength
  beatDetected?: boolean; // Backwards compatibility
}

// New perceptual effect model
export interface VisualizerParams {
  // Master intensity - controls how much the image transforms
  dose: number;        // 0-1: subtle enhancement → full transformation
  
  // 5 Perceptual effect dimensions
  symmetry: number;    // 0-1: none → kaleidoscopic/hyperbolic tiling
  recursion: number;   // 0-1: flat → self-similar fractal depth
  breathing: number;   // 0-1: still → pulsing/oscillating
  flow: number;        // 0-1: static → flowing/warping motion
  saturation: number;  // 0-1: muted → vivid color shifting
}

export const DEFAULT_PARAMS: VisualizerParams = {
  dose: 0.3,
  symmetry: 0.2,
  recursion: 0.15,
  breathing: 0.4,
  flow: 0.3,
  saturation: 0.5,
};

// Slider configuration for UI
export interface SliderConfig {
  key: keyof VisualizerParams;
  label: string;
  description: string;
}

export const EFFECT_SLIDERS: SliderConfig[] = [
  { 
    key: 'dose', 
    label: 'DOSE', 
    description: 'Overall transformation intensity'
  },
  { 
    key: 'symmetry', 
    label: 'SYMMETRY', 
    description: 'Hyperbolic patterns'
  },
  { 
    key: 'recursion', 
    label: 'RECURSION', 
    description: 'Self-similar fractal depth'
  },
  { 
    key: 'breathing', 
    label: 'BREATHING', 
    description: 'Pulsing oscillation amplitude'
  },
  { 
    key: 'flow', 
    label: 'FLOW', 
    description: 'Directional warping motion'
  },
  { 
    key: 'saturation', 
    label: 'SATURATION', 
    description: 'Color intensity and shifting'
  },
];

export interface VisualizerEngine {
  init(canvas: HTMLCanvasElement): Promise<void>;
  update(audio: AudioData, params: VisualizerParams, deltaTime: number): void;
  render(): void;
  dispose(): void;
  isInitialized(): boolean;
  getName(): string;
  setImage?(imageData: ImageData | HTMLImageElement | HTMLCanvasElement): void;
}

// Audio effect parameters (psychedelic auditory phenomenology)
export interface AudioEffectParams {
  echo: number;   // 0-1: spatiality/room feel
  drift: number;  // 0-1: tonal expression/movement
  break_: number; // 0-1: rhythmic texture/disruption
}

export const DEFAULT_AUDIO_PARAMS: AudioEffectParams = {
  echo: 0.2,
  drift: 0.1,
  break_: 0,
};

// Audio effect slider configuration
export interface AudioSliderConfig {
  key: keyof AudioEffectParams;
  label: string;
  description: string;
}

export const AUDIO_EFFECT_SLIDERS: AudioSliderConfig[] = [
  {
    key: 'echo',
    label: 'ECHO',
    description: 'Spatiality and room feel'
  },
  {
    key: 'drift',
    label: 'DRIFT',
    description: 'Tonal sweeps and movement'
  },
  {
    key: 'break_',
    label: 'BREAK',
    description: 'Rhythmic texture and gating'
  },
];

// Perceptual zone mapping (nonlinear for better control)
export function mapToPerceptualZone(linear: number): number {
  if (linear <= 0.4) {
    const t = linear / 0.4;
    return t * t * (3 - 2 * t) * 0.2;
  } else if (linear <= 0.8) {
    const t = (linear - 0.4) / 0.4;
    return 0.2 + t * t * (3 - 2 * t) * 0.5;
  } else {
    const t = (linear - 0.8) / 0.2;
    return 0.7 + t * t * (3 - 2 * t) * 0.3;
  }
}
