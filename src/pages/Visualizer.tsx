import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Settings2, Copy, Upload, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import WebGLCanvas from "@/components/visualizer/WebGLCanvas";
import TrackPlayer from "@/components/visualizer/TrackPlayer";
import ImageUpload from "@/components/visualizer/ImageUpload";
import DebugOverlay from "@/components/visualizer/DebugOverlay";
import { generateSeed, encodeSeed, decodeSeed, isValidSeed } from "@/lib/seed-generator";
import { VisualizerParams, DEFAULT_PARAMS, EFFECT_SLIDERS, AudioEffectParams, DEFAULT_AUDIO_PARAMS, AUDIO_EFFECT_SLIDERS } from "@/visualizers/types";
import { AudioEffectsChain } from "@/visualizers/audio-effects-chain";
import { useToast } from "@/hooks/use-toast";
const Visualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const [seedInput, setSeedInput] = useState<string>("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [effectsChain, setEffectsChain] = useState<AudioEffectsChain | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const { toast } = useToast();

  // Visual params: dose + 5 effects
  const [params, setParams] = useState<VisualizerParams>(DEFAULT_PARAMS);

  // Audio effect params: echo, drift, break
  const [audioParams, setAudioParams] = useState<AudioEffectParams>(DEFAULT_AUDIO_PARAMS);
  
  // Generate initial seed from default params on mount
  useEffect(() => {
    const initialSeed = encodeSeed(DEFAULT_PARAMS, DEFAULT_AUDIO_PARAMS);
    setSeed(initialSeed);
    setSeedInput(initialSeed);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't toggle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug(prev => !prev);
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowControls(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const handleAudioInit = (context: AudioContext, analyserNode: AnalyserNode, chain: AudioEffectsChain) => {
    setAudioContext(context);
    setAnalyser(analyserNode);
    setEffectsChain(chain);
    setIsPlaying(true);
  };
  const handleImageLoad = (image: HTMLImageElement) => {
    setSourceImage(image);
  };
  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setAudioParams(DEFAULT_AUDIO_PARAMS);
    const newSeed = encodeSeed(DEFAULT_PARAMS, DEFAULT_AUDIO_PARAMS);
    setSeed(newSeed);
    setSeedInput(newSeed);
    toast({ title: "Reset complete", description: "All settings restored to defaults" });
  };

  const handleGenerateSeed = () => {
    const newSeed = encodeSeed(params, audioParams);
    setSeed(newSeed);
    setSeedInput(newSeed);
    toast({ title: "Seed generated", description: "Current settings encoded into seed" });
  };

  const handleLoadSeed = () => {
    const decoded = decodeSeed(seedInput);
    if (decoded) {
      setParams(decoded.params);
      setAudioParams(decoded.audioParams);
      setSeed(seedInput.toUpperCase().startsWith('SR-') ? seedInput.toUpperCase() : `SR-${seedInput.toUpperCase()}`);
      toast({ title: "Seed loaded", description: "Settings restored from seed" });
    } else {
      toast({ title: "Invalid seed", description: "Please enter a valid SR-XXXXXXXXXXXXXXXXXX seed", variant: "destructive" });
    }
  };

  const handleCopySeed = async () => {
    try {
      await navigator.clipboard.writeText(seed);
      toast({ title: "Copied!", description: "Seed copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };
  const updateParam = (key: keyof VisualizerParams, value: number) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const updateAudioParam = (key: keyof AudioEffectParams, value: number) => {
    setAudioParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  return <div className="relative h-screen w-screen overflow-hidden bg-void">
      <div className="scanline" />

      {/* WebGL Canvas - Full screen background */}
      <div className="absolute inset-0">
        <WebGLCanvas seed={seed} params={params} analyser={analyser} imageSource={sourceImage} />
      </div>

      {/* HUD Edge Text - Left Side */}
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <div className="writing-vertical font-mono text-[10px] text-phosphor/40 tracking-widest">
          ▮ sublingual radio · soma · maps for the places we haven't been yet
        </div>
      </div>

      {/* HUD Edge Text - Top Left */}
      <div className="pointer-events-none absolute top-20 left-4 z-20 space-y-1">
        <div className="font-mono text-[10px] text-phosphor/40">&gt; listening for future signals_</div>
        <div className="font-mono text-[10px] text-phosphor/40">&gt; music_as_map :: active</div>
        <div className="font-mono text-[10px] text-muted-foreground/40">&gt; press H to toggle controls</div>
      </div>

      {/* Debug Overlay - Press D to toggle */}
      {showDebug && <DebugOverlay params={params} analyser={analyser} audioParams={audioParams} effectsChain={effectsChain} />}

      {/* UI Overlay */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Top Bar */}
        <motion.div initial={{
        y: -100,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        duration: 0.5
      }} className="flex items-center justify-between border-b border-phosphor/20 bg-card/80 p-4 backdrop-blur-md">
          <Link to="/">
            <Button variant="ghost" size="sm" className="font-mono text-foreground hover:text-phosphor">
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

          <Button variant="ghost" size="sm" onClick={() => setShowControls(!showControls)} className="font-mono text-foreground hover:text-phosphor">
            <Settings2 className="mr-2 h-4 w-4" />
            {showControls ? "Hide" : "Show"} Controls
          </Button>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex flex-1 items-end justify-between gap-6 p-6">
          {/* Left: Track Player + Image Upload */}
          <motion.div initial={{
          x: -100,
          opacity: 0
        }} animate={{
          x: 0,
          opacity: 1
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }} className="flex w-96 flex-col gap-4">
            {/* Image Upload - Hidden when controls are hidden */}
            {showControls && (
              <Card className="border-phosphor/30 bg-card/80 p-4 backdrop-blur-md">
                <ImageUpload onImageLoad={handleImageLoad} currentImage={sourceImage} />
              </Card>
            )}
            
            {/* Track Player */}
            <TrackPlayer onAudioInit={handleAudioInit} audioParams={audioParams} />
          </motion.div>

          {/* Right: Controls Panel */}
          {showControls && <motion.div initial={{
          x: 100,
          opacity: 0
        }} animate={{
          x: 0,
          opacity: 1
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }} className="w-80">
              <Card className="border-phosphor/30 bg-card/80 p-6 backdrop-blur-md max-h-[80vh] overflow-y-auto">
                {/* Visual Controls */}
                <h3 className="mb-4 font-mono text-sm font-semibold text-foreground">3) TAKE A TRIP</h3>

                <div className="space-y-4">
                  {/* Dose slider (highlighted) */}
                  <div className="border-b border-phosphor/20 pb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-mono text-xs font-bold text-phosphor">
                        DOSE
                      </label>
                      <span className="font-mono text-xs text-signal">
                        {(params.dose * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider value={[params.dose]} onValueChange={([v]) => updateParam('dose', v)} max={1} step={0.01} className="cursor-pointer" />
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                      how many milligrams to take
                    </p>
                  </div>

                  {/* 5 Effect Sliders */}
                  {EFFECT_SLIDERS.filter(s => s.key !== 'dose').map(slider => <div key={slider.key}>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="font-mono text-xs text-muted-foreground">
                          {slider.label}
                        </label>
                        <span className="font-mono text-xs text-signal">
                          {(params[slider.key] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider value={[params[slider.key]]} onValueChange={([v]) => updateParam(slider.key, v)} max={1} step={0.01} className="cursor-pointer" />
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                        {slider.description}
                      </p>
                    </div>)}
                </div>

                {/* Audio Effects Section */}
                <div className="mt-6 border-t border-phosphor/20 pt-4">
                  <h3 className="mb-4 font-mono text-sm font-semibold text-foreground">
                    AUDITORY ENGINE
                  </h3>
                  
                  <div className="space-y-4">
                    {AUDIO_EFFECT_SLIDERS.map(slider => <div key={slider.key}>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="font-mono text-xs text-muted-foreground">
                            {slider.label}
                          </label>
                          <span className="font-mono text-xs text-signal">
                            {(audioParams[slider.key] * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Slider value={[audioParams[slider.key]]} onValueChange={([v]) => updateAudioParam(slider.key, v)} max={1} step={0.01} className="cursor-pointer" />
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                          {slider.description}
                        </p>
                      </div>)}
                  </div>
                </div>

                {/* Session Seed */}
                <div className="mt-6 border-t border-phosphor/20 pt-4">
                  <div className="mb-2 font-mono text-xs text-muted-foreground">
                    SESSION SEED
                  </div>
                  <p className="mb-2 font-mono text-[10px] text-muted-foreground/60">
                    save or restore this reality profile
                  </p>
                  
                  {/* Seed Input with Copy Button */}
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value.toUpperCase())}
                      placeholder="SR-XXXXXXXXXXXXXXXXXX"
                      className="flex-1 rounded border border-phosphor/20 bg-void/50 px-2 py-1.5 font-mono text-xs text-phosphor placeholder:text-muted-foreground/40 focus:border-phosphor focus:outline-none"
                    />
                    <Button
                      onClick={handleCopySeed}
                      variant="outline"
                      size="sm"
                      className="border-phosphor/30 px-2 hover:border-phosphor hover:bg-card"
                      title="Copy seed"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Seed Action Buttons */}
                  <div className="flex gap-2 mb-2">
                    <Button 
                      onClick={handleGenerateSeed} 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-phosphor/30 font-mono text-xs hover:border-phosphor hover:bg-card"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Generate
                    </Button>
                    <Button 
                      onClick={handleLoadSeed} 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-phosphor/30 font-mono text-xs hover:border-phosphor hover:bg-card"
                    >
                      <Upload className="mr-1 h-3 w-3" />
                      Load
                    </Button>
                  </div>

                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-phosphor/30 font-mono text-xs hover:border-phosphor hover:bg-card"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Reset All
                  </Button>
                </div>
              </Card>
            </motion.div>}
        </div>

        {/* Bottom Info Bar */}
        <motion.div initial={{
        y: 100,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        duration: 0.5,
        delay: 0.4
      }} className="border-t border-phosphor/20 bg-card/80 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              SUBLINGUAL RECORDS // SOMA // PERCEPTUAL ENGINE
            </p>
            <p className="font-mono text-xs text-signal">
              {sourceImage ? "IMAGE LOADED" : "NO IMAGE"} • {isPlaying ? "AUDIO ACTIVE" : "AWAITING AUDIO"} • Press D for debug
            </p>
          </div>
        </motion.div>
      </div>
    </div>;
};
export default Visualizer;