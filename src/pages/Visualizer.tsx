import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, RotateCcw, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import HydraCanvas from "@/components/visualizer/HydraCanvas";
import AudioInput from "@/components/visualizer/AudioInput";
import { generateSeed } from "@/lib/seed-generator";

const Visualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [intensity, setIntensity] = useState([0.5]);
  const [speed, setSpeed] = useState([0.5]);
  const [complexity, setComplexity] = useState([0.5]);

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
    setIntensity([0.5]);
    setSpeed([0.5]);
    setComplexity([0.5]);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      {/* Scanline effect */}
      <div className="scanline" />

      {/* Hydra Canvas - Full screen background */}
      <div className="absolute inset-0">
        <HydraCanvas
          seed={seed}
          intensity={intensity[0]}
          speed={speed[0]}
          complexity={complexity[0]}
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
              TRANSMISSION ACTIVE
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
        <div className="flex flex-1 items-end justify-between p-6">
          {/* Seed Display */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-phosphor/30 bg-card/80 p-4 backdrop-blur-md">
              <div className="mb-2 font-mono text-xs text-muted-foreground">
                SESSION SEED
              </div>
              <div className="font-mono text-lg font-semibold text-phosphor">
                {seed}
              </div>
            </Card>
          </motion.div>

          {/* Controls Panel */}
          {showControls && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-80"
            >
              <Card className="border-phosphor/30 bg-card/80 p-6 backdrop-blur-md">
                <h3 className="mb-4 font-mono text-sm font-semibold text-foreground">
                  INTERFERENCE CONTROLS
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-mono text-xs text-muted-foreground">
                        INTENSITY
                      </label>
                      <span className="font-mono text-xs text-signal">
                        {(intensity[0] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={intensity}
                      onValueChange={setIntensity}
                      max={1}
                      step={0.01}
                      className="cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-mono text-xs text-muted-foreground">
                        SPEED
                      </label>
                      <span className="font-mono text-xs text-signal">
                        {(speed[0] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      max={1}
                      step={0.01}
                      className="cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-mono text-xs text-muted-foreground">
                        COMPLEXITY
                      </label>
                      <span className="font-mono text-xs text-signal">
                        {(complexity[0] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={complexity}
                      onValueChange={setComplexity}
                      max={1}
                      step={0.01}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    {!isPlaying && (
                      <AudioInput onAudioInit={handleAudioInit} />
                    )}
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-phosphor/30 font-mono hover:border-phosphor hover:bg-card"
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
              SUBLINGUAL RECORDS // SOMA // ALBUM ZERO
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
