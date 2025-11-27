import { useEffect, useState, useRef } from "react";
import { VisualizerParams } from "@/visualizers/types";
import { AudioAnalyzer } from "@/visualizers/audio-analyzer";

interface DebugOverlayProps {
  params: VisualizerParams;
  analyser: AnalyserNode | null;
}

// Easing functions (match shader)
const easeInQuad = (t: number) => t * t;
const easeOutQuad = (t: number) => t * (2 - t);
const easeInOutCubic = (t: number) => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smootherStep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

// Slider curve configs
const SLIDER_CURVES: Record<keyof VisualizerParams, { fn: (x: number) => number; name: string }> = {
  dose: { fn: (x) => x, name: "linear" },
  symmetry: { fn: smootherStep, name: "smootherStep" },
  recursion: { fn: easeInOutCubic, name: "easeInOutCubic" },
  breathing: { fn: (x) => x, name: "linear" },
  flow: { fn: easeOutQuad, name: "easeOutQuad" },
  saturation: { fn: easeInQuad, name: "easeInQuad" },
};

// Zone helper
const getZone = (value: number): { name: string; color: string } => {
  if (value < 0.4) return { name: "Subtle", color: "text-green-400" };
  if (value < 0.8) return { name: "Expressive", color: "text-yellow-400" };
  return { name: "Experimental", color: "text-red-400" };
};

// Mini bar component
const MiniBar = ({ value, max = 1, color = "bg-phosphor" }: { value: number; max?: number; color?: string }) => (
  <div className="h-2 w-16 bg-void/50 rounded overflow-hidden">
    <div 
      className={`h-full ${color} transition-all duration-75`}
      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
    />
  </div>
);

// Mini curve visualization
const MiniCurve = ({ fn, currentX }: { fn: (x: number) => number; currentX: number }) => {
  const points: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const x = i / 20;
    const y = fn(x);
    points.push(`${2 + x * 36},${18 - y * 16}`);
  }
  
  const currentY = fn(currentX);
  
  return (
    <svg width="40" height="20" className="opacity-60">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-phosphor/50"
      />
      <circle
        cx={2 + currentX * 36}
        cy={18 - currentY * 16}
        r="2"
        className="fill-phosphor"
      />
    </svg>
  );
};

