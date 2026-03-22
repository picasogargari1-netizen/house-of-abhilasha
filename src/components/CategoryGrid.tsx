import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { proxyImageUrl } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";

const CategoryGrid = () => {
  const { data: categories, isLoading } = useCategories();

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
        <h2 className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium mb-8 md:mb-10 heading-3d">
          Shop by Categories
        </h2>

        <div className="flex justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-16 flex-wrap">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={cat.slug === "jewellery" ? "/jewellery" : `/category/${cat.slug}`}
              className="group flex flex-col items-center gap-2.5"
              data-testid={`link-category-${cat.slug}`}
            >
              {/* 3D orb wrapper */}
              <div
                className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 md:w-24 md:h-24"
                style={{
                  perspective: "400px",
                  animationDelay: `${idx * 0.15}s`,
                }}
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden border border-border group-hover:border-primary category-orb-inner"
                  style={{
                    boxShadow:
                      "0 4px 14px rgba(0,0,0,0.10), inset 0 -2px 6px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.5)",
                    transition: "transform 0.35s ease, box-shadow 0.35s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (window.matchMedia("(hover: none)").matches) return;
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "perspective(400px) rotateY(-12deg) rotateX(6deg) scale(1.08)";
                    el.style.boxShadow =
                      "6px 10px 28px rgba(0,0,0,0.18), inset 0 -2px 6px rgba(0,0,0,0.06), inset 0 2px 6px rgba(255,255,255,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "perspective(400px) rotateY(0deg) rotateX(0deg) scale(1)";
                    el.style.boxShadow =
                      "0 4px 14px rgba(0,0,0,0.10), inset 0 -2px 6px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.5)";
                  }}
                >
                  {cat.image_url ? (
                    <img
                      src={proxyImageUrl(cat.image_url)}
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
