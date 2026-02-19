import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingCart, Minus, Plus, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductImageGallery from "@/components/ProductImageGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { data: product, isLoading, error } = useProduct(id || "");
  const { data: allProducts } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [deliverySettings, setDeliverySettings] = useState({ threshold: 999, fee: 99 });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["delivery_fee_threshold", "delivery_fee_amount"]);
        if (data) {
          const settings: Record<string, number> = {};
          data.forEach((row: any) => { settings[row.key] = Number(row.value); });
          setDeliverySettings({
            threshold: settings.delivery_fee_threshold ?? 999,
            fee: settings.delivery_fee_amount ?? 99,
          });
        }
      } catch {}
    };
    fetchSettings();
  }, []);

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

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const displayPrice = product.discountedPrice ?? product.price;
    const message = `Hi! I'm interested in ordering: ${product.name} (₹${displayPrice}) - Quantity: ${quantity}`;
    window.open(
      `https://wa.me/918584049992?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Product link has been copied to clipboard",
      });
    }
  };

  const relatedProducts = allProducts
    ?.filter((p) => p.category === product?.category && p.id !== product?.id);

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigate} />

      <main className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 md:mb-8 text-xs uppercase tracking-[0.12em]">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            {product && (
              <>
                <Link
                  to={`/category/${product.category.toLowerCase().replace(/ /g, "-")}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {product.category}
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium line-clamp-1">
                  {product.name}
                </span>
              </>
            )}
          </nav>

          {/* Loading State */}
          {isLoading && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <div className="space-y-4 pt-4">
                <div className="h-4 w-20 bg-muted animate-pulse" />
                <div className="h-8 w-3/4 bg-muted animate-pulse" />
                <div className="h-20 w-full bg-muted animate-pulse" />
                <div className="h-6 w-32 bg-muted animate-pulse" />
                <div className="h-12 w-full bg-muted animate-pulse" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">Failed to load product</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          )}

          {/* Not Found State */}
          {!isLoading && !error && !product && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Product not found</p>
              <Button onClick={() => navigate("/")}>Browse Products</Button>
            </div>
          )}

          {/* Product Details */}
          {!isLoading && product && (
            <>
              <div className="grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-16">
                {/* Left: Image Gallery with Thumbnails */}
                <ProductImageGallery
                  images={product.images && product.images.length > 0 ? product.images : [product.image]}
                  productName={product.name}
                />

                {/* Right: Product Info - Sticky */}
                <div className="md:sticky md:top-32 md:self-start">
                  <div className="space-y-5">
                    {/* Brand */}
                    <Link
                      to="/"
                      className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
                    >
                      House of Abhilasha
                    </Link>

                    {/* Product Name */}
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight uppercase">
                      {product.name}
                    </h1>

                    {/* Price */}
                    <div>
                      {product.discountedPrice ? (
                        <>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Sale price</span>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-medium text-foreground">
                              Rs. {product.discountedPrice.toLocaleString("en-IN")}.00
                            </p>
                            <p className="text-base text-muted-foreground line-through">
                              Rs. {product.price.toLocaleString("en-IN")}.00
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Sale price</span>
                          <p className="text-xl font-medium text-foreground">
                            Rs. {product.price.toLocaleString("en-IN")}.00
                          </p>
                        </>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    <div>
                      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground font-medium block mb-2">
                        Quantity:
                      </span>
                      <div className="flex items-center border border-border w-fit">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-2.5 hover:bg-secondary/50 transition-colors text-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-5 py-2 text-sm font-medium text-foreground min-w-[40px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-2.5 hover:bg-secondary/50 transition-colors text-foreground"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart */}
                    <button
                      onClick={async () => {
                        const cartPrice = product.discountedPrice ?? product.price;
                        await addToCart({
                          id: String(product.id),
                          name: product.name,
                          image: product.image,
                          price: cartPrice,
                        }, quantity);
                      }}
                      className="w-full bg-foreground text-background py-3.5 text-xs uppercase tracking-[0.15em] font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                    >
                      Add to Cart
                    </button>

                    {/* Order on WhatsApp */}
                    <button
                      onClick={handleWhatsAppOrder}
                      className="w-full border border-border py-3.5 text-xs uppercase tracking-[0.15em] font-medium hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 text-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Order on WhatsApp
                    </button>

                    {/* Free Delivery Notice */}
                    <p className="text-xs text-muted-foreground text-center tracking-wide">
                      <span className="font-semibold text-foreground">Free Delivery</span> above Rs. {deliverySettings.threshold}/-
                    </p>

                    {/* Share */}
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors mx-auto"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs Section: Description, Order Details */}
              <div className="mt-12 md:mt-20">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
                    <TabsTrigger
                      value="description"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs uppercase tracking-[0.15em] font-medium px-6 py-3 text-muted-foreground data-[state=active]:text-foreground"
                    >
                      Description
                    </TabsTrigger>
                    <TabsTrigger
                      value="order-details"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs uppercase tracking-[0.15em] font-medium px-6 py-3 text-muted-foreground data-[state=active]:text-foreground"
                    >
                      Order Details
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="pt-6 md:pt-8">
                    <div className="max-w-2xl text-sm text-muted-foreground leading-relaxed space-y-3">
                      {product.description ? (
                        <p>{product.description}</p>
                      ) : (
                        <p>No description available for this product.</p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-4">
                        <strong className="text-foreground">Disclaimer:</strong> We have tried to retain the original colours of the fabric to the greatest extent possible. Slight variations may occur due to individual screen settings.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="order-details" className="pt-6 md:pt-8">
                    <div className="max-w-2xl text-sm text-muted-foreground leading-relaxed space-y-3 whitespace-pre-line">
                      {product.orderDetails ? (
                        <p>{product.orderDetails}</p>
                      ) : (
                        <>
                          <p><strong className="text-foreground">Delivery Timeline:</strong> 7-10 Working Days</p>
                          <p><strong className="text-foreground">Delivery:</strong> Free delivery on orders above ₹{deliverySettings.threshold}</p>
                          <p><strong className="text-foreground">Return / Exchange:</strong> Easy return and exchange within 7 days of delivery</p>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* You May Also Like */}
              {relatedProducts && relatedProducts.length > 0 && (
                <section className="mt-12 md:mt-20">
                  <h2 className="text-center text-lg md:text-xl font-serif font-bold text-foreground mb-8 md:mb-10 uppercase tracking-wide">
                    You May Also Like
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                    {relatedProducts.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="group"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-muted">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="mt-3 text-center space-y-1">
                          <h3 className="text-xs font-medium text-foreground uppercase tracking-wide line-clamp-1">
                            {p.name}
                          </h3>
                          <div className="text-xs text-muted-foreground">
                            <span className="block text-[10px] uppercase tracking-wider">Sale price</span>
                            {p.discountedPrice ? (
                              <span className="flex items-center justify-center gap-1">
                                <span className="text-foreground font-medium">Rs. {p.discountedPrice.toLocaleString("en-IN")}.00</span>
                                <span className="line-through">Rs. {p.price.toLocaleString("en-IN")}.00</span>
                              </span>
                            ) : (
                              <span>Rs. {p.price.toLocaleString("en-IN")}.00</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetailPage;
