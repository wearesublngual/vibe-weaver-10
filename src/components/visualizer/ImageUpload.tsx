/**
 * Image Upload Component for Visualizer
 * Handles image upload, resize, and preset selection
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, Upload } from 'lucide-react';

interface ImageUploadProps {
  onImageLoad: (image: HTMLImageElement) => void;
  currentImage: HTMLImageElement | null;
}

const MAX_SIZE = 1024; // Max dimension for performance

// Preset images with names
const PRESET_IMAGES = [
  { name: 'Rainbow Mountain', src: '/images/presets/vinicunca-mountain.jpg' },
  { name: 'Dragon Trees', src: '/images/presets/socotra-island.jpg' },
  { name: 'Chocolate Hills', src: '/images/presets/chocolate-hills.jpg' },
  { name: 'Horseshoe Bend', src: '/images/presets/horseshoe-bend.webp' },
  { name: 'Mountain Lake', src: '/images/presets/mountain-reflection.jpg' },
];

const DEFAULT_PRESET_INDEX = 0; // Rainbow Mountain as default

const ImageUpload = ({ onImageLoad, currentImage }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(PRESET_IMAGES[DEFAULT_PRESET_INDEX].src);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(DEFAULT_PRESET_INDEX);
  const hasLoadedDefault = useRef(false);

  const resizeImage = useCallback((img: HTMLImageElement): HTMLImageElement => {
    // If already small enough, return as-is
    if (img.width <= MAX_SIZE && img.height <= MAX_SIZE) {
      return img;
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = img.width;
    let newHeight = img.height;
    
    if (img.width > img.height) {
      newWidth = MAX_SIZE;
      newHeight = Math.round((img.height / img.width) * MAX_SIZE);
    } else {
      newHeight = MAX_SIZE;
      newWidth = Math.round((img.width / img.height) * MAX_SIZE);
    }

    // Create canvas and resize
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return img;
    
    // Use high quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Create new image from canvas
    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL('image/jpeg', 0.9);
    
    return resizedImg;
  }, []);

  const loadImage = useCallback((src: string, isPreset: boolean = false, presetIndex?: number) => {
    setIsLoading(true);
    setPreview(src);
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
        };
      } else {
        onImageLoad(img);
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image');
      setIsLoading(false);
      setPreview(null);
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

    // Validate file type
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

  const handleClear = useCallback(() => {
    setPreview(null);
    setSelectedPreset(-1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handlePresetSelect = (index: number) => {
    loadImage(PRESET_IMAGES[index].src, true, index);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs text-muted-foreground">
          1) SELECT OR UPLOAD IMAGE
        </label>
        {preview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Current preview */}
      {preview ? (
        <div 
          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded border border-phosphor/30 bg-void/50"
          onClick={handleClick}
        >
          <img
            src={preview}
            alt="Source"
            className="h-full w-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-void/80">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-phosphor border-t-transparent" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-void/60 opacity-0 transition-opacity hover:opacity-100">
            <span className="font-mono text-xs text-phosphor">Upload Custom</span>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleClick}
          disabled={isLoading}
          className="w-full border-dashed border-phosphor/30 py-6 font-mono hover:border-phosphor hover:bg-card"
        >
          <div className="flex flex-col items-center gap-2">
            {isLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-phosphor border-t-transparent" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Upload Custom Image
                </span>
              </>
            )}
          </div>
        </Button>
      )}

      {/* Preset images grid */}
      <div className="space-y-2">
        <label className="font-mono text-[10px] text-muted-foreground/60 uppercase">
          Or choose a preset
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESET_IMAGES.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(index)}
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
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/60">
        your reality substrate — choose wisely
      </p>
    </div>
  );
};

export default ImageUpload;
