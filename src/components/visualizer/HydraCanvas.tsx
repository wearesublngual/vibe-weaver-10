import { useEffect, useRef } from "react";
// @ts-ignore - Hydra doesn't have TypeScript definitions
import Hydra from "hydra-synth";

interface HydraCanvasProps {
  seed: string;
  intensity: number;
  speed: number;
  complexity: number;
  analyser: AnalyserNode | null;
}

const HydraCanvas = ({ seed, intensity, speed, complexity, analyser }: HydraCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraRef = useRef<any>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Hydra - this sets up global functions
    const hydra = new Hydra({
      canvas: canvasRef.current,
      detectAudio: false,
      enableStreamCapture: false,
    });
    
    hydraRef.current = hydra;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydraRef.current) return;

    // Generate deterministic parameters from seed
    const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const r1 = (seedNum % 100) / 100;
    const r2 = ((seedNum * 7) % 100) / 100;
    const r3 = ((seedNum * 13) % 100) / 100;

    // Access Hydra's global functions
    // @ts-ignore - Hydra adds global functions
    const { osc, voronoi, gradient, o0 } = window;
    
    if (r1 < 0.33) {
      // Pattern 1: Kaleidoscope feedback with audio reactivity
      osc(10 * complexity, 0.1 * speed, r1)
        .kaleid(3 + Math.floor(r2 * 5))
        .modulate(o0, intensity * 0.5)
        .scale(() => analyser ? 1 + (getAudioLevel(analyser) * intensity * 0.3) : 1)
        .color(r1 * 2, r2 * 2, r3 * 2)
        .out();
    } else if (r1 < 0.66) {
      // Pattern 2: Voronoi with rotation
      voronoi(5 + complexity * 10, 0.1 * speed, r2)
        .modulateRotate(osc(8, 0.1 * speed), intensity * 0.3)
        .scale(() => analyser ? 1 + (getAudioLevel(analyser) * intensity * 0.2) : 1)
        .color(r2 * 2, r3 * 2, r1 * 2)
        .out();
    } else {
      // Pattern 3: Gradient with feedback
      gradient(r3)
        .modulateScale(osc(8 * complexity, 0.05 * speed), intensity)
        .modulate(o0, 0.5)
        .scale(() => analyser ? 1 + (getAudioLevel(analyser) * intensity * 0.25) : 1)
        .color(r3 * 2, r1 * 2, r2 * 2)
        .out();
    }

  }, [seed, intensity, speed, complexity, analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Helper function to get audio level from analyser
function getAudioLevel(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
  return average / 255; // Normalize to 0-1
}

export default HydraCanvas;
