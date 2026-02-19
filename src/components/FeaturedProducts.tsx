import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Eye } from "lucide-react";

const FeaturedProducts = () => {
  const { data: products, isLoading } = useProducts();
  const { addToCart } = useCart();
  const newArrivals = products?.filter((p) => p.featured === true).slice(0, 4);

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
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
            New Arrivals
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

  if (!newArrivals?.length) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 md:mb-10">
          New Arrivals
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {newArrivals.map((product) => (
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

export default FeaturedProducts;
