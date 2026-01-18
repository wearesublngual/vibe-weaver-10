/**
 * Image Picker Button - Compact image selector for top bar
 * Opens a popover with presets and upload option
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

interface ImagePickerButtonProps {
  onImageLoad: (image: HTMLImageElement) => void;
  currentImage: HTMLImageElement | null;
}

const MAX_SIZE = 1024;

const PRESET_IMAGES = [
  { name: 'Rainbow Mountain', src: '/images/presets/vinicunca-mountain.jpg' },
  { name: 'Dragon Trees', src: '/images/presets/socotra-island.jpg' },
  { name: 'Chocolate Hills', src: '/images/presets/chocolate-hills.jpg' },
  { name: 'Horseshoe Bend', src: '/images/presets/horseshoe-bend.webp' },
  { name: 'Mountain Lake', src: '/images/presets/mountain-reflection.jpg' },
];

const DEFAULT_PRESET_INDEX = 0;

const ImagePickerButton = ({ onImageLoad, currentImage }: ImagePickerButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(DEFAULT_PRESET_INDEX);
  const [isOpen, setIsOpen] = useState(false);
  const hasLoadedDefault = useRef(false);

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

  const loadImage = useCallback((src: string, isPreset: boolean = false, presetIndex?: number) => {
    setIsLoading(true);
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
          setIsLoading(false);
          setIsOpen(false);
        };
      } else {
        onImageLoad(img);
        setIsLoading(false);
        setIsOpen(false);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image');
      setIsLoading(false);
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
      setIsLoading(false);
    }
  }, [loadImage]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="font-mono text-foreground hover:text-phosphor relative"
        >
          <ImageIcon className="h-4 w-4" />
          {currentImage && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-phosphor" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 border-phosphor/30 bg-card/95 backdrop-blur-md p-3"
        align="end"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs text-muted-foreground">
              SELECT IMAGE
            </label>
            {isLoading && (
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
          <div className="grid grid-cols-5 gap-1.5">
            {PRESET_IMAGES.map((preset, index) => (
              <button
                key={preset.name}
                onClick={() => loadImage(preset.src, true, index)}
                disabled={isLoading}
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
            onClick={handleClick}
            disabled={isLoading}
            className="w-full border-phosphor/30 font-mono text-xs hover:border-phosphor hover:bg-card"
          >
            <Upload className="mr-2 h-3 w-3" />
            Upload Custom
          </Button>

          <p className="font-mono text-[9px] text-muted-foreground/50 text-center">
            your reality substrate
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ImagePickerButton;
