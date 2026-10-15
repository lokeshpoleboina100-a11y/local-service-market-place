import React, { useState } from 'react';
import { Camera, ZoomIn, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface JobImageGalleryProps {
  images?: string[] | null;
  categoryTitle?: string;
}

export default function JobImageGallery({ images, categoryTitle }: JobImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

  if (validImages.length === 0) {
    return null;
  }

  const activeImage = validImages[selectedIdx] || validImages[0];

  return (
    <Card className="p-4 rounded-2xl border-blue-100 dark:border-blue-900/30 bg-white dark:bg-slate-900/90 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Camera className="h-4 w-4 text-blue-600" />
          Customer Repair Photos
        </h4>
        <Badge variant="outline" className="text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200">
          {validImages.length} {validImages.length === 1 ? 'photo' : 'photos'} uploaded
        </Badge>
      </div>

      {/* Main Image View */}
      <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <img
          src={activeImage}
          alt={`Problem repair visual ${selectedIdx + 1}`}
          className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
          onClick={() => setModalOpen(true)}
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
        >
          <ZoomIn className="h-3.5 w-3.5" /> Full view
        </button>
        <span className="absolute top-2.5 left-2.5 bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
          Photo {selectedIdx + 1} of {validImages.length}
        </span>
      </div>

      {/* Thumbnails row (if multiple images) */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                selectedIdx === idx
                  ? 'border-blue-600 ring-2 ring-blue-600/20 scale-105'
                  : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none text-white overflow-hidden rounded-2xl">
          <div className="relative flex flex-col items-center justify-center min-h-[400px] max-h-[85vh]">
            <img
              src={activeImage}
              alt="Full view repair photo"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
            />
            {validImages.length > 1 && (
              <div className="flex items-center justify-between w-full px-4 pt-3 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={() => setSelectedIdx((prev) => (prev > 0 ? prev - 1 : validImages.length - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1 text-white font-medium"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span>
                  Photo {selectedIdx + 1} of {validImages.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIdx((prev) => (prev < validImages.length - 1 ? prev + 1 : 0))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1 text-white font-medium"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
