import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Eye } from "lucide-react";

const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return "";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
};

const BestSellers = () => {
  const { addToCart } = useCart();

  const { data: bestSellers, isLoading } = useQuery({
    queryKey: ["bestSellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_best_seller", true)
        .eq("is_available", true)
        .limit(4);
      if (error) throw error;
      return (data || []).map((item: any) => {
        const allImages: string[] = [];
        if (item.image_url1) allImages.push(convertGoogleDriveUrl(item.image_url1));
        if (item.image_url2) allImages.push(convertGoogleDriveUrl(item.image_url2));
        if (item.image_url3) allImages.push(convertGoogleDriveUrl(item.image_url3));
        return {
          id: item.id,
          name: item.name || "",
          price: Number(item.price) || 0,
          discountedPrice: item.discounted_price ? Number(item.discounted_price) : null,
          image: allImages[0] || "",
        };
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.image,
    });
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
            Shop Best Sellers
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[5/7] w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!bestSellers?.length) return null;

  return (
    <section className="py-12 md:py-16 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
          Shop Best Sellers
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {bestSellers.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group relative"
            >
              <div className="relative aspect-[5/7] overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="bg-background p-2 rounded-full shadow-md hover:bg-background/90">
                    <Eye className="h-4 w-4 text-foreground" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="w-full bg-foreground/90 text-background py-3 text-xs uppercase tracking-[0.1em] font-medium flex items-center justify-center gap-2 hover:bg-foreground transition-colors"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="text-center mt-3 space-y-1">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1 uppercase tracking-wide">
                  {product.name}
                </h3>
                {product.discountedPrice ? (
                  <p className="text-sm">
                    <span className="text-foreground font-medium">₹{product.discountedPrice.toLocaleString("en-IN")}</span>
                    <span className="text-muted-foreground line-through ml-2">₹{product.price.toLocaleString("en-IN")}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">₹{product.price.toLocaleString("en-IN")}</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
