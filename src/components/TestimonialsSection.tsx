import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { proxyImageUrl } from "@/lib/utils";
import { User, Quote } from "lucide-react";
import { useRef, useState } from "react";

type Testimonial = {
  id: string;
  testimonial_type: "video" | "photo";
  customer_name: string;
  customer_photo_url: string | null;
  feedback_text: string | null;
  video_url: string | null;
  display_order: number;
};

const usePublicTestimonials = (type: "video" | "photo") =>
  useQuery({
    queryKey: ["publicTestimonials", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, testimonial_type, customer_name, customer_photo_url, feedback_text, video_url, display_order")
        .eq("testimonial_type", type)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(type === "video" ? 4 : 20);
      if (error) throw error;
      return (data || []) as Testimonial[];
    },
  });

const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

const FLOAT_CLASSES = ["card-float", "card-float-2", "card-float-3", "card-float-4"];

const VideoCard = ({ video }: { video: Testimonial }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasThumbnail, setHasThumbnail] = useState(false);

  const captureThumbnail = () => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas) return;
    try {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || vid.videoWidth || 200;
      canvas.height = rect.height || vid.videoHeight || 355;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(vid, 0, 0, canvas.width, canvas.height);
      setHasThumbnail(true);
    } catch {
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) videoRef.current.currentTime = 0.1;
  };

  const handleSeeked = () => {
    if (!isPlaying) captureThumbnail();
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      setHasThumbnail(false);
      videoRef.current.currentTime = 0;
      try {
        await videoRef.current.play();
      } catch {
        setIsPlaying(false);
        setHasThumbnail(true);
      }
    }
  };

  return (
    <div
      className="group relative rounded-2xl overflow-hidden shadow-md bg-gray-900 aspect-[9/16] max-h-80 w-full"
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        if (isTouchDevice()) return;
        (e.currentTarget as HTMLDivElement).style.transform = "perspective(600px) rotateY(-4deg) rotateX(2deg) scale(1.03)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)";
      }}
    >
      {!hasError ? (
        <video
          ref={videoRef}
          src={video.video_url!}
          className="w-full h-full object-cover"
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={() => setHasError(true)}
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <p className="text-white/50 text-xs text-center px-2">Video unavailable</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ display: hasThumbnail && !isPlaying ? "block" : "none" }}
      />

      {!hasError && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center transition-colors"
          style={{ background: isPlaying ? "transparent" : "rgba(0,0,0,0.15)" }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {!isPlaying && (
            <div
              className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
              style={{ boxShadow: "0 4px 20px rgba(255,215,80,0.3), 0 2px 8px rgba(0,0,0,0.2)" }}
            >
              <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 pointer-events-none">
        <p className="text-white text-sm font-medium">{video.customer_name}</p>
      </div>
    </div>
  );
};

const PhotoCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tilting, setTilting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice() || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: cy * 8, y: cx * -8 });
    setTilting(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setTilting(false);
  };

  const floatClass = FLOAT_CLASSES[index % FLOAT_CLASSES.length];

  return (
    <div
      ref={cardRef}
      className={`tilt-card bg-white rounded-2xl p-3 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-4 relative ${floatClass}`}
      style={{
        boxShadow: tilting
          ? "0 20px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)"
          : "0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilting ? 8 : 0}px)`,
        transition: tilting
          ? "transform 0.08s ease-out, box-shadow 0.08s ease-out"
          : "transform 0.45s ease-out, box-shadow 0.45s ease-out",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Quote className="absolute top-2 right-2 sm:top-4 sm:right-4 h-4 w-4 sm:h-6 sm:w-6 text-primary/20" />
      {testimonial.customer_photo_url ? (
        <img
          src={proxyImageUrl(testimonial.customer_photo_url)}
          alt={testimonial.customer_name}
          className="w-10 h-10 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary/20"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12), inset 0 0 0 2px rgba(255,255,255,0.6)" }}
        />
      ) : (
        <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center"
          style={{ boxShadow: "inset 0 2px 6px rgba(0,0,0,0.08)" }}
        >
          <User className="h-5 w-5 sm:h-8 sm:w-8 text-primary/50" />
        </div>
      )}
      <div>
        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed italic line-clamp-4">"{testimonial.feedback_text}"</p>
        <p className="mt-1 sm:mt-3 font-semibold text-gray-900 text-xs sm:text-sm">— {testimonial.customer_name}</p>
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  const { data: videos } = usePublicTestimonials("video");
  const { data: photos } = usePublicTestimonials("photo");

  const hasVideos = (videos?.length || 0) > 0;
  const hasPhotos = (photos?.length || 0) > 0;

  if (!hasVideos && !hasPhotos) return null;

  return (
    <section className="py-10 sm:py-16 bg-gradient-to-b from-white to-[#fdf6ef]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-7 sm:mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 heading-3d">
            What Our Customers Say About Us
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
            Real stories from our valued customers who love House of Abhilasha
          </p>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          />
        </div>

        {hasVideos && (
          <div className="mb-14">
            <div
              className={`grid gap-4 justify-items-center ${
                videos!.length === 1
                  ? "grid-cols-1 max-w-xs mx-auto"
                  : videos!.length === 2
                  ? "grid-cols-2 max-w-sm mx-auto"
                  : videos!.length === 3
                  ? "grid-cols-3 max-w-2xl mx-auto"
                  : "grid-cols-2 md:grid-cols-4 max-w-4xl mx-auto"
              }`}
            >
              {videos!.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        )}

        {hasPhotos && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 max-w-6xl mx-auto">
            {photos!.map((p, i) => (
              <PhotoCard key={p.id} testimonial={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
