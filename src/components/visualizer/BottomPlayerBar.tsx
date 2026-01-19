/**
 * Bottom Player Bar - Spotify-inspired docked player
 * Primary interaction point for track selection and DOSE control
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Play, Pause, SkipForward, Settings2, ChevronUp } from "lucide-react";
import { tracks, ALBUM_TITLE, Track } from "@/lib/soma-tracks";
import { AudioEffectsChain } from "@/visualizers/audio-effects-chain";
import { AudioEffectParams, DEFAULT_AUDIO_PARAMS, VisualizerParams } from "@/visualizers/types";
import PowerControlsSheet from "./PowerControlsSheet";
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
  setIsPlaying
}: BottomPlayerBarProps) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [showPowerControls, setShowPowerControls] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const effectsChainRef = useRef<AudioEffectsChain | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
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
    }).catch(err => {
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
  return <>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {/* Collapsed mini bar when drawer is closed */}
          {!drawerOpen && <DrawerTrigger asChild>
              <button className="w-full border-t border-phosphor/20 bg-card/95 backdrop-blur-md p-3 flex items-center justify-between hover:bg-card transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronUp className="h-4 w-4 text-phosphor animate-pulse" />
                  <span className="font-mono text-xs text-muted-foreground">SOMA</span>
                  {currentTrack && <span className="font-mono text-xs text-foreground truncate max-w-[200px]">
                      {currentTrack.title}
                    </span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-signal">DOSE {(params.dose * 100).toFixed(0)}%</span>
                  {isPlaying && <div className="h-2 w-2 rounded-full bg-phosphor animate-pulse" />}
                </div>
              </button>
            </DrawerTrigger>}

          <DrawerContent className="border-t border-phosphor/30 bg-card/95 backdrop-blur-md max-h-[85vh]">
            {/* Drawer Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-phosphor/30 my-3" />

            <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[calc(85vh-60px)]">
              {/* Album Header */}
              <div className="text-center pb-2">
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                  SOMA // SUBLINGUAL RADIO
                </div>
                <h2 className="font-mono text-sm font-semibold text-foreground mt-1">
                  {ALBUM_TITLE}
                </h2>
              </div>

              {/* Question/Track List */}
              <div className="space-y-2">
                <div className="font-mono text-xs text-muted-foreground">
                  SELECT A QUESTION
                </div>
                <div className="space-y-1.5">
                  {tracks.map(track => <button key={track.id} onClick={() => playTrack(track)} className={`w-full text-left p-3 rounded border transition-all font-mono text-sm ${currentTrack?.id === track.id ? "bg-phosphor text-void border-phosphor" : "bg-void/50 text-foreground border-phosphor/20 hover:border-phosphor/50 hover:bg-void/80"}`}>
                      <span className={`mr-2 ${currentTrack?.id === track.id ? "text-void/70" : "text-signal"}`}>
                        {String(track.id).padStart(2, '0')}
                      </span>
                      {track.title}
                    </button>)}
                </div>
              </div>

              {/* DOSE Slider - Always Visible */}
              <div className="border-t border-phosphor/20 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-xs font-bold text-phosphor">
                    DOSAGE
                  </label>
                  <span className="font-mono text-xs text-signal">
                    {(params.dose * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider value={[params.dose]} onValueChange={([v]) => onParamChange('dose', v)} max={1} step={0.01} className="cursor-pointer" />
                <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                  how many milligrams of SOMA to take
                </p>
              </div>

              {/* Playback Controls + Tune Button */}
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={togglePlay} disabled={!currentTrack} variant="outline" size="sm" className="flex-1 border-phosphor/30 font-mono text-foreground hover:border-phosphor hover:bg-card">
                  {isPlaying ? <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </> : <>
                      <Play className="mr-2 h-4 w-4" />
                      Play
                    </>}
                </Button>
                <Button onClick={handleNext} disabled={!currentTrack} variant="outline" size="sm" className="border-phosphor/30 font-mono text-foreground hover:border-phosphor hover:bg-card">
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowPowerControls(!showPowerControls)} variant={showPowerControls ? "default" : "outline"} size="sm" className={showPowerControls ? "bg-phosphor text-void hover:bg-phosphor/90" : "border-phosphor/30 font-mono text-foreground hover:border-phosphor hover:bg-card"}>
                  <Settings2 className="h-4 w-4 mr-1" />
                  Tune Dose
                </Button>
              </div>

              {/* Power Controls (Expandable) */}
              {showPowerControls && <PowerControlsSheet params={params} audioParams={audioParams} onParamChange={onParamChange} onAudioParamChange={onAudioParamChange} onGenerateSeed={onGenerateSeed} onLoadSeed={onLoadSeed} onCopySeed={onCopySeed} onReset={onReset} seedInput={seedInput} onSeedInputChange={onSeedInputChange} />}

              {/* CLI Hint */}
              <div className="text-center pt-2">
                <p className="font-mono text-[10px] text-muted-foreground/40">
                  hint: press H to hide • D for debug
                </p>
              </div>
            </div>
          </DrawerContent>
        </div>
      </Drawer>
    </>;
};
export default BottomPlayerBar;