import { useRef, useEffect, useCallback } from "react";

// Lorenz attractor parameters
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;

// Very slow time scale for organic evolution
const TIME_SCALE = 0.00015;
const SMOOTH_FACTOR = 0.02; // How quickly smoothed values follow raw values

interface AttractorState {
  x: number;
  y: number;
  z: number;
}

interface SmoothedOutputs {
  // Rotation modulation: -1 to 1, affects rotation speed
  rotationDrift: number;
  // Wobble amplitude: 0 to 1, affects distortion intensity
  wobbleAmount: number;
  // Color shift: 0 to 1, affects hue/saturation
  colorShift: number;
  // Scale breathing: 0.95 to 1.05, subtle zoom
  scaleBreath: number;
  // Asymmetry bias: -0.3 to 0.3, affects x/y ratio
  asymmetryBias: number;
}

// Normalize attractor coordinates to usable ranges
function normalizeAttractorOutput(state: AttractorState): SmoothedOutputs {
  // Lorenz attractor typically ranges: x: -20 to 20, y: -30 to 30, z: 0 to 50
  const normX = state.x / 20; // -1 to 1
  const normY = state.y / 30; // -1 to 1
  const normZ = (state.z - 25) / 25; // -1 to 1

  return {
    rotationDrift: normX * 0.5, // -0.5 to 0.5
    wobbleAmount: (normZ + 1) / 2, // 0 to 1
    colorShift: (normY + 1) / 2, // 0 to 1
    scaleBreath: 1 + normX * 0.05, // 0.95 to 1.05
    asymmetryBias: normY * 0.15, // -0.15 to 0.15
  };
}

// Smooth interpolation between current and target
function smoothStep(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function useStrangeAttractor(seed: string) {
  // Raw attractor state
  const stateRef = useRef<AttractorState>({ x: 0.1, y: 0, z: 0 });
  
  // Smoothed outputs that the visualizer reads
  const smoothedRef = useRef<SmoothedOutputs>({
    rotationDrift: 0,
    wobbleAmount: 0.5,
    colorShift: 0.5,
    scaleBreath: 1,
    asymmetryBias: 0,
  });

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Initialize state from seed
  useEffect(() => {
    // Use seed to create initial conditions
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Small initial perturbation from seed
    stateRef.current = {
      x: 0.1 + (hash % 100) / 1000,
      y: (hash % 50) / 500,
      z: (hash % 30) / 300,
    };
  }, [seed]);

  // Lorenz attractor step function
  const stepAttractor = useCallback((dt: number) => {
    const { x, y, z } = stateRef.current;
    
    // Lorenz equations
    const dx = SIGMA * (y - x);
    const dy = x * (RHO - z) - y;
    const dz = x * y - BETA * z;

    // Update state with very small time step
    stateRef.current = {
      x: x + dx * dt * TIME_SCALE,
      y: y + dy * dt * TIME_SCALE,
      z: z + dz * dt * TIME_SCALE,
    };

    // Calculate raw outputs
    const rawOutputs = normalizeAttractorOutput(stateRef.current);

    // Smooth the outputs
    const current = smoothedRef.current;
    smoothedRef.current = {
      rotationDrift: smoothStep(current.rotationDrift, rawOutputs.rotationDrift, SMOOTH_FACTOR),
      wobbleAmount: smoothStep(current.wobbleAmount, rawOutputs.wobbleAmount, SMOOTH_FACTOR),
      colorShift: smoothStep(current.colorShift, rawOutputs.colorShift, SMOOTH_FACTOR),
      scaleBreath: smoothStep(current.scaleBreath, rawOutputs.scaleBreath, SMOOTH_FACTOR),
      asymmetryBias: smoothStep(current.asymmetryBias, rawOutputs.asymmetryBias, SMOOTH_FACTOR),
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      
      const dt = Math.min(timestamp - lastTimeRef.current, 100); // Cap delta time
      lastTimeRef.current = timestamp;

      stepAttractor(dt);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stepAttractor]);

  // Return getter function for current smoothed values
  const getValues = useCallback(() => smoothedRef.current, []);

  return { getValues, smoothedRef };
}
