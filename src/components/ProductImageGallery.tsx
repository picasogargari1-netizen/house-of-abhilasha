import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery = ({ images, productName }: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const validImages = images.filter((img) => img && img.trim() !== "");

  const goNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const goPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (validImages.length === 0) {
    return (
      <div className="aspect-[3/4] overflow-hidden bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Vertical Thumbnails - Left Side (desktop only) */}
      {validImages.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden border transition-all",
                selectedIndex === index
                  ? "border-foreground"
                  : "border-border hover:border-foreground/50 opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="flex-1">
        <div
          className="relative aspect-[3/4] overflow-hidden bg-muted cursor-crosshair"
          style={{ touchAction: "pan-y pinch-zoom" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={validImages[selectedIndex]}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            className="w-full h-full object-cover sm:hover:scale-110 transition-transform duration-500"
            draggable={false}
          />

          {/* Mobile Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-1.5"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <button
                onClick={goNext}
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-1.5"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Dots */}
        {validImages.length > 1 && (
          <div className="flex sm:hidden justify-center gap-1.5 mt-3">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  selectedIndex === index ? "bg-foreground" : "bg-border"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageGallery;
