import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useProductsByCategory } from "@/hooks/useProducts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const formattedCategory = category
    ? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
    : "";

  const { data: products, isLoading, error } = useProductsByCategory(formattedCategory);

  // Filter states
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("all");
  // Get available sub-categories from products in this category
  const availableSubCategories = useMemo(() => {
    if (!products) return [];
    const subs = new Set<string>();
    products.forEach((p) => {
      if (p.source === "admin") {
        // Use the sub_category from the raw product data
        // We need to check the original data
      }
    });
    // Get unique sub-categories from products that have them
    const subCats: string[] = [];
    products.forEach((p: any) => {
      // The product might have sub_category info - we need to fetch from DB
    });
    return subCats;
  }, [products]);

  // Fetch sub-categories for this category from DB
  const { data: dbSubCategories } = useQuery({
    queryKey: ["category-subcategories", formattedCategory],
    queryFn: async () => {
      // First get the category id
      const { data: catData } = await supabase
        .from("product_categories")
        .select("id")
        .eq("name", formattedCategory)
        .maybeSingle();

      if (!catData) return [];

      const { data: subs } = await supabase
        .from("product_subcategories")
        .select("id, name")
        .eq("category_id", catData.id)
        .order("display_order", { ascending: true });

      return subs || [];
    },
    enabled: !!formattedCategory,
  });

  // Also get unique sub-categories that products actually have
  const productSubCategories = useMemo(() => {
    if (!products) return [];
    const subs = new Set<string>();
    products.forEach((p: any) => {
      // We need raw sub_category - let's check from network data
    });
    return Array.from(subs);
  }, [products]);

  // Fetch raw products with sub_category for filtering
  const { data: rawProducts } = useQuery({
    queryKey: ["raw-products-category", formattedCategory],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, sub_category")
        .eq("category", formattedCategory)
        .eq("is_available", true);
      return data || [];
    },
    enabled: !!formattedCategory,
  });

  const subCategoryMap = useMemo(() => {
    const map = new Map<string, string | null>();
    rawProducts?.forEach((p) => {
      map.set(p.id, p.sub_category);
    });
    return map;
  }, [rawProducts]);

  const uniqueSubCategories = useMemo(() => {
    if (!rawProducts) return [];
    const subs = new Set<string>();
    rawProducts.forEach((p) => {
      if (p.sub_category) subs.add(p.sub_category);
    });
    return Array.from(subs);
  }, [rawProducts]);

  const hasSubCategories = uniqueSubCategories.length > 0;

  // Apply filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      // Stock filter
      if (stockFilter === "in-stock" && !product.inStock) return false;
      if (stockFilter === "out-of-stock" && product.inStock) return false;

      // Price filter
      const effectivePrice = product.discountedPrice || product.price;
      if (effectivePrice > maxPrice) return false;

      // Sub-category filter
      if (subCategoryFilter !== "all") {
        const prodSubCat = subCategoryMap.get(String(product.id));
        if (prodSubCat !== subCategoryFilter) return false;
      }

      return true;
    });
  }, [products, stockFilter, maxPrice, subCategoryFilter, subCategoryMap]);

  const resetFilters = () => {
    setStockFilter("all");
    setMaxPrice(50000);
    setSubCategoryFilter("all");
  };

  const hasActiveFilters = stockFilter !== "all" || maxPrice < 50000 || subCategoryFilter !== "all";

  const handleNavigate = (section: string) => {
    if (section === "home") {
      navigate("/");
    } else if (section === "products") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
            <Link
              to="/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">{formattedCategory}</span>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
                {formattedCategory}
              </h1>
              <p className="text-muted-foreground">
                Explore our beautiful collection of {formattedCategory.toLowerCase()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Filters Section - Always Visible */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-8">
            <div className="flex flex-wrap items-end gap-4 md:gap-6">
              <div className="space-y-1.5 min-w-[140px]">
                <label className="text-sm font-medium text-card-foreground" data-testid="label-stock-filter">Stock</label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger data-testid="select-stock-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="option-stock-all">All</SelectItem>
                    <SelectItem value="in-stock" data-testid="option-stock-in">In Stock</SelectItem>
                    <SelectItem value="out-of-stock" data-testid="option-stock-out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-card-foreground" data-testid="label-price-filter">
                  Price: Up to ₹{maxPrice.toLocaleString("en-IN")}
                </label>
                <Slider
                  value={[maxPrice]}
                  onValueChange={(val) => setMaxPrice(val[0])}
                  min={0}
                  max={50000}
                  step={500}
                  data-testid="slider-price-filter"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹0</span>
                  <span>₹50,000</span>
                </div>
              </div>

              {hasSubCategories && (
                <div className="space-y-1.5 min-w-[160px]">
                  <label className="text-sm font-medium text-card-foreground" data-testid="label-subcategory-filter">Sub Category</label>
                  <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                    <SelectTrigger data-testid="select-subcategory-filter">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="option-subcategory-all">All</SelectItem>
                      {uniqueSubCategories.map((sub) => (
                        <SelectItem key={sub} value={sub} data-testid={`option-subcategory-${sub}`}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground" data-testid="button-clear-filters">
                  <X className="h-3 w-3" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">Failed to load products</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredProducts?.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                {products && products.length > 0
                  ? "No products match the selected filters"
                  : "No products found in this category"}
              </p>
              {hasActiveFilters ? (
                <Button onClick={resetFilters}>Clear Filters</Button>
              ) : (
                <Button onClick={() => navigate("/")}>Browse All Products</Button>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && filteredProducts && filteredProducts.length > 0 && (
            <>
              <p className="text-muted-foreground mb-6">
                {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
                {hasActiveFilters && products && filteredProducts.length !== products.length && (
                  <span> (filtered from {products.length})</span>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2">
                        {product.category}
                      </Badge>
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {product.description}
                      </p>
                      <p className="text-lg font-bold text-primary">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />
      <WhatsAppButton />
    </div>
  );
};

export default CategoryPage;
