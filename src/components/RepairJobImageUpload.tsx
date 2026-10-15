import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, X, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface RepairJobImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function RepairJobImageUpload({
  images,
  onChange,
  maxImages = 5,
}: RepairJobImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList | File[]) => {
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Limit reached',
        description: `You can upload a maximum of ${maxImages} images.`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: File[] = [];
    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file format',
          description: `${file.name} is not an image file.`,
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (< 6MB)
      if (file.size > 6 * 1024 * 1024) {
        toast({
          title: 'Image too large',
          description: `${file.name} exceeds the 6MB limit.`,
          variant: 'destructive',
        });
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          onChange([...images, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-blue-600" />
            Repair Problem Photos
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload photos of the issue (fridge not cooling, broken phone screen, AC unit, leaking pipe)
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200">
          {images.length} / {maxImages} photos
        </Badge>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm"
            >
              <img
                src={img}
                alt={`Repair photo ${idx + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
                  title="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
                Photo #{idx + 1}
              </span>
            </div>
          ))}

          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-900/50 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col items-center justify-center gap-1 text-blue-600 transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[11px] font-semibold">+ Add more</span>
            </button>
          )}
        </div>
      )}

      {/* Drag & Drop Upload Zone (when empty or below limit) */}
      {images.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
            isDragging
              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 scale-[0.99]'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/40'
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">
            Click to upload or drag & drop repair photos
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Supports JPG, PNG, WEBP up to 6MB each (up to {maxImages} photos)
          </p>

          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" /> Browse Gallery
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" /> Take Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
