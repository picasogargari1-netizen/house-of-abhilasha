import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalCache, setLocalCache } from "@/lib/localCache";

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  image_url: string | null;
}

const CACHE_KEY = "hoa_categories";
const CACHE_TTL = 4 * 60 * 60 * 1000;

const fetchCategories = async (): Promise<Category[]> => {
  const cached = getLocalCache<Category[]>(CACHE_KEY, CACHE_TTL);
  if (cached) return cached;

  const [catRes, imgRes] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, slug, display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("category_images")
      .select("category_slug, image_url"),
  ]);

  if (catRes.error) throw catRes.error;
  const cats = catRes.data || [];
  const images = imgRes.data || [];

  const imageMap = new Map(images.map((img) => [img.category_slug, img.image_url]));

  const result = cats.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    display_order: cat.display_order,
    image_url: imageMap.get(cat.slug) ?? null,
  }));

  setLocalCache(CACHE_KEY, result);
  return result;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
  });
};
