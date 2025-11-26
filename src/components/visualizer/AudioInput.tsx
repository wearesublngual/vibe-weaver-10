import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Upload } from "lucide-react";
import { toast } from "sonner";

interface AudioInputProps {
  onAudioInit: (context: AudioContext, analyser: AnalyserNode) => void;
}

const AudioInput = ({ onAudioInit }: AudioInputProps) => {
  const [isInitializing, setIsInitializing] = useState(false);

  const initAudio = async (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      onAudioInit(audioContext, analyser);
      toast.success("Audio stream connected", {
        description: "Visualizer is now reacting to audio input",
      });
    } catch (error) {
      console.error("Error initializing audio:", error);
      toast.error("Failed to initialize audio");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleMicrophoneInput = async () => {
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      await initAudio(stream);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Microphone access denied", {
        description: "Please allow microphone access to use this feature",
      });
      setIsInitializing(false);
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsInitializing(true);
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(analyser);
      source.start(0);

      onAudioInit(audioContext, analyser);
      toast.success("Audio file loaded", {
        description: `Playing: ${file.name}`,
      });
    } catch (error) {
      console.error("Error loading audio file:", error);
      toast.error("Failed to load audio file");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleMicrophoneInput}
        disabled={isInitializing}
        size="sm"
        className="flex-1 bg-phosphor font-mono text-primary-foreground shadow-glow-phosphor hover:bg-electric hover:shadow-glow-electric"
      >
        <Mic className="mr-2 h-4 w-4" />
        {isInitializing ? "Initializing..." : "Use Mic"}
      </Button>

      <label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isInitializing}
        />
        <Button
          variant="outline"
          size="sm"
          className="border-phosphor/30 font-mono hover:border-phosphor hover:bg-card"
          asChild
        >
          <span className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </span>
        </Button>
      </label>
    </div>
  );
};

export default AudioInput;
