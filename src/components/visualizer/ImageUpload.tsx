/**
 * Image Upload Component for Visualizer
 * Handles image upload, resize, and preview
 */

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageLoad: (image: HTMLImageElement) => void;
  currentImage: HTMLImageElement | null;
}

const MAX_SIZE = 1024; // Max dimension for performance

const ImageUpload = ({ onImageLoad, currentImage }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsLoading(true);

    try {
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Resize if needed
        const processedImg = resizeImage(img);
        
        // Wait for resized image to load if it's a new image
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

      img.src = objectUrl;
    } catch (err) {
      console.error('Error processing image:', err);
      setIsLoading(false);
    }
  }, [onImageLoad, resizeImage]);

  const handleClear = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs text-muted-foreground">
          SOURCE IMAGE
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

      {preview ? (
        <div 
          className="relative aspect-square w-full cursor-pointer overflow-hidden rounded border border-phosphor/30 bg-void/50"
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
            <span className="font-mono text-xs text-phosphor">Change Image</span>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleClick}
          disabled={isLoading}
          className="w-full border-dashed border-phosphor/30 py-8 font-mono hover:border-phosphor hover:bg-card"
        >
          <div className="flex flex-col items-center gap-2">
            {isLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-phosphor border-t-transparent" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Upload Image
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  JPG, PNG, WebP • Max 1024px
                </span>
              </>
            )}
          </div>
        </Button>
      )}

      <p className="font-mono text-[10px] text-muted-foreground/60">
        Image will be transformed by the perceptual effects
      </p>
    </div>
  );
};

export default ImageUpload;
