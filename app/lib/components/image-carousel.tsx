import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { BASE_URL } from "../services/auth/loginService";

interface ImageCarouselProps {
  images: Array<{ id: number; image_url: string; created_at?: string }>;
  onClose: () => void;
  title?: string;
}

export function ImageCarousel({ images, onClose, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-gray-500 text-sm">No images available</p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const imageUrl = currentImage.image_url.startsWith("http")
    ? currentImage.image_url
    : `${currentImage.image_url}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Main image display */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <img
          src={`${BASE_URL}${imageUrl}`}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Image counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Info section */}
      {currentImage.created_at && (
        <div className="text-xs text-gray-500 text-center">
          {new Date(currentImage.created_at).toLocaleString()}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, idx) => (
            <button
              key={image.id}
              onClick={() => goToSlide(idx)}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === idx
                  ? "border-blue-500"
                  : "border-transparent hover:border-gray-300",
              )}
            >
              <img
                src={image.image_url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
