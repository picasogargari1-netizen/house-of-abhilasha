import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const MostLovedCategories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["mostLovedCategories"],
    queryFn: async () => {
      const [catRes, imgRes] = await Promise.all([
        supabase.from("product_categories").select("*").order("display_order", { ascending: true }),
        supabase.from("category_images").select("*"),
      ]);

      if (catRes.error) throw catRes.error;
      const cats = catRes.data || [];
      const images = imgRes.data || [];

      const imageMap = new Map(images.map((img: any) => [img.category_slug, img.image_url]));

      return cats.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image_url: imageMap.get(cat.slug) || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
            Most Loved Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories?.length) return null;

  return (
    <section className="py-12 md:py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
          Most Loved Categories
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.slug === "jewellery" ? "/jewellery" : `/category/${cat.slug}`}
              className="group"
              data-testid={`link-loved-category-${cat.slug}`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-muted">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                    {cat.name}
                  </div>
                )}
              </div>
              <p className="text-center mt-3 text-xs uppercase tracking-[0.15em] font-medium text-foreground group-hover:text-primary transition-colors">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MostLovedCategories;
