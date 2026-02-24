import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SUPABASE_URL = "https://oxvkxbygniwgcahmmeea.supabase.co";

export function proxyImageUrl(url: string): string {
  if (!url || !import.meta.env.DEV) return url;
  if (url.startsWith(SUPABASE_URL + "/storage/")) {
    return url.replace(SUPABASE_URL + "/storage", "/supabase-storage");
  }
  return url;
}