const DebugOverlay = ({ params, analyser }: DebugOverlayProps) => {
  const [audioData, setAudioData] = useState({
    bass: 0, lowMid: 0, mid: 0, high: 0, energy: 0, beatIntensity: 0
  });
  const [beatFlash, setBeatFlash] = useState(false);
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const frameRef = useRef<number>(0);
  
  // Initialize audio analyzer
  useEffect(() => {
    analyzerRef.current = new AudioAnalyzer();
  }, []);
  
  // Update analyzer when analyser node changes
  useEffect(() => {
    if (analyzerRef.current) {
      analyzerRef.current.setAnalyser(analyser);
    }
  }, [analyser]);
  
  // Animation loop for audio data
  useEffect(() => {
    const update = () => {
      if (analyzerRef.current) {
        const data = analyzerRef.current.analyze();
        setAudioData(data);
        
        // Flash on beat
        if (data.beatIntensity > 0.7) {
          setBeatFlash(true);
          setTimeout(() => setBeatFlash(false), 100);
        }
      }
      frameRef.current = requestAnimationFrame(update);
    };
    
    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);
  
  // Compute timing variables (matching shader logic)
  const timingVars = {
    breathPhaseSpeed: 1.5 + audioData.bass * 4.0 + audioData.beatIntensity * 3.0,
    flowSpeed: 0.02 + audioData.lowMid * 0.08 + audioData.energy * 0.04,
    shimmerSpeed: 8.0 + audioData.high * 20.0,
    animationTempo: 1.0 + audioData.energy * 0.5,
  };
  
  // Compute slider values
  const sliderData = (Object.keys(SLIDER_CURVES) as (keyof VisualizerParams)[]).map(key => {
    const raw = params[key];
    const curve = SLIDER_CURVES[key];
    const eased = curve.fn(raw);
    const effective = key === 'dose' ? eased : eased * params.dose;
    const zone = getZone(raw);
    
    return { key, raw, eased, effective, curveName: curve.name, curve: curve.fn, zone };
  });

  return (
    <div className="fixed top-20 right-4 z-50 font-mono text-[10px] bg-void/90 border border-phosphor/30 rounded p-3 backdrop-blur-sm w-80 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3 border-b border-phosphor/20 pb-2">
        <span className="text-phosphor font-bold text-xs">DEBUG [D to hide]</span>
        <div className={`w-3 h-3 rounded-full transition-all ${beatFlash ? 'bg-red-500 scale-125' : 'bg-void border border-phosphor/30'}`} />
      </div>
      
      {/* Audio Analysis */}
      <div className="mb-4">
        <div className="text-muted-foreground mb-2 font-semibold">AUDIO ANALYSIS</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Bass</span>
            <div className="flex items-center gap-2">
              <span className="text-phosphor w-8 text-right">{audioData.bass.toFixed(2)}</span>
              <MiniBar value={audioData.bass} color="bg-red-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Low-mid</span>
            <div className="flex items-center gap-2">
              <span className="text-phosphor w-8 text-right">{audioData.lowMid.toFixed(2)}</span>
              <MiniBar value={audioData.lowMid} color="bg-orange-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Mid</span>
            <div className="flex items-center gap-2">
              <span className="text-phosphor w-8 text-right">{audioData.mid.toFixed(2)}</span>
              <MiniBar value={audioData.mid} color="bg-yellow-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">High</span>
            <div className="flex items-center gap-2">
              <span className="text-phosphor w-8 text-right">{audioData.high.toFixed(2)}</span>
              <MiniBar value={audioData.high} color="bg-cyan-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Energy</span>
            <div className="flex items-center gap-2">
              <span className="text-phosphor w-8 text-right">{audioData.energy.toFixed(2)}</span>
              <MiniBar value={audioData.energy} color="bg-purple-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Beat</span>
            <div className="flex items-center gap-2">
              <span className="text-phosphor w-8 text-right">{audioData.beatIntensity.toFixed(2)}</span>
              <MiniBar value={audioData.beatIntensity} color="bg-pink-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Timing Variables */}
      <div className="mb-4 border-t border-phosphor/20 pt-3">
        <div className="text-muted-foreground mb-2 font-semibold">TIMING VARIABLES</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Breath speed</span>
            <span className="text-signal">{timingVars.breathPhaseSpeed.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Flow speed</span>
            <span className="text-signal">{timingVars.flowSpeed.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shimmer speed</span>
            <span className="text-signal">{timingVars.shimmerSpeed.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Anim tempo</span>
            <span className="text-signal">{timingVars.animationTempo.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Slider Values */}
      <div className="border-t border-phosphor/20 pt-3">
        <div className="text-muted-foreground mb-2 font-semibold">SLIDER CURVES</div>
        <div className="space-y-2">
          {sliderData.map(({ key, raw, eased, effective, curveName, curve, zone }) => (
            <div key={key} className="border border-phosphor/10 rounded p-2 bg-void/30">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold ${key === 'dose' ? 'text-phosphor' : 'text-foreground'}`}>
                  {key.toUpperCase()}
                </span>
                <span className={`text-[9px] ${zone.color}`}>{zone.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <MiniCurve fn={curve} currentX={raw} />
                <div className="flex-1 grid grid-cols-3 gap-1 text-[9px]">
                  <div>
                    <div className="text-muted-foreground">raw</div>
                    <div className="text-foreground">{raw.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">eased</div>
                    <div className="text-signal">{eased.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">eff</div>
                    <div className="text-phosphor">{effective.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              <div className="text-[8px] text-muted-foreground/60 mt-1">{curveName}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugOverlay;
