import { useEffect, useRef } from "react";
// @ts-ignore - Hydra doesn't have TypeScript definitions
import Hydra from "hydra-synth";
import { useStrangeAttractor } from "@/hooks/useStrangeAttractor";
import { mapToPerceptualZone, mapAudioReactivity } from "@/lib/perceptual-mapping";

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
  // Using smoothed values for musical feel, not raw jitter
  const fftRef = useRef<number[]>([0, 0, 0, 0]);
  const fftPeakRef = useRef<number[]>([0, 0, 0, 0]); // Peak hold for punchy response
  
  // Strange attractor for organic evolution
  const { smoothedRef } = useStrangeAttractor(seed);

  // Continuous audio analysis loop with musical smoothing
  useEffect(() => {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateAudio = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const prev = fftRef.current;
      const peaks = fftPeakRef.current;
      
      // Get raw values from frequency bins
      // Sub-bass (kick drums, bass) - most impactful
      const rawBass = dataArray[4] / 255;
      // Low-mid (bass guitar, low synths)
      const rawLowMid = dataArray[24] / 255;
      // Mid (vocals, leads)
      const rawMid = dataArray[72] / 255;
      // High (hi-hats, cymbals, air)
      const rawHigh = dataArray[140] / 255;
      
      // Different smoothing for different bands - bass is punchy, highs are smooth
      // Bass: fast attack (0.5), slower release (0.08) for punch
      const bassSmooth = rawBass > prev[0] ? 0.5 : 0.08;
      // Low-mid: medium response
      const lowMidSmooth = rawLowMid > prev[1] ? 0.4 : 0.1;
      // Mid: balanced
      const midSmooth = 0.15;
      // High: very smooth to avoid jitter
      const highSmooth = 0.1;
      
      fftRef.current = [
        prev[0] + (rawBass - prev[0]) * bassSmooth,
        prev[1] + (rawLowMid - prev[1]) * lowMidSmooth,
        prev[2] + (rawMid - prev[2]) * midSmooth,
        prev[3] + (rawHigh - prev[3]) * highSmooth,
      ];
      
      // Peak detection for extra punch on hits
      fftPeakRef.current = [
        Math.max(peaks[0] * 0.95, fftRef.current[0]),
        Math.max(peaks[1] * 0.95, fftRef.current[1]),
        Math.max(peaks[2] * 0.95, fftRef.current[2]),
        Math.max(peaks[3] * 0.95, fftRef.current[3]),
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

    // Apply perceptual zone mapping to slider values
    const pSeafloor = mapToPerceptualZone(seafloor);
    const pStorm = mapToPerceptualZone(storm);
    const pBeacon = mapToPerceptualZone(beacon);

    // Musical FFT getters - apply perceptual mapping to audio reactivity
    const fft = (band: number) => {
      const raw = fftRef.current[band] || 0;
      return mapAudioReactivity(raw, pStorm);
    };
    
    // Peak getter for punchy moments
    const fftPeak = (band: number) => {
      const raw = fftPeakRef.current[band] || 0;
      return mapAudioReactivity(raw, pStorm);
    };

    // Gentler hyperbolic helpers with perceptual mapping
    const hyperbolicDensity = (baseValue: number, intensity: number) => {
      // Much gentler curve - never gets too dense
      return baseValue * (1 + Math.sqrt(intensity) * 1.5);
    };

    const hyperbolicBranching = (baseSegments: number, intensity: number) => {
      // Fewer, more gradual steps
      const branchFactor = Math.floor(1 + intensity * 3);
      return Math.min(baseSegments + branchFactor, 12);
    };

    const hyperbolicWarp = (baseAmount: number, intensity: number) => {
      // Much gentler warp - sqrt for softer curve
      return baseAmount * (0.3 + Math.sqrt(intensity) * 0.7);
    };

    // Strange attractor modulation - scaled down for subtlety
    const getRotationDrift = () => smoothedRef.current.rotationDrift * 0.5;
    const getWobbleAmount = () => smoothedRef.current.wobbleAmount * 0.6;
    const getColorShift = () => smoothedRef.current.colorShift;
    const getScaleBreath = () => 1 + (smoothedRef.current.scaleBreath - 1) * 0.3;
    const getAsymmetryBias = () => smoothedRef.current.asymmetryBias * 0.3;

    // 6 VISUAL MODES FROM ORIGINAL CODE
    switch (mode) {
      case 1: // PORTAL - Iris/mandala with musical breathing
        osc(
          () => hyperbolicDensity(4, pStorm * 0.3),
          () => 0.02 + pStorm * 0.08 + getRotationDrift() * 0.02, // Slower base
          0.2
        )
          .color(
            () => 0.7 + 0.3 * pBeacon + getColorShift() * 0.15,
            () => 0.1 + 0.5 * pBeacon + (1 - getColorShift()) * 0.1,
            () => 0.5 + 0.5 * pBeacon + getColorShift() * 0.1
          )
          .kaleid(() => hyperbolicBranching(4 + Math.floor(pBeacon * 3), pStorm))
          .modulate(
            osc(
              () => hyperbolicDensity(1 + pSeafloor * 1.2, pStorm * 0.3),
              () => 0.03 + pStorm * 0.05 + getWobbleAmount() * 0.02,
              0.5
            ),
            () => hyperbolicWarp(0.1 + getWobbleAmount() * 0.05, pStorm) * fft(0) // Bass drives modulation
          )
          .rotate(
            () => time * (0.01 + pStorm * 0.03 + getRotationDrift() * 0.01) + fft(1) * 0.15 // Slower rotation
          )
          .scale(
            () => (1.0 + pSeafloor * 0.4 + fft(0) * 0.25) * getScaleBreath(), // Bass creates breathing
            () => (1.0 + pStorm * 0.2) * getScaleBreath() + getAsymmetryBias()
          )
          .modulate(
            noise(
              () => hyperbolicDensity(3, pStorm),
              () => 0.15 + pStorm * 0.2 + getWobbleAmount() * 0.1
            ),
            () => hyperbolicWarp(0.05, pStorm) * fft(2) // Mid frequencies add texture
          )
          .contrast(() => 1 + pSeafloor * 0.6)
          .brightness(
            () => -0.15 + pSeafloor * 0.3 + pBeacon * 0.4 + fft(3) * 0.15 // Highs add sparkle
          )
          .out(o0);
        break;

      case 2: // DRIFT - Gentle flowing layers with musical pulse
        {
          // Slow, flowing wave layers instead of harsh thresholds
          osc(
            () => 12 + 8 * pBeacon, // Much lower frequency
            () => 0.02 + 0.03 * pStorm + getRotationDrift() * 0.01, // Very slow
            () => 0.8 + fft(0) * 0.4 // Bass affects color spread
          )
            .color(
              () => 0.2 + 0.3 * pBeacon + getColorShift() * 0.2,
              () => 0.4 + 0.4 * pBeacon,
              () => 0.8 + 0.2 * pStorm
            )
            .rotate(() => time * 0.02 + fft(1) * 0.1) // Gentle rotation
            .layer(
              osc(
                () => 8 + 6 * pSeafloor,
                () => -0.015 - 0.02 * pStorm,
                () => 0.6 + fft(0) * 0.3
              )
                .color(
                  () => 0.6 + getColorShift() * 0.2,
                  () => 0.2 + 0.3 * pBeacon,
                  () => 0.5 + 0.3 * pStorm
                )
                .rotate(() => -time * 0.015 + fft(2) * 0.08)
                .mult(
                  osc(
                    () => 4 + 4 * pStorm,
                    () => 0.01 + fft(0) * 0.02,
                    0.5
                  ),
                  () => 0.4 + 0.3 * pSeafloor
                )
            )
            .modulate(
              osc(
                () => 3 + 2 * pStorm,
                () => 0.02 + fft(1) * 0.01
              ),
              () => 0.05 + fft(0) * 0.1 * pStorm // Bass creates gentle waves
            )
            .scale(
              () => (1.1 + fft(0) * 0.15) * getScaleBreath(), // Breathe with bass
              () => (1.1 + fft(0) * 0.15) * getScaleBreath()
            )
            .brightness(() => -0.1 + fft(3) * 0.15 + pBeacon * 0.2)
            .contrast(() => 1.1 + pSeafloor * 0.3)
            .out(o0);
        }
        break;

      case 3: // BLOOM - Flower/mandala with musical pulse
        osc(
          () => hyperbolicDensity(6, pStorm * 0.3),
          () => 0.08 + pStorm * 0.05 + getRotationDrift() * 0.02,
          0.4
        )
          .kaleid(() => hyperbolicBranching(7, pStorm))
          .color(
            () => 0.9 + getColorShift() * 0.15 + fft(0) * 0.1, // Bass warms color
            () => 0.5 + (1 - getColorShift()) * 0.15,
            () => 1.1 + getColorShift() * 0.1
          )
          .modulateRepeat(
            osc(
              () => hyperbolicDensity(2, pStorm * 0.2),
              () => 0.03 + getWobbleAmount() * 0.01,
              0.8
            ),
            () => 2 + Math.floor(pStorm * 2),
            2,
            0.4,
            0.15
          )
          .modulate(
            noise(
              () => hyperbolicDensity(3, pStorm),
              () => 0.15 + getWobbleAmount() * 0.08
            ),
            () => hyperbolicWarp(fft(0) * 0.4 + getWobbleAmount() * 0.1, pStorm * 0.4) // Bass modulation
          )
          .rotate(() => time * (0.02 + getRotationDrift() * 0.01) + fft(2) * 0.15) // Slower rotation
          .scale(
            () => (1.0 + fft(0) * 0.15 + pSeafloor * 0.2) * getScaleBreath(), // Bass breathing
            () => (1.0 + fft(0) * 0.15 + pSeafloor * 0.2 + pStorm * 0.1) * getScaleBreath() + getAsymmetryBias()
          )
          .brightness(() => fft(3) * 0.1) // Highs add sparkle
          .out(o0);
        break;

      case 4: // SCANNER - Stable moiré patterns with musical breathing
        {
          // Calmer base pattern - lower frequency, slower movement
          const pattern = () =>
            osc(
              () => 30 + 40 * pBeacon, // Much lower base frequency
              () => 0.003 + 0.01 * pStorm, // Very slow base movement
              0
            )
              .kaleid(() => 6 + Math.round(6 * pSeafloor)) // Fewer segments
              .scale(
                () => (1.2 + 0.5 * pSeafloor) * getScaleBreath(),
                () => (1.0 + 0.3 * pStorm) * getScaleBreath()
              );

          pattern()
            .scrollX(
              () => 0.1 + 0.2 * pStorm,
              () => 0.005 + fft(0) * 0.015 // Gentle bass-driven scroll
            )
            .scrollY(
              () => 0.05 + fft(1) * 0.08, // Subtle mid response
              () => 0.003 + fft(0) * 0.01
            )
            .mult(
              pattern()
                .rotate(() => Math.PI / 4 + time * 0.01)
                .contrast(() => 1.0 + 0.5 * pBeacon)
                .brightness(() => -0.1 + 0.4 * pBeacon + fft(0) * 0.2)
            )
            .color(
              () => 0.3 + 0.4 * pBeacon + getColorShift() * 0.2,
              () => 0.5 + 0.3 * pStorm,
              () => 0.7 + 0.3 * pSeafloor
            )
            .modulate(
              noise(3, 0.05),
              () => 0.02 + fft(0) * 0.05 * pStorm // Subtle warping on bass
            )
            .brightness(() => fft(3) * 0.1) // Highs add sparkle
            .out(o0);
        }
        break;

      case 5: // RITUAL - Sacred geometry with musical breathing
        noise(
          () => hyperbolicDensity(2.5, pStorm),
          () => 0.05 + pStorm * 0.1 + getWobbleAmount() * 0.03
        )
          .color(
            () => 0.4 + 0.2 * pSeafloor + getColorShift() * 0.1,
            () => 0.3 + (1 - getColorShift()) * 0.08,
            () => 0.6 + 0.3 * pBeacon + getColorShift() * 0.08
          )
          .pixelate(
            () => Math.max(12, 50 + 60 * (1 - pSeafloor) - pStorm * 20), // Larger minimum pixels
            () => Math.max(12, 40 + 50 * (1 - pSeafloor) - pStorm * 15)
          )
          .modulate(
            osc(
              () => hyperbolicDensity(1.0 + pStorm * 0.8, pStorm * 0.3),
              () => 0.03 + 0.05 * pStorm + getRotationDrift() * 0.01,
              0.5
            ).kaleid(() => hyperbolicBranching(3 + Math.round(3 * pBeacon), pStorm)),
            () => hyperbolicWarp(0.05 + fft(0) * 0.15 + getWobbleAmount() * 0.05, pStorm * 0.4) // Bass modulation
          )
          .rotate(
            () => time * (0.008 + 0.015 * pStorm + getRotationDrift() * 0.008) + fft(1) * 0.1 // Slower
          )
          .scale(
            () => (1.0 + pStorm * 0.2 + fft(0) * 0.1) * getScaleBreath(), // Bass breathing
            () => (1.0 + pStorm * 0.25 + fft(0) * 0.1) * getScaleBreath() + getAsymmetryBias()
          )
          .brightness(() => 0.02 + fft(2) * 0.2 + fft(3) * 0.08) // Mids and highs add life
          .out(o0);
        break;

      case 6: // TIDE - Oceanic waves with musical pulse
        osc(
          () => 20 + 30 * pStorm, // Much lower frequency - visible waves
          () => 0.02 + fft(0) * 0.04, // Slow base, bass pulses it
          () => 0.8 + 0.6 * pBeacon + getColorShift() * 0.2
        )
          .color(
            () => 0.3 + 0.4 * pBeacon + getColorShift() * 0.15,
            () => 0.5 + 0.3 * pStorm,
            () => 0.7 + 0.3 * pSeafloor
          )
          .modulate(
            osc(
              () => 3 + 3 * pStorm,
              () => -0.02 - 0.03 * pSeafloor,
              () => 1 + fft(1) * 0.5 // Low-mid affects modulation
            ).rotate(() => time * 0.01 + getRotationDrift() * 0.5),
            () => 0.03 + fft(0) * 0.08 // Bass creates wave ripples
          )
          .rotate(() => time * 0.008 + fft(1) * 0.05) // Very slow rotation
          .scale(
            () => (1.0 + fft(0) * 0.12) * getScaleBreath(), // Breathe with bass
            () => (1.0 + fft(0) * 0.12) * getScaleBreath()
          )
          .layer(
            osc(
              () => 8 + 12 * pSeafloor,
              () => 0.015 + fft(0) * 0.02,
              () => 0.5 + 0.4 * pBeacon
            )
              .color(
                () => 0.5 + 0.3 * pBeacon,
                () => 0.2 + 0.2 * pStorm + getColorShift() * 0.1,
                () => 0.6 + 0.2 * pSeafloor
              )
              .rotate(() => -time * 0.006)
              .mult(
                shape(
                  () => 3 + Math.round(pSeafloor * 4),
                  () => 0.3 + 0.4 * pStorm + fft(0) * 0.15,
                  0.8
                )
                  .scale(() => 1.5 + fft(0) * 0.3)
                  .rotate(() => time * 0.01),
                () => 0.3 + 0.3 * pSeafloor
              )
          )
          .modulate(
            noise(
              () => 2 + 2 * pStorm,
              () => 0.03 + fft(1) * 0.02
            ),
            () => 0.02 + fft(0) * 0.04 * pStorm // Gentle warping on bass
          )
          .brightness(() => -0.05 + fft(3) * 0.1 + pBeacon * 0.15)
          .contrast(() => 1.05 + pSeafloor * 0.2)
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
