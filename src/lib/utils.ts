import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SUPABASE_URL = "https://oxvkxbygniwgcahmmeea.supabase.co";

/**
 * Returns a video URL that bypasses ImageKit's auto-format transcoding.
 * Without this, ImageKit detects Chrome's user-agent and transcodes the MP4
 * to WebM, which hits the account's video transformation limit and returns 403.
 * ?tr=orig-true tells ImageKit to serve the original file with no transcoding.
 */
export function getVideoSrc(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("https://ik.imagekit.io/")) {
    const u = new URL(url);
    u.searchParams.set("tr", "orig-true");
    return u.toString();
  }
  return url;
}

export function proxyImageUrl(url: string): string {
  if (!url) return url;
  // ImageKit URLs are already public CDN URLs — no proxy needed
  if (url.startsWith("https://ik.imagekit.io/")) return url;
  if (import.meta.env.DEV) {
    if (url.startsWith(SUPABASE_URL + "/storage/")) {
      return url.replace(SUPABASE_URL + "/storage", "/supabase-storage");
    }
    return url;
  }
  if (url.startsWith(SUPABASE_URL + "/storage/")) {
    return url.replace(SUPABASE_URL, "/sb");
  }
  return url;
}
