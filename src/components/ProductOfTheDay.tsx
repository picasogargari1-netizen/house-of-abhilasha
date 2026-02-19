import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return "";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
};

const ProductOfTheDay = () => {
  const { data: product, isLoading } = useQuery({
    queryKey: ["productOfTheDay"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_product_of_day", true)
        .eq("is_available", true)
        .limit(1)
        .single();
      if (error) return null;
      if (!data) return null;
      const image = data.image_url1 ? convertGoogleDriveUrl(data.image_url1) : "";
      return {
        id: data.id,
        name: data.name,
        description: data.short_description || data.description || "",
        price: Number(data.price) || 0,
        discountedPrice: data.discounted_price ? Number(data.discounted_price) : null,
        image,
      };
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
            Product of the Day
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-4xl mx-auto">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
          Product of the Day
        </h2>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-4xl mx-auto">
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center md:text-left">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
              Featured Product
            </span>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-2 mb-4">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {product.description}
            </p>
            {product.discountedPrice ? (
              <div className="mb-3">
                <span className="text-lg font-semibold text-foreground">₹{product.discountedPrice.toLocaleString("en-IN")}</span>
                <span className="text-muted-foreground line-through ml-2">₹{product.price.toLocaleString("en-IN")}</span>
              </div>
            ) : (
              <p className="text-lg font-semibold text-foreground mb-3">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
            )}
            <Link
              to={`/product/${product.id}`}
              className="inline-block bg-[hsl(35,30%,25%)] text-[hsl(40,30%,90%)] px-10 py-3 text-xs uppercase tracking-[0.15em] font-medium hover:bg-[hsl(35,30%,20%)] transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductOfTheDay;
