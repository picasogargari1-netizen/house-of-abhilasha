import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SUPABASE_URL = "https://oxvkxbygniwgcahmmeea.supabase.co";

export function proxyImageUrl(url: string): string {
  if (!url) return url;
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
