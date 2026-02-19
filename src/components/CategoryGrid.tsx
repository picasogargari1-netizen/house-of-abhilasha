import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const CategoryGrid = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["shopByCategories"],
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
      <section className="py-10 md:py-14 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium mb-8 md:mb-10">
            Shop by Categories
          </h2>
          <div className="flex justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-16 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories?.length) return null;

  return (
    <section className="py-10 md:py-14 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium mb-8 md:mb-10">
          Shop by Categories
        </h2>

        <div className="flex justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-16 flex-wrap">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.slug === "jewellery" ? "/jewellery" : `/category/${cat.slug}`}
              className="group flex flex-col items-center gap-2.5"
              data-testid={`link-category-${cat.slug}`}
            >
              <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-border group-hover:border-primary transition-all duration-300 group-hover:shadow-md">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    {cat.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-foreground font-medium group-hover:text-primary transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
