/**
 * Power Controls Sheet - Accordion for power users
 * Contains visual effects, audio engine, and seed controls
 */

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RotateCcw, Copy, Upload, Sparkles } from "lucide-react";
import {
  VisualizerParams,
  AudioEffectParams,
  EFFECT_SLIDERS,
  AUDIO_EFFECT_SLIDERS,
} from "@/visualizers/types";

interface PowerControlsSheetProps {
  params: VisualizerParams;
  audioParams: AudioEffectParams;
  onParamChange: (key: keyof VisualizerParams, value: number) => void;
  onAudioParamChange: (key: keyof AudioEffectParams, value: number) => void;
  onGenerateSeed: () => void;
  onLoadSeed: () => void;
  onCopySeed: () => void;
  onReset: () => void;
  seedInput: string;
  onSeedInputChange: (value: string) => void;
}

const PowerControlsSheet = ({
  params,
  audioParams,
  onParamChange,
  onAudioParamChange,
  onGenerateSeed,
  onLoadSeed,
  onCopySeed,
  onReset,
  seedInput,
  onSeedInputChange,
}: PowerControlsSheetProps) => {
  return (
    <div className="border-t border-phosphor/20 pt-4">
      <Accordion type="multiple" defaultValue={["visual"]} className="space-y-2">
        {/* Visual Effects */}
        <AccordionItem value="visual" className="border-phosphor/20">
          <AccordionTrigger className="font-mono text-xs text-foreground hover:no-underline py-2">
            VISUAL EFFECTS
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {EFFECT_SLIDERS.filter(s => s.key !== 'dose').map(slider => (
              <div key={slider.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[10px] text-muted-foreground">
                    {slider.label}
                  </label>
                  <span className="font-mono text-[10px] text-signal">
                    {(params[slider.key] * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[params[slider.key]]}
                  onValueChange={([v]) => onParamChange(slider.key, v)}
                  max={1}
                  step={0.01}
                  className="cursor-pointer"
                />
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/50">
                  {slider.description}
                </p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Auditory Engine */}
        <AccordionItem value="audio" className="border-phosphor/20">
          <AccordionTrigger className="font-mono text-xs text-foreground hover:no-underline py-2">
            AUDITORY ENGINE
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {AUDIO_EFFECT_SLIDERS.map(slider => (
              <div key={slider.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[10px] text-muted-foreground">
                    {slider.label}
                  </label>
                  <span className="font-mono text-[10px] text-signal">
                    {(audioParams[slider.key] * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[audioParams[slider.key]]}
                  onValueChange={([v]) => onAudioParamChange(slider.key, v)}
                  max={1}
                  step={0.01}
                  className="cursor-pointer"
                />
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/50">
                  {slider.description}
                </p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Session Seed */}
        <AccordionItem value="seed" className="border-phosphor/20">
          <AccordionTrigger className="font-mono text-xs text-foreground hover:no-underline py-2">
            SESSION SEED
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <p className="font-mono text-[9px] text-muted-foreground/60">
              save or restore this reality profile
            </p>
            
            {/* Seed Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={seedInput}
                onChange={(e) => onSeedInputChange(e.target.value.toUpperCase())}
                placeholder="SR-XXXXXXXXXXXXXXXXXX"
                className="flex-1 rounded border border-phosphor/20 bg-void/50 px-2 py-1.5 font-mono text-[10px] text-phosphor placeholder:text-muted-foreground/40 focus:border-phosphor focus:outline-none"
              />
              <Button
                onClick={onCopySeed}
                variant="outline"
                size="sm"
                className="border-phosphor/30 px-2 hover:border-phosphor hover:bg-card h-8"
                title="Copy seed"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Seed Actions */}
            <div className="flex gap-2">
              <Button
                onClick={onGenerateSeed}
                variant="outline"
                size="sm"
                className="flex-1 border-phosphor/30 font-mono text-[10px] hover:border-phosphor hover:bg-card h-7"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Generate
              </Button>
              <Button
                onClick={onLoadSeed}
                variant="outline"
                size="sm"
                className="flex-1 border-phosphor/30 font-mono text-[10px] hover:border-phosphor hover:bg-card h-7"
              >
                <Upload className="mr-1 h-3 w-3" />
                Load
              </Button>
            </div>

            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="w-full border-phosphor/30 font-mono text-[10px] hover:border-phosphor hover:bg-card h-7"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset All
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default PowerControlsSheet;
