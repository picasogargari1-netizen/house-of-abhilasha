import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const descriptions: Record<string, string> = {
  "co-ords": "Matching sets for effortless style",
  "unisex-shirts": "Hand-embroidered comfort for all",
  "dresses": "Elegant pieces for every occasion",
  "kurtis": "Traditional craftsmanship, modern design",
  "sarees": "Timeless cotton sarees with artisanal touch",
  "jewellery": "Handcrafted accessories",
};

const AllProductsPage = () => {
  const navigate = useNavigate();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["allProductsCategories"],
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
        category_name: cat.name,
        category_slug: cat.slug,
        image_url: imageMap.get(cat.slug) || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleNavigate = (section: string) => {
    if (section === "home") {
      navigate("/");
    } else if (section === "products") {
      navigate("/all-products");
    } else if (section === "jewellery") {
      navigate("/jewellery");
    } else if (section === "about") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (section === "contact") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigate} />

      <main className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">All Products</span>
          </div>

          {/* Page Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
              Shop by Collection
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our curated collections of handcrafted pieces, each telling a unique story of artisanal excellence
            </p>
          </div>

          {/* Category Tiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                ))
              : categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={cat.category_slug === "jewellery" ? "/jewellery" : `/category/${cat.category_slug}`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('${cat.image_url}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent group-hover:from-foreground/90 transition-colors" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-background mb-2">
                        {cat.category_name}
                      </h3>
                      <p className="text-background/80 text-sm md:text-base mb-4">
                        {descriptions[cat.category_slug] || "Explore our collection"}
                      </p>
                      <span className="inline-flex items-center text-background text-sm font-medium uppercase tracking-wide group-hover:underline">
                        Explore Collection →
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />
      <WhatsAppButton />
    </div>
  );
};

export default AllProductsPage;
