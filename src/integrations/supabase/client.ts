import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const proxyFetch: typeof fetch = (input, init) => {
  if (!import.meta.env.DEV) return fetch(input, init);

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
  global: {
    fetch: proxyFetch,
  },
});