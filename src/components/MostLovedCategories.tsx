import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { proxyImageUrl } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";

const MostLovedCategories = () => {
  const { data: categories, isLoading } = useCategories();

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
                    src={proxyImageUrl(cat.image_url)}
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
