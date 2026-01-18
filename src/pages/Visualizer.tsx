import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import WebGLCanvas from "@/components/visualizer/WebGLCanvas";
import BottomPlayerBar from "@/components/visualizer/BottomPlayerBar";
import DebugOverlay from "@/components/visualizer/DebugOverlay";
import { encodeSeed, decodeSeed } from "@/lib/seed-generator";
import { VisualizerParams, DEFAULT_PARAMS, AudioEffectParams, DEFAULT_AUDIO_PARAMS } from "@/visualizers/types";
import { AudioEffectsChain } from "@/visualizers/audio-effects-chain";
import { useToast } from "@/hooks/use-toast";
import { useBreakpoint } from "@/hooks/use-breakpoint";
const Visualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const [seedInput, setSeedInput] = useState<string>("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [effectsChain, setEffectsChain] = useState<AudioEffectsChain | null>(null);
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
      // H key is now handled by drawer internally
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      <div className="scanline" />

      {/* WebGL Canvas - Full screen background */}
      <div className="absolute inset-0">
        <WebGLCanvas seed={seed} params={params} analyser={analyser} imageSource={sourceImage} />
      </div>

      {/* Debug Overlay - Press D to toggle */}
      {showDebug && (
        <DebugOverlay 
          params={params} 
          analyser={analyser} 
          audioParams={audioParams} 
          effectsChain={effectsChain} 
        />
      )}

      {/* Top Bar - Minimal */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-phosphor/20 bg-card/80 px-4 py-3 backdrop-blur-md"
      >
        <Link to="/">
          <Button variant="ghost" size="sm" className="font-mono text-foreground hover:text-phosphor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <div className={`flex h-2 w-2 rounded-full ${isPlaying ? 'bg-phosphor animate-pulse shadow-glow-phosphor' : 'bg-muted-foreground/50'}`} />
          <span className="font-mono text-xs sm:text-sm text-signal">
            {isPlaying ? "TRANSMISSION ACTIVE" : "AWAITING SIGNAL"}
          </span>
        </div>

        {/* Empty div for layout balance since image picker moved to player bar */}
        <div className="w-10" />
      </motion.div>

      {/* Docked Player - Left panel on desktop, bottom drawer on mobile/tablet */}
      <BottomPlayerBar
        onAudioInit={handleAudioInit}
        audioParams={audioParams}
        params={params}
        onParamChange={updateParam}
        onAudioParamChange={updateAudioParam}
        onGenerateSeed={handleGenerateSeed}
        onLoadSeed={handleLoadSeed}
        onCopySeed={handleCopySeed}
        onReset={handleReset}
        seedInput={seedInput}
        onSeedInputChange={setSeedInput}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onImageLoad={handleImageLoad}
        currentImage={sourceImage}
      />
    </div>
  );
};

export default Visualizer;
