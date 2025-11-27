import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipForward, Music2 } from "lucide-react";
import { tracks, ALBUM_TITLE, Track } from "@/lib/soma-tracks";

interface TrackPlayerProps {
  onAudioInit: (context: AudioContext, analyser: AnalyserNode) => void;
}

const TrackPlayer = ({ onAudioInit }: TrackPlayerProps) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    // Setup ended event for auto-advance
    audio.addEventListener("ended", handleNext);

    return () => {
      audio.removeEventListener("ended", handleNext);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;

    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    onAudioInit(audioContext, analyser);
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

  return (
    <Card className="border-phosphor/30 bg-card/80 p-6 backdrop-blur-md">
      <div className="mb-4">
        <div className="mb-1 font-mono text-xs text-muted-foreground">
          SOMA // SUBLINGUAL RADIO
        </div>
        <h3 className="mb-3 font-mono text-sm font-semibold text-foreground">
          {ALBUM_TITLE}
        </h3>
        
        {currentTrack && (
          <div className="mb-4 flex items-start gap-2 rounded border border-phosphor/20 bg-void/50 p-3">
            <Music2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-phosphor" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs text-signal">NOW PLAYING</div>
              <div className="font-mono text-sm text-foreground">
                Track {currentTrack.id} — {currentTrack.title}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 space-y-2">
        <div className="font-mono text-xs text-muted-foreground">
          SELECT TRACK
        </div>
        <div className="space-y-1">
          {tracks.map((track) => (
            <Button
              key={track.id}
              onClick={() => playTrack(track)}
              variant={currentTrack?.id === track.id ? "default" : "outline"}
              size="sm"
              className={`w-full justify-start font-mono text-xs ${
                currentTrack?.id === track.id
                  ? "bg-phosphor text-void hover:bg-phosphor/90"
                  : "border-phosphor/30 hover:border-phosphor hover:bg-card"
              }`}
            >
              <span className="mr-2 text-signal">{String(track.id).padStart(2, '0')}</span>
              {track.title}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-t border-phosphor/20 pt-4">
        <Button
          onClick={togglePlay}
          disabled={!currentTrack}
          variant="outline"
          size="sm"
          className="flex-1 border-phosphor/30 font-mono hover:border-phosphor hover:bg-card"
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
          className="border-phosphor/30 font-mono hover:border-phosphor hover:bg-card"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default TrackPlayer;
