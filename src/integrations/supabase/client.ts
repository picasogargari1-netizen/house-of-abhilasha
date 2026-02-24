import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://oxvkxbygniwgcahmmeea.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dmt4Ynlnbml3Z2NhaG1tZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzIwODYsImV4cCI6MjA4NzAwODA4Nn0.m52n5x3o5TKXWIWuCGiU0DImYFlknLbMlt71j6ZbtzQ";

const isDev = import.meta.env.DEV;

const devProxyFetch: typeof fetch = (input, init) => {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (url.startsWith(SUPABASE_URL)) {
    url = url.replace(SUPABASE_URL, '/supabase-proxy');
  }
  return fetch(url, init);
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  ...(isDev ? { global: { fetch: devProxyFetch } } : {}),
});
