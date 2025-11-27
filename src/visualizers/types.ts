/**
 * Visualizer Engine Interface
 * All visualizers implement this for extensibility
 */

export interface AudioData {
  // Frequency bands (0-1 normalized)
  bass: number;      // 20-150 Hz - kicks, sub bass
  lowMid: number;    // 150-500 Hz - bass guitar, low synths
  mid: number;       // 500-2000 Hz - vocals, leads
  high: number;      // 2000-8000 Hz - hi-hats, air
  
  // Derived values
  energy: number;    // Overall energy (0-1)
  beatDetected: boolean;  // True on kick/snare hits
  beatIntensity: number;  // How strong the beat (0-1)
}

export interface VisualizerParams {
  // 6 core sliders (0-1 normalized)
  depth: number;       // Coupling kernel radius / density
  curvature: number;   // Euclidean to hyperbolic transform
  turbulence: number;  // Order to chaos
  branching: number;   // Pattern multiplication factor
  persistence: number; // Tracer / echo effect
  focus: number;       // Center attention / vignette
}

export interface VisualizerEngine {
  // Lifecycle
  init(canvas: HTMLCanvasElement): Promise<void>;
  dispose(): void;
  
  // Per-frame update
  update(audio: AudioData, params: VisualizerParams, deltaTime: number): void;
  render(): void;
  
  // State
  isInitialized(): boolean;
  getName(): string;
}

export interface VisualizerConfig {
  width: number;
  height: number;
  simulationScale: number; // e.g., 0.25 for 1/4 resolution
}

// Default params for initialization
export const DEFAULT_PARAMS: VisualizerParams = {
  depth: 0.5,
  curvature: 0.3,
  turbulence: 0.4,
  branching: 0.5,
  persistence: 0.3,
  focus: 0.5,
};

// Perceptual zone mapping (from our existing system)
export function mapToPerceptualZone(linear: number): number {
  if (linear <= 0.4) {
    // Subtle zone: gentle, compressed
    const t = linear / 0.4;
    return t * t * (3 - 2 * t) * 0.2;
  } else if (linear <= 0.8) {
    // Expressive zone: sweet spot
    const t = (linear - 0.4) / 0.4;
    return 0.2 + t * t * (3 - 2 * t) * 0.5;
  } else {
    // Experimental zone: careful expansion
    const t = (linear - 0.8) / 0.2;
    return 0.7 + t * t * (3 - 2 * t) * 0.3;
  }
}
