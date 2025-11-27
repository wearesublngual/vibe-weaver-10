import { useEffect, useRef } from "react";
// @ts-ignore - Hydra doesn't have TypeScript definitions
import Hydra from "hydra-synth";

interface HydraCanvasProps {
  seed: string;
  mode: number;
  seafloor: number;
  storm: number;
  beacon: number;
  analyser: AnalyserNode | null;
}

const HydraCanvas = ({ seed, mode, seafloor, storm, beacon, analyser }: HydraCanvasProps) => {
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

    // Access Hydra's global functions
    // @ts-ignore - Hydra adds global functions
    const { osc, noise, gradient, shape, o0, time, render } = window;

    // Hyperbolic geometry helpers - perceptual curvature
    const hyperbolicDensity = (baseValue: number, storm: number) => {
      // At low storm: normal spacing
      // At high storm: exponential density increase (hyperbolic packing)
      return baseValue * (1 + storm * 2.5);
    };

    const hyperbolicBranching = (baseSegments: number, storm: number) => {
      // Discrete steps: 4 → 6 → 8 → 12 → 16 → 20
      // More branches = more hyperbolic feel
      const branchFactor = Math.floor(1 + storm * 5);
      return Math.min(baseSegments + branchFactor * 2, 20);
    };

    const hyperbolicWarp = (baseAmount: number, storm: number) => {
      // Non-linear warp: mild at low storm, intense curved feel at high
      return baseAmount * (0.5 + storm * 1.5) * (1 + storm * storm * 0.8);
    };
    
    const fftData = [0, 0, 0, 0];
    
    // Update audio data if analyser is available
    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      fftData[0] = dataArray[4] / 255;
      fftData[1] = dataArray[24] / 255;
      fftData[2] = dataArray[72] / 255;
      fftData[3] = dataArray[140] / 255;
    }

    // 6 VISUAL MODES FROM ORIGINAL CODE
    switch (mode) {
      case 1: // PORTAL - Hyperbolic iris/mandala
        osc(
          () => hyperbolicDensity(4, storm * 0.3),
          0.03 + storm * 0.18,
          0.2
        )
          .color(
            0.7 + 0.3 * beacon,
            0.1 + 0.5 * beacon,
            0.5 + 0.5 * beacon
          )
          .kaleid(() => hyperbolicBranching(4 + Math.floor(beacon * 4), storm))
          .modulate(
            osc(
              () => hyperbolicDensity(1 + seafloor * 1.5, storm * 0.4),
              0.05 + storm * 0.1,
              0.5
            ),
            () => hyperbolicWarp(0.15, storm) * fftData[0]
          )
          .rotate(
            () => time * (0.01 + storm * 0.06) + fftData[1] * 0.4
          )
          .scale(
            () => 1.0 + seafloor * 0.7 + fftData[0] * 0.5,
            () => 1.0 + storm * 0.3 // Asymmetric scale for hyperbolic stretch
          )
          .modulate(
            noise(
              () => hyperbolicDensity(3, storm),
              0.2 + storm * 0.4
            ),
            () => hyperbolicWarp(0.1, storm) * fftData[2]
          )
          .contrast(() => 1 + seafloor * 1.0)
          .brightness(
            () => -0.2 + seafloor * 0.4 + beacon * 0.6 + fftData[3] * 0.3
          )
          .out(o0);
        break;

      case 2: // DRIFT - Hyperbolic wave interference
        {
          // @ts-ignore - Hydra extends arrays with .fast()
          const thresh1 = [0.3, 0.7].fast(0.75);
          // @ts-ignore
          const thresh2 = [0.3, 0.7].fast(0.5);
          // @ts-ignore
          const thresh3 = [0.3, 0.7].fast(0.25);
          
          osc(
            () => hyperbolicDensity(40 + 40 * beacon, storm * 0.5),
            () => -0.05 - 0.25 * seafloor,
            0
          )
            .thresh(thresh1, 0)
            .color(0, () => 0.3 + 0.7 * beacon, 1)
            .add(
              osc(
                () => hyperbolicDensity(24 + 20 * storm, storm * 0.6),
                () => 0.08 + 0.25 * fftData[0],
                0
              )
                .thresh(thresh1, 0)
                .rotate(() => Math.PI / 4 + 0.4 * fftData[1] + storm * 0.3)
                .color(1, 0, 0)
                .modulateScale(
                  osc(
                    () => hyperbolicDensity(50 + 40 * seafloor, storm * 0.4),
                    () => -0.01 - 0.02 * storm,
                    0
                  ).thresh(thresh1, 0),
                  () => hyperbolicWarp(0.5 + 1.5 * seafloor, storm * 0.3)
                )
            )
            .diff(
              osc(
                () => hyperbolicDensity(24 + 20 * storm, storm * 0.6),
                () => 0.06 + 0.25 * fftData[2],
                0
              )
                .thresh(thresh2, 0)
                .rotate(() => Math.PI / 2 + 0.5 * fftData[3] + storm * 0.2)
                .color(1, 0, 1)
                .modulateScale(
                  osc(
                    () => hyperbolicDensity(50 + 40 * beacon, storm * 0.4),
                    () => -0.015 - 0.02 * storm,
                    0
                  ).thresh(thresh2, 0),
                  () => hyperbolicWarp(0.5 + 1.3 * beacon, storm * 0.3)
                )
            )
            .modulateRotate(
              osc(
                () => hyperbolicDensity(54 + 20 * storm, storm * 0.5),
                () => -0.005 - 0.01 * fftData[1],
                0
              ).thresh(thresh3, 0),
              () => hyperbolicWarp(0.2, storm * 1.2)
            )
            .modulateScale(
              osc(
                () => hyperbolicDensity(44 + 30 * seafloor, storm * 0.4),
                () => -0.02 - 0.02 * fftData[0],
                0
              ).thresh(thresh3, 0),
              () => hyperbolicWarp(1.0 + 1.5 * seafloor, storm * 0.2)
            )
            .colorama(() => Math.sin(time / 27) * 0.01222 + 9.89)
            .scale(
              () => 1.4 + 0.8 * seafloor,
              () => 1.4 + 0.8 * seafloor + storm * 0.4 // Hyperbolic asymmetry
            )
            .out(o0);
        }
        break;

      case 3: // BLOOM - Hyperbolic flower/mandala
        osc(
          () => hyperbolicDensity(8, storm * 0.4),
          0.15 + storm * 0.1,
          0.4
        )
          .kaleid(() => hyperbolicBranching(9, storm))
          .color(1.1, 0.6, 1.4)
          .modulateRepeat(
            osc(
              () => hyperbolicDensity(2, storm * 0.3),
              0.05,
              0.9
            ),
            () => 3 + Math.floor(storm * 3), // More repeats = hyperbolic tiling
            2,
            0.5,
            0.2
          )
          .modulate(
            noise(
              () => hyperbolicDensity(4, storm),
              0.25
            ),
            () => hyperbolicWarp(fftData[0] * 0.7, storm * 0.5)
          )
          .rotate(() => time * 0.05 + fftData[2] * 0.4)
          .scale(
            () => 1.0 + fftData[1] * 0.2 + seafloor * 0.3,
            () => 1.0 + fftData[1] * 0.2 + seafloor * 0.3 + storm * 0.2
          )
          .out(o0);
        break;

      case 4: // SCANNER - Hyperbolic scan lines/moiré
        {
          const pattern = () =>
            osc(
              () => hyperbolicDensity(80 + 240 * beacon, storm * 0.6),
              () => 0.005 + 0.05 * storm,
              0
            )
              .kaleid(() => hyperbolicBranching(20 + Math.round(80 * seafloor), storm * 0.7))
              .scale(
                () => 1.0 + 1.5 * seafloor + storm * 0.3,
                () => 0.3 + 0.5 * storm + seafloor * 0.4 // Hyperbolic stretch
              );

          pattern()
            .scrollX(
              () => hyperbolicWarp(0.1 + 0.6 * storm, storm * 0.4),
              () => 0.01 + 0.05 * (fftData[0] + fftData[1])
            )
            .scrollY(
              () => (fftData[2] - 0.5) * 0.3 * (0.2 + storm) * (1 + storm * 0.5),
              () => 0.01 + 0.05 * fftData[3]
            )
            .mult(
              pattern()
                .contrast(() => 1.0 + 1.5 * beacon)
                .brightness(() => -0.2 + 0.6 * beacon + 0.3 * fftData[3])
            )
            .modulate(
              noise(
                () => hyperbolicDensity(5, storm),
                0.1
              ),
              () => storm * 0.15 // Add curved space distortion
            )
            .out(o0);
        }
        break;

      case 5: // RITUAL - Hyperbolic pixelated sacred geometry
        noise(
          () => hyperbolicDensity(3, storm),
          0.08 + storm * 0.2
        )
          .color(
            () => 0.4 + 0.2 * seafloor,
            0.3,
            () => 0.7 + 0.3 * beacon
          )
          .pixelate(
            () => Math.max(8, 40 + 80 * (1 - seafloor) - storm * 30), // Denser at high storm
            () => Math.max(8, 30 + 60 * (1 - seafloor) - storm * 20)
          )
          .modulate(
            osc(
              () => hyperbolicDensity(1.0 + 1.5 * storm, storm * 0.5),
              () => 0.06 + 0.12 * storm,
              0.6
            ).kaleid(() => hyperbolicBranching(3 + Math.round(5 * beacon), storm)),
            () => hyperbolicWarp(0.1 + (fftData[0] + fftData[1]) * 0.4, storm * 0.6)
          )
          .rotate(
            () => time * (0.01 + 0.03 * storm) + fftData[1] * 0.25
          )
          .scale(
            () => 1.0 + storm * 0.3, // Hyperbolic zoom
            () => 1.0 + storm * 0.4
          )
          .brightness(() => 0.05 + fftData[2] * 0.35)
          .out(o0);
        break;

      case 6: // TIDE - Hyperbolic wave complex
        osc(
          () => hyperbolicDensity(150 + 150 * storm, storm * 0.7),
          () => 0.04 + 0.18 * fftData[0],
          () => 1.2 + 1.5 * beacon
        )
          .modulate(
            osc(
              () => hyperbolicDensity(1 + 3 * storm, storm * 0.5),
              () => -0.1 - 0.3 * seafloor,
              () => 60 + 60 * fftData[1]
            ).rotate(() => 10 + 10 * beacon),
            () => hyperbolicWarp(0.05, storm * 0.8)
          )
          .mult(
            osc(
              () => hyperbolicDensity(150 + 150 * storm, storm * 0.6),
              () => -0.05 - 0.2 * fftData[2],
              2
            ).pixelate(
              () => Math.max(8, 20 + 80 * (1 - seafloor) - storm * 25),
              () => Math.max(8, 20 + 80 * (1 - seafloor) - storm * 25)
            )
          )
          .color(
            () => 0.5 + 0.5 * beacon,
            () => 0.1 + 0.4 * storm,
            () => 0.6 + 0.4 * beacon
          )
          .modulate(
            osc(
              () => hyperbolicDensity(3 + 5 * storm, storm * 0.5),
              () => -0.05 - 0.08 * fftData[0]
            ).rotate(() => 5 + 10 * beacon),
            () => hyperbolicWarp(0.03, storm * 0.9)
          )
          .add(
            osc(
              () => hyperbolicDensity(6 + 6 * storm, storm * 0.4),
              () => -0.4 - 0.4 * fftData[1],
              () => 400 + 400 * seafloor
            ).color(1, 0, 1)
          )
          .mult(
            shape(
              () => 2 + seafloor * 40,
              () => 0.15 + 0.5 * storm,
              1
            )
              .luma()
              .repeatX(() => 1 + Math.round(beacon * 3) + Math.floor(storm * 2)) // More hyperbolic repeats
              .repeatY(() => 1 + Math.round(seafloor * 3) + Math.floor(storm * 2))
              .colorama(() => 0.5 + 9.5 * beacon)
          )
          .modulate(
            osc(
              () => hyperbolicDensity(4 + 10 * storm, storm * 0.6),
              () => -0.1 - 0.2 * fftData[3],
              () => 400 + 400 * beacon
            ).rotate(() => 3 + 6 * storm),
            () => hyperbolicWarp(0.04, storm * 1.0)
          )
          .add(
            osc(
              () => hyperbolicDensity(2 + 6 * storm, storm * 0.3),
              () => 0.4 + 1.0 * fftData[0],
              () => 80 + 60 * seafloor
            ).color(0.2, 0, 1)
          )
          .scale(
            () => 1.0 + storm * 0.25,
            () => 1.0 + storm * 0.35 // Hyperbolic asymmetry
          )
          .out(o0);
        break;
    }
    
    render(o0);

  }, [seed, mode, seafloor, storm, beacon, analyser]);

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
