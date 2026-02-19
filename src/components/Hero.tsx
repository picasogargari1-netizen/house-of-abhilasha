import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["activeBanners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
  });

  const slides = (banners || []).map((b) => ({
    image: b.image_url,
    link: b.link || "/all-products",
    buttonText: b.button_text || "Shop Now",
  }));

  const nextSlide = useCallback(() => {
    if (slides.length > 0) {
      setCurrent((prev) => (prev + 1) % slides.length);
    }
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length > 0) {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }
  }, [slides.length]);

  useEffect(() => {
    setCurrent(0);
  }, [banners]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  if (isLoading || slides.length === 0) {
    return (
      <section className="relative w-full">
        <div className="w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[16/7] bg-muted animate-pulse" />
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden group">
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[16/7]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.buttonText}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 left-1/2 -translate-x-1/2">
              <button
                onClick={() => navigate(slide.link)}
                className="bg-background/90 text-foreground px-6 sm:px-10 py-2.5 sm:py-3 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium hover:bg-background transition-colors border border-border whitespace-nowrap"
              >
                {slide.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Left/Right arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === current ? "bg-background" : "bg-background/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
