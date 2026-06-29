import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalCache, setLocalCache } from "@/lib/localCache";

const CACHE_KEY = "hoa_announcements";
const CACHE_TTL = 4 * 60 * 60 * 1000;

const AnnouncementBar = () => {
  const [current, setCurrent] = useState(0);

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const cached = getLocalCache<string[]>(CACHE_KEY, CACHE_TTL);
      if (cached) return cached;

      const { data, error } = await supabase
        .from("announcements")
        .select("message")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      const result = data?.map((a) => a.message) || [];
      setLocalCache(CACHE_KEY, result);
      return result;
    },
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
  });

  const messages = announcements?.length ? announcements : [];

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0 && current >= messages.length) setCurrent(0);
  }, [messages.length, current]);

  if (messages.length === 0) return null;

  return (
    <div className="bg-[hsl(35,30%,25%)] text-[hsl(40,30%,90%)] text-center py-2 sm:py-2.5 text-[10px] sm:text-xs relative flex items-center justify-center tracking-wider">
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + messages.length) % messages.length)}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Previous announcement"
      >
        <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
      <p className="px-8 sm:px-10 line-clamp-1 sm:line-clamp-none">{messages[current]}</p>
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % messages.length)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Next announcement"
      >
        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
