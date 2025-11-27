import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import WebGLCanvas from "@/components/visualizer/WebGLCanvas";
import TrackPlayer from "@/components/visualizer/TrackPlayer";
import { generateSeed } from "@/lib/seed-generator";
import { VisualizerParams, DEFAULT_PARAMS } from "@/visualizers/types";

// Slider configuration with poetic names and descriptions
const SLIDERS = [
  { key: 'depth', name: 'DEPTH', description: 'Density of the field' },
  { key: 'curvature', name: 'CURVATURE', description: 'Spatial warping' },
  { key: 'turbulence', name: 'TURBULENCE', description: 'Order to chaos' },
  { key: 'branching', name: 'BRANCHING', description: 'Pattern multiplication' },
  { key: 'persistence', name: 'PERSISTENCE', description: 'Echo trails' },
  { key: 'focus', name: 'FOCUS', description: 'Center attention' },
] as const;

const Visualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showControls, setShowControls] = useState(true);
  
  // 6 slider params
  const [params, setParams] = useState<VisualizerParams>(DEFAULT_PARAMS);

  useEffect(() => {
    // Generate initial seed
    setSeed(generateSeed());
  }, []);

  const handleAudioInit = (context: AudioContext, analyserNode: AnalyserNode) => {
    setAudioContext(context);
    setAnalyser(analyserNode);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setSeed(generateSeed());
    setParams(DEFAULT_PARAMS);
  };

  const updateParam = (key: keyof VisualizerParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      {/* Scanline effect */}
      <div className="scanline" />

      {/* WebGL Canvas - Full screen background */}
      <div className="absolute inset-0">
        <WebGLCanvas
          seed={seed}
          params={params}
          analyser={analyser}
        />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Top Bar */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between border-b border-phosphor/20 bg-card/80 p-4 backdrop-blur-md"
        >
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-foreground hover:text-phosphor"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2 animate-pulse rounded-full bg-phosphor shadow-glow-phosphor" />
            <span className="font-mono text-sm text-signal">
              {isPlaying ? "TRANSMISSION ACTIVE" : "AWAITING SIGNAL"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowControls(!showControls)}
            className="font-mono text-foreground hover:text-phosphor"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            {showControls ? "Hide" : "Show"} Controls
          </Button>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex flex-1 items-end justify-between gap-6 p-6">
          {/* Left: Track Player */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-96"
          >
            <TrackPlayer onAudioInit={handleAudioInit} />
          </motion.div>

          {/* Right: Controls Panel */}
          {showControls && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-80"
            >
              <Card className="border-phosphor/30 bg-card/80 p-6 backdrop-blur-md">
                <h3 className="mb-4 font-mono text-sm font-semibold text-foreground">
                  PERCEPTUAL ENGINE
                </h3>

                <div className="space-y-4">
                  {/* 6 Visual Sliders */}
                  {SLIDERS.map((slider) => (
                    <div key={slider.key}>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="font-mono text-xs text-muted-foreground">
                          {slider.name}
                        </label>
                        <span className="font-mono text-xs text-signal">
                          {(params[slider.key] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={[params[slider.key]]}
                        onValueChange={([v]) => updateParam(slider.key, v)}
                        max={1}
                        step={0.01}
                        className="cursor-pointer"
                      />
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                        {slider.description}
                      </p>
                    </div>
                  ))}

                  <div className="border-t border-phosphor/20 pt-4">
                    <div className="mb-2 font-mono text-xs text-muted-foreground">
                      SESSION SEED
                    </div>
                    <div className="mb-3 rounded border border-phosphor/20 bg-void/50 p-2 font-mono text-sm text-phosphor">
                      {seed}
                    </div>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                      className="w-full border-phosphor/30 font-mono hover:border-phosphor hover:bg-card"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      New Seed
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Bottom Info Bar */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-phosphor/20 bg-card/80 p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              SUBLINGUAL RECORDS // SOMA // COUPLED OSCILLATOR ENGINE
            </p>
            <p className="font-mono text-xs text-signal">
              {isPlaying ? "AUDIO STREAM ACTIVE" : "AWAITING AUDIO INPUT"}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Visualizer;
