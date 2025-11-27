import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import WebGLCanvas from "@/components/visualizer/WebGLCanvas";
import TrackPlayer from "@/components/visualizer/TrackPlayer";
import ImageUpload from "@/components/visualizer/ImageUpload";
import DebugOverlay from "@/components/visualizer/DebugOverlay";
import { generateSeed } from "@/lib/seed-generator";
import { VisualizerParams, DEFAULT_PARAMS, EFFECT_SLIDERS, AudioEffectParams, DEFAULT_AUDIO_PARAMS, AUDIO_EFFECT_SLIDERS } from "@/visualizers/types";
import { AudioEffectsChain } from "@/visualizers/audio-effects-chain";
const Visualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [effectsChain, setEffectsChain] = useState<AudioEffectsChain | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // Visual params: dose + 5 effects
  const [params, setParams] = useState<VisualizerParams>(DEFAULT_PARAMS);

  // Audio effect params: echo, drift, break
  const [audioParams, setAudioParams] = useState<AudioEffectParams>(DEFAULT_AUDIO_PARAMS);
  useEffect(() => {
    setSeed(generateSeed());
  }, []);

  // Keyboard shortcut for debug overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        // Don't toggle if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setShowDebug(prev => !prev);
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
    setSeed(generateSeed());
    setParams(DEFAULT_PARAMS);
    setAudioParams(DEFAULT_AUDIO_PARAMS);
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

      {/* HUD Edge Text - Bottom Left */}
      <div className="pointer-events-none absolute bottom-24 left-4 z-20 space-y-1">
        <div className="font-mono text-[10px] text-phosphor/40">&gt; listening for future signals_</div>
        <div className="font-mono text-[10px] text-phosphor/40">&gt; music_as_map :: active</div>
        <div className="font-mono text-[10px] text-muted-foreground/40">&gt; press H to hide HUD</div>
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
            {/* Image Upload */}
            <Card className="border-phosphor/30 bg-card/80 p-4 backdrop-blur-md">
              <ImageUpload onImageLoad={handleImageLoad} currentImage={sourceImage} />
            </Card>
            
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
                  <div className="mb-3 rounded border border-phosphor/20 bg-void/50 p-2 font-mono text-sm text-phosphor">
                    {seed}
                  </div>
                  <Button onClick={handleReset} variant="outline" size="sm" className="w-full border-phosphor/30 font-mono hover:border-phosphor hover:bg-card">
                    <RotateCcw className="mr-2 h-4 w-4" />
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