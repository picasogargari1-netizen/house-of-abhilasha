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

const VideoCard = ({ video }: { video: Testimonial }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden shadow-md bg-black aspect-[9/16] max-h-80 w-full">
      <video
        ref={videoRef}
        src={video.video_url!}
        className="w-full h-full object-cover"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        playsInline
        preload="metadata"
      />
      {/* Play/pause overlay */}
      <button
        onClick={handlePlayPause}
        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {!isPlaying && (
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </button>
      {/* Customer name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
        <p className="text-white text-sm font-medium">{video.customer_name}</p>
      </div>
    </div>
  );
};

const PhotoCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4 relative">
    <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/20" />
    {testimonial.customer_photo_url ? (
      <img
        src={proxyImageUrl(testimonial.customer_photo_url)}
        alt={testimonial.customer_name}
        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
      />
    ) : (
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-8 w-8 text-primary/50" />
      </div>
    )}
    <div>
      <p className="text-gray-700 text-sm leading-relaxed italic">"{testimonial.feedback_text}"</p>
      <p className="mt-3 font-semibold text-gray-900 text-sm">— {testimonial.customer_name}</p>
    </div>
  </div>
);

const TestimonialsSection = () => {
  const { data: videos } = usePublicTestimonials("video");
  const { data: photos } = usePublicTestimonials("photo");

  const hasVideos = (videos?.length || 0) > 0;
  const hasPhotos = (photos?.length || 0) > 0;

  if (!hasVideos && !hasPhotos) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-[#fdf6ef]">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">
            What Our Customers Say About Us
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
            Real stories from our valued customers who love House of Abhilasha
          </p>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
        </div>

        {/* Video testimonials */}
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

        {/* Photo / text testimonials */}
        {hasPhotos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {photos!.map((p) => (
              <PhotoCard key={p.id} testimonial={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
