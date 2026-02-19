import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const CartPage = () => {
  const navigate = useNavigate();
  const { items, loading, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
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

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigate} />

      <main className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <Link
              to="/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Cart</span>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
            Your Cart ({totalItems} items)
          </h1>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added anything to your cart yet
              </p>
              <Button onClick={() => navigate("/")}>Continue Shopping</Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {item.product_name}
                          </h3>
                          <p className="text-primary font-bold text-sm">
                            ₹{item.product_price}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() =>
                                updateQuantity(item.product_id, item.quantity - 1)
                              }
                              data-testid={`button-decrease-${item.product_id}`}
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="w-6 sm:w-8 text-center font-medium text-sm" data-testid={`text-quantity-${item.product_id}`}>
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() =>
                                updateQuantity(item.product_id, item.quantity + 1)
                              }
                              data-testid={`button-increase-${item.product_id}`}
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-destructive ml-auto"
                              onClick={() => removeFromCart(item.product_id)}
                              data-testid={`button-remove-${item.product_id}`}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Order Summary
                    </h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal ({totalItems} items)</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery</span>
                        <span>{totalPrice >= deliverySettings.threshold ? "Free" : `₹${deliverySettings.fee}`}</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 mb-6">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">
                          ₹{(totalPrice + (totalPrice >= deliverySettings.threshold ? 0 : deliverySettings.fee)).toFixed(2)}
                        </span>
                      </div>
                      {totalPrice < deliverySettings.threshold && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Add ₹{(deliverySettings.threshold - totalPrice).toFixed(2)} more for free delivery
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => navigate("/checkout")}
                      data-testid="button-proceed-checkout"
                    >
                      Proceed to Checkout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />
      <WhatsAppButton />
    </div>
  );
};

export default CartPage;
