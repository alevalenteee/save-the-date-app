"use client";

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Check, X } from 'lucide-react';

// Helper function to create a crop preview
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context is not available');
  }

  // Set the canvas dimensions to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Canvas is empty');
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

// Define types for crop parameters
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export default function ImageCropper({ 
  imageUrl, 
  onCropComplete, 
  onCancel,
  aspectRatio = 16 / 9 
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rotation, setRotation] = useState(0);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((value: number[]) => {
    setZoom(value[0]);
  }, []);

  const onRotationChange = useCallback((value: number[]) => {
    setRotation(value[0]);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleCropImage = async () => {
    console.log("=== CROP IMAGE BUTTON CLICKED ===");
    try {
      if (!croppedAreaPixels) {
        console.log("No cropped area pixels available");
        return;
      }
      
      console.log("Cropped area pixels:", croppedAreaPixels);
      console.log("Starting getCroppedImg function");
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
      console.log("Cropped image created, size:", croppedImage.size);
      
      const croppedImageUrl = URL.createObjectURL(croppedImage);
      console.log("Created object URL for cropped image:", croppedImageUrl);
      
      console.log("Calling onCropComplete callback");
      onCropComplete(croppedImageUrl);
      console.log("onCropComplete callback finished");
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="relative w-full h-64 md:h-96 mb-6 bg-muted rounded-md overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            objectFit="contain"
          />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Zoom</label>
              <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={onZoomChange}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Rotation</label>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={onRotationChange}
            />
          </div>
          
          <div className="flex justify-between gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => { 
                setRotation(0); 
                setZoom(1); 
                setCrop({ x: 0, y: 0 }); 
              }}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={onCancel} 
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button 
                onClick={handleCropImage} 
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Crop
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 