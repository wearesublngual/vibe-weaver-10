/**
 * Bottom Player Bar - Spotify-inspired docked player
 * Responsive: Bottom drawer on mobile/tablet, left panel on desktop
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHandle } from "@/components/ui/drawer";
import { Play, Pause, SkipForward, Settings2, ChevronUp, Upload } from "lucide-react";
import { tracks, ALBUM_TITLE, Track } from "@/lib/soma-tracks";
import { AudioEffectsChain } from "@/visualizers/audio-effects-chain";
import { AudioEffectParams, DEFAULT_AUDIO_PARAMS, VisualizerParams } from "@/visualizers/types";
import PowerControlsSheet from "./PowerControlsSheet";
import AnimatedHeading from "./AnimatedHeading";
import { useBreakpoint } from "@/hooks/use-breakpoint";

const PRESET_IMAGES = [
  { name: 'Rainbow Mountain', src: '/images/presets/vinicunca-mountain.jpg' },
  { name: 'Dragon Trees', src: '/images/presets/socotra-island.jpg' },
  { name: 'Chocolate Hills', src: '/images/presets/chocolate-hills.jpg' },
  { name: 'Horseshoe Bend', src: '/images/presets/horseshoe-bend.webp' },
  { name: 'Mountain Lake', src: '/images/presets/mountain-reflection.jpg' },
];

const MAX_SIZE = 1024;
const DEFAULT_PRESET_INDEX = 0;

interface BottomPlayerBarProps {
  onAudioInit: (context: AudioContext, analyser: AnalyserNode, effectsChain: AudioEffectsChain) => void;
  audioParams: AudioEffectParams;
  params: VisualizerParams;
  onParamChange: (key: keyof VisualizerParams, value: number) => void;
  onAudioParamChange: (key: keyof AudioEffectParams, value: number) => void;
  onGenerateSeed: () => void;
  onLoadSeed: () => void;
  onCopySeed: () => void;
  onReset: () => void;
  seedInput: string;
  onSeedInputChange: (value: string) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onImageLoad: (image: HTMLImageElement) => void;
  currentImage: HTMLImageElement | null;
}

const BottomPlayerBar = ({
  onAudioInit,
  audioParams,
  params,
  onParamChange,
  onAudioParamChange,
  onGenerateSeed,
  onLoadSeed,
  onCopySeed,
  onReset,
  seedInput,
  onSeedInputChange,
  isPlaying,
  setIsPlaying,
  onImageLoad,
  currentImage,
}: BottomPlayerBarProps) => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
  
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [showPowerControls, setShowPowerControls] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<number>(DEFAULT_PRESET_INDEX);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const effectsChainRef = useRef<AudioEffectsChain | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedDefault = useRef(false);

  // Image resize utility
  const resizeImage = useCallback((img: HTMLImageElement): HTMLImageElement => {
    if (img.width <= MAX_SIZE && img.height <= MAX_SIZE) {
      return img;
    }

    let newWidth = img.width;
    let newHeight = img.height;
    
    if (img.width > img.height) {
      newWidth = MAX_SIZE;
      newHeight = Math.round((img.height / img.width) * MAX_SIZE);
    } else {
      newHeight = MAX_SIZE;
      newWidth = Math.round((img.width / img.height) * MAX_SIZE);
    }

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return img;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL('image/jpeg', 0.9);
    
    return resizedImg;
  }, []);

  // Image loading utility
  const loadImage = useCallback((src: string, isPreset: boolean = false, presetIndex?: number) => {
    setIsLoadingImage(true);
    if (isPreset && presetIndex !== undefined) {
      setSelectedPreset(presetIndex);
    } else if (!isPreset) {
      setSelectedPreset(-1);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const processedImg = resizeImage(img);
      
      if (processedImg !== img) {
        processedImg.onload = () => {
          onImageLoad(processedImg);
          setIsLoadingImage(false);
        };
      } else {
        onImageLoad(img);
        setIsLoadingImage(false);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image');
      setIsLoadingImage(false);
    };

    img.src = src;
  }, [onImageLoad, resizeImage]);

  // Load default preset on mount
  useEffect(() => {
    if (!hasLoadedDefault.current && !currentImage) {
      hasLoadedDefault.current = true;
      loadImage(PRESET_IMAGES[DEFAULT_PRESET_INDEX].src, true, DEFAULT_PRESET_INDEX);
    }
  }, [loadImage, currentImage]);

  // H key handler for hide/show
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'h' || e.key === 'H') {
        if (isDesktop) {
          setIsHidden(prev => !prev);
        } else {
          setDrawerOpen(prev => !prev);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop]);

  // Handle file upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      loadImage(objectUrl, false);
    } catch (err) {
      console.error('Error processing image:', err);
      setIsLoadingImage(false);
    }
  }, [loadImage]);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    audio.addEventListener("ended", handleNext);

    return () => {
      audio.removeEventListener("ended", handleNext);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (effectsChainRef.current) {
        effectsChainRef.current.dispose();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (effectsChainRef.current) {
      effectsChainRef.current.setParams(audioParams);
    }
  }, [audioParams]);

  const updateLoop = useCallback(() => {
    if (effectsChainRef.current) {
      effectsChainRef.current.update();
    }
    animationRef.current = requestAnimationFrame(updateLoop);
  }, []);

  const initAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;

    const effectsChain = new AudioEffectsChain(audioContext);
    effectsChain.setParams(audioParams);

    const source = audioContext.createMediaElementSource(audioRef.current);
    sourceRef.current = source;

    source.connect(effectsChain.getInput());
    effectsChain.getOutput().connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    effectsChainRef.current = effectsChain;

    updateLoop();
    onAudioInit(audioContext, analyser, effectsChain);
  };

  const playTrack = (track: Track) => {
    if (!audioRef.current) return;

    setCurrentTrack(track);
    audioRef.current.src = track.file;
    audioRef.current.load();

    if (!audioContextRef.current) {
      initAudioContext();
    }

    audioRef.current.play().then(() => {
      setIsPlaying(true);
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    }).catch((err) => {
      console.error("Playback error:", err);
    });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume();
        }
      });
    }
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  };

  // Shared content for both layouts
  const PlayerContent = () => (
    <div className="space-y-4">
      {/* Album Header */}
      <div className="text-center pb-2">
        <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
          SOMA // SUBLINGUAL RADIO
        </div>
        <h2 className="font-mono text-sm font-semibold text-foreground mt-1">
          {ALBUM_TITLE}
        </h2>
      </div>

      {/* Animated "SELECT A QUESTION" heading */}
      <AnimatedHeading text="SELECT A QUESTION" className="text-center" />

      {/* Question/Track List */}
      <div className="space-y-1.5">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => playTrack(track)}
            className={`w-full text-left p-3 rounded border transition-all font-mono text-sm ${
              currentTrack?.id === track.id
                ? "bg-phosphor text-void border-phosphor"
                : "bg-void/50 text-foreground border-phosphor/20 hover:border-phosphor/50 hover:bg-void/80"
            }`}
          >
            <span className={`mr-2 ${currentTrack?.id === track.id ? "text-void/70" : "text-signal"}`}>
              {String(track.id).padStart(2, '0')}
            </span>
            {track.title}
          </button>
        ))}
      </div>

      {/* DOSAGE Slider - Higher priority, above image selection */}
      <div className="border-t border-phosphor/20 pt-4" data-vaul-no-drag>
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-xs font-bold text-phosphor">
            DOSAGE
          </label>
          <span className="font-mono text-xs text-signal">
            {(params.dose * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          value={[params.dose]}
          onValueChange={([v]) => onParamChange('dose', v)}
          max={1}
          step={0.01}
          className="cursor-pointer"
        />
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
          how many milligrams of SOMA to take
        </p>
      </div>

      {/* Image Selection */}
      <div className="border-t border-phosphor/20 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-xs text-muted-foreground">
            SELECT OR UPLOAD IMAGE
          </label>
          {isLoadingImage && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-phosphor border-t-transparent" />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preset Grid */}
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {PRESET_IMAGES.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => loadImage(preset.src, true, index)}
              disabled={isLoadingImage}
              className={`relative aspect-square overflow-hidden rounded transition-all ${
                selectedPreset === index 
                  ? 'ring-2 ring-phosphor ring-offset-1 ring-offset-background' 
                  : 'opacity-60 hover:opacity-100'
              }`}
              title={preset.name}
            >
              <img
                src={preset.src}
                alt={preset.name}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Upload Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoadingImage}
          className="w-full border-phosphor/30 font-mono text-xs hover:border-phosphor hover:bg-card"
        >
          <Upload className="mr-2 h-3 w-3" />
          Upload Custom
        </Button>

        <p className="font-mono text-[9px] text-muted-foreground/50 text-center mt-1">
          your reality substrate
        </p>
      </div>

      {/* Playback Controls + Tune Button */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={togglePlay}
          disabled={!currentTrack}
          variant="outline"
          size="sm"
          className="flex-1 border-phosphor/30 font-mono text-foreground hover:border-phosphor hover:bg-card"
        >
          {isPlaying ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Play
            </>
          )}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!currentTrack}
          variant="outline"
          size="sm"
          className="border-phosphor/30 font-mono text-foreground hover:border-phosphor hover:bg-card"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setShowPowerControls(!showPowerControls)}
          variant={showPowerControls ? "default" : "outline"}
          size="sm"
          className={showPowerControls 
            ? "bg-phosphor text-void hover:bg-phosphor/90" 
            : "border-phosphor/30 font-mono text-foreground hover:border-phosphor hover:bg-card"
          }
        >
          <Settings2 className="h-4 w-4 mr-1" />
          Tune Dose
        </Button>
      </div>

      {/* Power Controls (Expandable) */}
      {showPowerControls && (
        <PowerControlsSheet
          params={params}
          audioParams={audioParams}
          onParamChange={onParamChange}
          onAudioParamChange={onAudioParamChange}
          onGenerateSeed={onGenerateSeed}
          onLoadSeed={onLoadSeed}
          onCopySeed={onCopySeed}
          onReset={onReset}
          seedInput={seedInput}
          onSeedInputChange={onSeedInputChange}
        />
      )}

      {/* CLI Hint */}
      <div className="text-center pt-2">
        <p className="font-mono text-[10px] text-muted-foreground/40">
          hint: press H to hide • D for debug
        </p>
      </div>
    </div>
  );

  // Desktop: Left docked panel
  if (isDesktop) {
    if (isHidden) {
      return (
        <Button
          onClick={() => setIsHidden(false)}
          variant="outline"
          size="sm"
          className="fixed left-4 bottom-4 z-50 border-phosphor/30 font-mono text-xs hover:border-phosphor hover:bg-card"
        >
          <Eye className="mr-2 h-4 w-4" />
          Show Controls (H)
        </Button>
      );
    }
    
    return (
      <div className="fixed left-0 top-[52px] bottom-0 w-80 z-50 border-r border-phosphor/30 bg-card/95 backdrop-blur-md overflow-y-auto">
        <div className="px-4 py-6">
          <PlayerContent />
        </div>
      </div>
    );
  }

  // Mobile/Tablet: Bottom drawer
  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} handleOnly>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Collapsed mini bar when drawer is closed */}
        {!drawerOpen && (
          <DrawerTrigger asChild>
            <button className="w-full border-t border-phosphor/20 bg-card/95 backdrop-blur-md p-3 flex items-center justify-between hover:bg-card transition-colors">
              <div className="flex items-center gap-3">
                <ChevronUp className="h-4 w-4 text-phosphor animate-pulse" />
                <span className="font-mono text-xs text-muted-foreground">SOMA</span>
                {currentTrack && (
                  <span className="font-mono text-xs text-foreground truncate max-w-[200px]">
                    {currentTrack.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-signal">DOSAGE {(params.dose * 100).toFixed(0)}%</span>
                {isPlaying && <div className="h-2 w-2 rounded-full bg-phosphor animate-pulse" />}
              </div>
            </button>
          </DrawerTrigger>
        )}

        <DrawerContent className="border-t border-phosphor/30 bg-card/95 backdrop-blur-md max-h-[85vh]">
          {/* Real Vaul Handle for handleOnly mode */}
          <DrawerHandle className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-phosphor/30 my-3" />

          <div className="px-4 pb-6 overflow-y-auto max-h-[calc(85vh-60px)]">
            <PlayerContent />
          </div>
        </DrawerContent>
      </div>
    </Drawer>
  );
};

export default BottomPlayerBar;
