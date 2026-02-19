import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AnnouncementBar = () => {
  const [current, setCurrent] = useState(0);

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("message")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data?.map((a) => a.message) || [];
    },
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
    <div className="bg-[hsl(35,30%,25%)] text-[hsl(40,30%,90%)] text-center py-2.5 text-xs relative flex items-center justify-center tracking-wider">
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + messages.length) % messages.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Previous announcement"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <p className="px-10">{messages[current]}</p>
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % messages.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Next announcement"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
