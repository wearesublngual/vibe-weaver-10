import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import HydraCanvas from "@/components/visualizer/HydraCanvas";
import TrackPlayer from "@/components/visualizer/TrackPlayer";
import { generateSeed } from "@/lib/seed-generator";

const Visualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [mode, setMode] = useState(1);
  const [seafloor, setSeafloor] = useState([0.5]);
  const [storm, setStorm] = useState([0.5]);
  const [beacon, setBeacon] = useState([0.5]);

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
    setMode(1);
    setSeafloor([0.5]);
    setStorm([0.5]);
    setBeacon([0.5]);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      {/* Scanline effect */}
      <div className="scanline" />

      {/* Hydra Canvas - Full screen background */}
      <div className="absolute inset-0">
        <HydraCanvas
          seed={seed}
          mode={mode}
          seafloor={seafloor[0]}
          storm={storm[0]}
          beacon={beacon[0]}
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
                  REALITY MODULATION
                </h3>

                <div className="space-y-6">
                  {/* Visual Mode Selection */}
                  <div>
                    <div className="mb-2 font-mono text-xs text-muted-foreground">
                      VISUAL MODE
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 1, name: "Portal" },
                        { id: 2, name: "Drift" },
                        { id: 3, name: "Bloom" },
                        { id: 4, name: "Scanner" },
                        { id: 5, name: "Ritual" },
                        { id: 6, name: "Tide" },
                      ].map((m) => (
                        <Button
                          key={m.id}
                          onClick={() => setMode(m.id)}
                          variant={mode === m.id ? "default" : "outline"}
                          size="sm"
                          className={`font-mono text-xs ${
                            mode === m.id
                              ? "bg-phosphor text-void hover:bg-phosphor/90"
                              : "border-phosphor/30 hover:border-phosphor hover:bg-card"
                          }`}
                        >
                          {m.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-phosphor/20 pt-4">
                    <div className="mb-3 font-mono text-xs text-muted-foreground">
                      ALTER THE MAP
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="font-mono text-xs text-muted-foreground">
                          SEAFLOOR
                        </label>
                        <span className="font-mono text-xs text-signal">
                          {(seafloor[0] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={seafloor}
                        onValueChange={setSeafloor}
                        max={1}
                        step={0.01}
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="font-mono text-xs text-muted-foreground">
                          STORM
                        </label>
                        <span className="font-mono text-xs text-signal">
                          {(storm[0] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={storm}
                        onValueChange={setStorm}
                        max={1}
                        step={0.01}
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="font-mono text-xs text-muted-foreground">
                          BEACON
                        </label>
                        <span className="font-mono text-xs text-signal">
                          {(beacon[0] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={beacon}
                        onValueChange={setBeacon}
                        max={1}
                        step={0.01}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

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
