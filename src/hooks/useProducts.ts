import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: number | string;
  name: string;
  description: string;
  orderDetails: string;
  price: number;
  discountedPrice?: number | null;
  category: string;
  image: string;
  images?: string[];
  inStock?: boolean;
  featured?: boolean;
  source?: string;
}

// Convert Google Drive view links to direct image URLs
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return "";
  
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  
  return url;
};

const fetchAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_available", true);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []).map((item: any) => {
    const allImages: string[] = [];
    if (item.image_url1) allImages.push(convertGoogleDriveUrl(item.image_url1));
    if (item.image_url2) allImages.push(convertGoogleDriveUrl(item.image_url2));
    if (item.image_url3) allImages.push(convertGoogleDriveUrl(item.image_url3));

    return {
      id: item.id,
      name: item.name || "",
      description: item.description || "",
      orderDetails: item.short_description || "",
      price: Number(item.price) || 0,
      discountedPrice: item.discounted_price ? Number(item.discounted_price) : null,
      category: item.category || "",
      image: allImages[0] || "",
      images: allImages,
      inStock: item.in_stock,
      featured: item.featured,
      source: item.source,
    };
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchAllProducts,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductsByCategory = (category: string) => {
  const { data: products, ...rest } = useProducts();
  
  const filteredProducts = products?.filter(
    (product) => product.category.toLowerCase() === category.toLowerCase()
  );
  
  return { data: filteredProducts, ...rest };
};

export const useProduct = (id: string) => {
  const { data: products, ...rest } = useProducts();
  
  const product = products?.find(
    (p) => String(p.id) === id
  );
  
  return { data: product, ...rest };
};

export const getCategories = (products: Product[]): string[] => {
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories);
};

export const clothingCategories: string[] = [];
export const jewelleryCategories: string[] = [];
