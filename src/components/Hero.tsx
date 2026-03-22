import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { proxyImageUrl } from "@/lib/utils";

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 3 + Math.random() * 5,
  left: 5 + Math.random() * 90,
  duration: 12 + Math.random() * 16,
  delay: Math.random() * 14,
  opacity: 0.25 + Math.random() * 0.35,
}));

const Hero = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const particles = useMemo(() => PARTICLES, []);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["activeBanners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id, image_url, link, button_text, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const slides = (banners || []).map((b) => ({
    image: b.image_url,
    link: b.link || "/all-products",
    buttonText: b.button_text || "Shop Now",
  }));

  const nextSlide = useCallback(() => {
    if (slides.length > 0) setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length > 0) setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => { setCurrent(0); }, [banners]);

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
              src={proxyImageUrl(slide.image)}
              alt={slide.buttonText}
              className="w-full h-full object-cover"
            />

            {/* Subtle vignette overlay for depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)",
              }}
            />

            {/* CTA Button with 3D shimmer */}
            <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 left-1/2 -translate-x-1/2">
              <button
                onClick={() => navigate(slide.link)}
                className="btn-gold-shimmer bg-background/90 text-foreground px-6 sm:px-10 py-2.5 sm:py-3 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium border border-border whitespace-nowrap rounded-sm"
                style={{ background: "rgba(255,255,255,0.92)", color: "hsl(var(--foreground))" }}
              >
                {slide.buttonText}
              </button>
            </div>
          </div>
        ))}

        {/* Gold floating particles — desktop only */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block overflow-hidden">
          {particles.map((p) => (
            <span
              key={p.id}
              className="gold-particle"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.left}%`,
                bottom: 0,
                opacity: p.opacity,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100 hover:scale-110 transition-transform"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100 hover:scale-110 transition-transform"
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
              className={`rounded-full transition-all duration-300 ${
                index === current
                  ? "bg-background w-5 h-2"
                  : "bg-background/50 w-2 h-2"
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
