import { useEffect, useRef } from "react";
// @ts-ignore - Hydra doesn't have TypeScript definitions
import Hydra from "hydra-synth";
import { useStrangeAttractor } from "@/hooks/useStrangeAttractor";

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
  const audioLoopRef = useRef<number>();
  
  // Live FFT data ref - updated continuously by animation loop
  const fftRef = useRef<number[]>([0, 0, 0, 0]);
  
  // Strange attractor for organic evolution
  const { smoothedRef } = useStrangeAttractor(seed);

  // Continuous audio analysis loop
  useEffect(() => {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateAudio = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Smoothed FFT bands with slight interpolation for less jitter
      const smooth = 0.3;
      const prev = fftRef.current;
      
      // Sub-bass (20-60Hz) - bin ~4
      const newBass = dataArray[4] / 255;
      // Low-mid (200-500Hz) - bin ~24  
      const newLowMid = dataArray[24] / 255;
      // Mid (500-2kHz) - bin ~72
      const newMid = dataArray[72] / 255;
      // High (2k-8kHz) - bin ~140
      const newHigh = dataArray[140] / 255;
      
      fftRef.current = [
        prev[0] + (newBass - prev[0]) * smooth,
        prev[1] + (newLowMid - prev[1]) * smooth,
        prev[2] + (newMid - prev[2]) * smooth,
        prev[3] + (newHigh - prev[3]) * smooth,
      ];
      
      audioLoopRef.current = requestAnimationFrame(updateAudio);
    };
    
    audioLoopRef.current = requestAnimationFrame(updateAudio);
    
    return () => {
      if (audioLoopRef.current) {
        cancelAnimationFrame(audioLoopRef.current);
      }
    };
  }, [analyser]);

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

    // Live FFT getters - read from continuously updated ref
    const fft = (band: number) => fftRef.current[band] || 0;

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

    // Strange attractor modulation getters - read live from smoothed ref
    const getRotationDrift = () => smoothedRef.current.rotationDrift;
    const getWobbleAmount = () => smoothedRef.current.wobbleAmount;
    const getColorShift = () => smoothedRef.current.colorShift;
    const getScaleBreath = () => smoothedRef.current.scaleBreath;
    const getAsymmetryBias = () => smoothedRef.current.asymmetryBias;

    // 6 VISUAL MODES FROM ORIGINAL CODE
    switch (mode) {
      case 1: // PORTAL - Hyperbolic iris/mandala with strange attractor evolution
        osc(
          () => hyperbolicDensity(4, storm * 0.3),
          () => 0.03 + storm * 0.18 + getRotationDrift() * 0.05, // Attractor-driven speed variation
          0.2
        )
          .color(
            () => 0.7 + 0.3 * beacon + getColorShift() * 0.2, // Attractor color drift
            () => 0.1 + 0.5 * beacon + (1 - getColorShift()) * 0.15,
            () => 0.5 + 0.5 * beacon + getColorShift() * 0.1
          )
          .kaleid(() => hyperbolicBranching(4 + Math.floor(beacon * 4), storm))
          .modulate(
            osc(
              () => hyperbolicDensity(1 + seafloor * 1.5, storm * 0.4),
              () => 0.05 + storm * 0.1 + getWobbleAmount() * 0.03,
              0.5
            ),
            () => hyperbolicWarp(0.15 + getWobbleAmount() * 0.1, storm) * fft(0)
          )
          .rotate(
            () => time * (0.01 + storm * 0.06 + getRotationDrift() * 0.02) + fft(1) * 0.4
          )
          .scale(
            () => (1.0 + seafloor * 0.7 + fft(0) * 0.5) * getScaleBreath(),
            () => (1.0 + storm * 0.3) * getScaleBreath() + getAsymmetryBias()
          )
          .modulate(
            noise(
              () => hyperbolicDensity(3, storm),
              () => 0.2 + storm * 0.4 + getWobbleAmount() * 0.15
            ),
            () => hyperbolicWarp(0.1, storm) * fft(2)
          )
          .contrast(() => 1 + seafloor * 1.0)
          .brightness(
            () => -0.2 + seafloor * 0.4 + beacon * 0.6 + fft(3) * 0.3
          )
          .out(o0);
        break;

      case 2: // DRIFT - Hyperbolic wave interference with organic evolution
        {
          // @ts-ignore - Hydra extends arrays with .fast()
          const thresh1 = [0.3, 0.7].fast(0.75);
          // @ts-ignore
          const thresh2 = [0.3, 0.7].fast(0.5);
          // @ts-ignore
          const thresh3 = [0.3, 0.7].fast(0.25);
          
          osc(
            () => hyperbolicDensity(40 + 40 * beacon, storm * 0.5),
            () => -0.05 - 0.25 * seafloor + getRotationDrift() * 0.03,
            0
          )
            .thresh(thresh1, 0)
            .color(
              () => getColorShift() * 0.15,
              () => 0.3 + 0.7 * beacon + (1 - getColorShift()) * 0.1,
              1
            )
            .add(
              osc(
                () => hyperbolicDensity(24 + 20 * storm, storm * 0.6),
                () => 0.08 + 0.25 * fft(0) + getWobbleAmount() * 0.04,
                0
              )
                .thresh(thresh1, 0)
                .rotate(() => Math.PI / 4 + 0.4 * fft(1) + storm * 0.3 + getRotationDrift() * 0.15)
                .color(1, () => getColorShift() * 0.2, 0)
                .modulateScale(
                  osc(
                    () => hyperbolicDensity(50 + 40 * seafloor, storm * 0.4),
                    () => -0.01 - 0.02 * storm,
                    0
                  ).thresh(thresh1, 0),
                  () => hyperbolicWarp(0.5 + 1.5 * seafloor + getWobbleAmount() * 0.2, storm * 0.3)
                )
            )
            .diff(
              osc(
                () => hyperbolicDensity(24 + 20 * storm, storm * 0.6),
                () => 0.06 + 0.25 * fft(2) + getWobbleAmount() * 0.04,
                0
              )
                .thresh(thresh2, 0)
                .rotate(() => Math.PI / 2 + 0.5 * fft(3) + storm * 0.2 + getRotationDrift() * 0.1)
                .color(1, () => getColorShift() * 0.15, 1)
                .modulateScale(
                  osc(
                    () => hyperbolicDensity(50 + 40 * beacon, storm * 0.4),
                    () => -0.015 - 0.02 * storm,
                    0
                  ).thresh(thresh2, 0),
                  () => hyperbolicWarp(0.5 + 1.3 * beacon + getWobbleAmount() * 0.15, storm * 0.3)
                )
            )
            .modulateRotate(
              osc(
                () => hyperbolicDensity(54 + 20 * storm, storm * 0.5),
                () => -0.005 - 0.01 * fft(1) + getRotationDrift() * 0.01,
                0
              ).thresh(thresh3, 0),
              () => hyperbolicWarp(0.2 + getWobbleAmount() * 0.1, storm * 1.2)
            )
            .modulateScale(
              osc(
                () => hyperbolicDensity(44 + 30 * seafloor, storm * 0.4),
                () => -0.02 - 0.02 * fft(0),
                0
              ).thresh(thresh3, 0),
              () => hyperbolicWarp(1.0 + 1.5 * seafloor, storm * 0.2)
            )
            .colorama(() => Math.sin(time / 27) * 0.01222 + 9.89 + getColorShift() * 0.02)
            .scale(
              () => (1.4 + 0.8 * seafloor) * getScaleBreath(),
              () => (1.4 + 0.8 * seafloor + storm * 0.4) * getScaleBreath() + getAsymmetryBias()
            )
            .out(o0);
        }
        break;

      case 3: // BLOOM - Hyperbolic flower/mandala with organic evolution
        osc(
          () => hyperbolicDensity(8, storm * 0.4),
          () => 0.15 + storm * 0.1 + getRotationDrift() * 0.04,
          0.4
        )
          .kaleid(() => hyperbolicBranching(9, storm))
          .color(
            () => 1.1 + getColorShift() * 0.2,
            () => 0.6 + (1 - getColorShift()) * 0.2,
            () => 1.4 + getColorShift() * 0.15
          )
          .modulateRepeat(
            osc(
              () => hyperbolicDensity(2, storm * 0.3),
              () => 0.05 + getWobbleAmount() * 0.02,
              0.9
            ),
            () => 3 + Math.floor(storm * 3),
            2,
            0.5,
            0.2
          )
          .modulate(
            noise(
              () => hyperbolicDensity(4, storm),
              () => 0.25 + getWobbleAmount() * 0.1
            ),
            () => hyperbolicWarp(fft(0) * 0.7 + getWobbleAmount() * 0.15, storm * 0.5)
          )
          .rotate(() => time * (0.05 + getRotationDrift() * 0.02) + fft(2) * 0.4)
          .scale(
            () => (1.0 + fft(1) * 0.2 + seafloor * 0.3) * getScaleBreath(),
            () => (1.0 + fft(1) * 0.2 + seafloor * 0.3 + storm * 0.2) * getScaleBreath() + getAsymmetryBias()
          )
          .out(o0);
        break;

      case 4: // SCANNER - Hyperbolic scan lines/moiré with organic evolution
        {
          const pattern = () =>
            osc(
              () => hyperbolicDensity(80 + 240 * beacon, storm * 0.6),
              () => 0.005 + 0.05 * storm + getRotationDrift() * 0.02,
              0
            )
              .kaleid(() => hyperbolicBranching(20 + Math.round(80 * seafloor), storm * 0.7))
              .scale(
                () => (1.0 + 1.5 * seafloor + storm * 0.3) * getScaleBreath(),
                () => (0.3 + 0.5 * storm + seafloor * 0.4) * getScaleBreath() + getAsymmetryBias()
              );

          pattern()
            .scrollX(
              () => hyperbolicWarp(0.1 + 0.6 * storm + getWobbleAmount() * 0.1, storm * 0.4),
              () => 0.01 + 0.05 * (fft(0) + fft(1)) + getRotationDrift() * 0.02
            )
            .scrollY(
              () => (fft(2) - 0.5) * 0.3 * (0.2 + storm) * (1 + storm * 0.5) + getAsymmetryBias() * 0.3,
              () => 0.01 + 0.05 * fft(3) + getRotationDrift() * 0.015
            )
            .mult(
              pattern()
                .contrast(() => 1.0 + 1.5 * beacon + getWobbleAmount() * 0.2)
                .brightness(() => -0.2 + 0.6 * beacon + 0.3 * fft(3) + getColorShift() * 0.1)
            )
            .modulate(
              noise(
                () => hyperbolicDensity(5, storm),
                () => 0.1 + getWobbleAmount() * 0.05
              ),
              () => storm * 0.15 + getWobbleAmount() * 0.05
            )
            .out(o0);
        }
        break;

      case 5: // RITUAL - Hyperbolic pixelated sacred geometry with attractor evolution
        noise(
          () => hyperbolicDensity(3, storm),
          () => 0.08 + storm * 0.2 + getWobbleAmount() * 0.05
        )
          .color(
            () => 0.4 + 0.2 * seafloor + getColorShift() * 0.15,
            () => 0.3 + (1 - getColorShift()) * 0.1,
            () => 0.7 + 0.3 * beacon + getColorShift() * 0.1
          )
          .pixelate(
            () => Math.max(8, 40 + 80 * (1 - seafloor) - storm * 30),
            () => Math.max(8, 30 + 60 * (1 - seafloor) - storm * 20)
          )
          .modulate(
            osc(
              () => hyperbolicDensity(1.0 + 1.5 * storm, storm * 0.5),
              () => 0.06 + 0.12 * storm + getRotationDrift() * 0.03,
              0.6
            ).kaleid(() => hyperbolicBranching(3 + Math.round(5 * beacon), storm)),
            () => hyperbolicWarp(0.1 + (fft(0) + fft(1)) * 0.4 + getWobbleAmount() * 0.1, storm * 0.6)
          )
          .rotate(
            () => time * (0.01 + 0.03 * storm + getRotationDrift() * 0.015) + fft(1) * 0.25
          )
          .scale(
            () => (1.0 + storm * 0.3) * getScaleBreath(),
            () => (1.0 + storm * 0.4) * getScaleBreath() + getAsymmetryBias()
          )
          .brightness(() => 0.05 + fft(2) * 0.35)
          .out(o0);
        break;

      case 6: // TIDE - Hyperbolic wave complex with organic evolution
        osc(
          () => hyperbolicDensity(150 + 150 * storm, storm * 0.7),
          () => 0.04 + 0.18 * fft(0) + getRotationDrift() * 0.04,
          () => 1.2 + 1.5 * beacon + getColorShift() * 0.3
        )
          .modulate(
            osc(
              () => hyperbolicDensity(1 + 3 * storm, storm * 0.5),
              () => -0.1 - 0.3 * seafloor + getWobbleAmount() * 0.05,
              () => 60 + 60 * fft(1)
            ).rotate(() => 10 + 10 * beacon + getRotationDrift() * 2),
            () => hyperbolicWarp(0.05 + getWobbleAmount() * 0.03, storm * 0.8)
          )
          .mult(
            osc(
              () => hyperbolicDensity(150 + 150 * storm, storm * 0.6),
              () => -0.05 - 0.2 * fft(2) + getRotationDrift() * 0.03,
              2
            ).pixelate(
              () => Math.max(8, 20 + 80 * (1 - seafloor) - storm * 25),
              () => Math.max(8, 20 + 80 * (1 - seafloor) - storm * 25)
            )
          )
          .color(
            () => 0.5 + 0.5 * beacon + getColorShift() * 0.15,
            () => 0.1 + 0.4 * storm + (1 - getColorShift()) * 0.1,
            () => 0.6 + 0.4 * beacon + getColorShift() * 0.1
          )
          .modulate(
            osc(
              () => hyperbolicDensity(3 + 5 * storm, storm * 0.5),
              () => -0.05 - 0.08 * fft(0) + getWobbleAmount() * 0.02
            ).rotate(() => 5 + 10 * beacon + getRotationDrift() * 1.5),
            () => hyperbolicWarp(0.03 + getWobbleAmount() * 0.02, storm * 0.9)
          )
          .add(
            osc(
              () => hyperbolicDensity(6 + 6 * storm, storm * 0.4),
              () => -0.4 - 0.4 * fft(1) + getRotationDrift() * 0.06,
              () => 400 + 400 * seafloor
            ).color(
              () => 1 + getColorShift() * 0.1,
              () => getColorShift() * 0.15,
              1
            )
          )
          .mult(
            shape(
              () => 2 + seafloor * 40,
              () => 0.15 + 0.5 * storm + getWobbleAmount() * 0.1,
              1
            )
              .luma()
              .repeatX(() => 1 + Math.round(beacon * 3) + Math.floor(storm * 2))
              .repeatY(() => 1 + Math.round(seafloor * 3) + Math.floor(storm * 2))
              .colorama(() => 0.5 + 9.5 * beacon + getColorShift() * 0.5)
          )
          .modulate(
            osc(
              () => hyperbolicDensity(4 + 10 * storm, storm * 0.6),
              () => -0.1 - 0.2 * fft(3) + getRotationDrift() * 0.03,
              () => 400 + 400 * beacon
            ).rotate(() => 3 + 6 * storm + getRotationDrift() * 0.5),
            () => hyperbolicWarp(0.04 + getWobbleAmount() * 0.02, storm * 1.0)
          )
          .add(
            osc(
              () => hyperbolicDensity(2 + 6 * storm, storm * 0.3),
              () => 0.4 + 1.0 * fft(0) + getWobbleAmount() * 0.1,
              () => 80 + 60 * seafloor
            ).color(
              () => 0.2 + getColorShift() * 0.1,
              () => getColorShift() * 0.1,
              1
            )
          )
          .scale(
            () => (1.0 + storm * 0.25) * getScaleBreath(),
            () => (1.0 + storm * 0.35) * getScaleBreath() + getAsymmetryBias()
          )
          .out(o0);
        break;
    }
    
    render(o0);

  }, [seed, mode, seafloor, storm, beacon, analyser, smoothedRef]);

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
