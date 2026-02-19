import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CreditCard, Copy, Check, Package } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

import upiQrCode from "@/assets/upi-qr-code.jpeg";

const UPI_ID = "sneha1999.sen@oksbi";



const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null);
  const [deliverySettings, setDeliverySettings] = useState({ threshold: 999, fee: 99 });

  const isGuest = !user;

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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, address, contact_no")
      .eq("user_id", user.id)
      .single();

    if (data) {
      if (data.first_name) setFirstName(data.first_name);
      if (data.last_name) setLastName(data.last_name);
      if (data.email) setEmail(data.email);
      if (data.address) setAddress(data.address);
      if (data.contact_no) setContactNo(data.contact_no);
    }
  };

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

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
  };

  const handlePlaceOrder = async () => {
    const requiredFields = [
      { value: firstName.trim(), label: "First Name" },
      { value: lastName.trim(), label: "Last Name" },
      { value: isGuest ? email.trim() : (user?.email || email.trim()), label: "Email Address" },
      { value: contactNo.trim(), label: "Phone Number" },
      { value: address.trim(), label: "Delivery Address" },
    ];

    const missing = requiredFields.find((f) => !f.value);
    if (missing) {
      toast({
        title: "Missing Information",
        description: `Please enter your ${missing.label}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const shippingCost = totalPrice >= deliverySettings.threshold ? 0 : deliverySettings.fee;
      const finalTotal = totalPrice + shippingCost;

      if (isGuest) {
        await handleGuestCheckout(finalTotal);
      } else {
        await handleAuthenticatedCheckout(finalTotal);
      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = async (finalTotal: number) => {
    const customerEmail = email.trim().toLowerCase();

    const { data: result, error: fnError } = await supabase.functions.invoke("guest-checkout", {
      body: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: customerEmail,
        address: address.trim(),
        contactNo: contactNo.trim(),
        notes: notes.trim() || null,
        paymentMethod,
        totalAmount: finalTotal,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          product_price: item.product_price,
          quantity: item.quantity,
        })),
      },
    });

    if (fnError) {
      throw new Error(fnError.message || "Failed to place order");
    }
    if (result?.error) {
      throw new Error(result.error);
    }

    setOrderId(result.orderId);
    setOrderPlaced(true);

    if (result.isNewAccount && result.tempPassword) {
      setTempCredentials({ email: customerEmail, password: result.tempPassword });
    }

    await clearCart();

    toast({
      title: "Order Placed!",
      description: `Your order #${result.orderId.slice(0, 8)} has been placed successfully`,
    });
  };

  const handleAuthenticatedCheckout = async (finalTotal: number) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", user!.id)
      .single();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user!.id,
        status: "pending",
        payment_method: paymentMethod,
        total_amount: finalTotal,
        shipping_address: address.trim(),
        contact_no: contactNo.trim(),
        notes: notes.trim() || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      product_price: item.product_price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    await supabase
      .from("profiles")
      .update({
        address: address.trim(),
        contact_no: contactNo.trim(),
      })
      .eq("user_id", user!.id);

    try {
      const customerName = profile 
        ? `${profile.first_name} ${profile.last_name}`.trim() 
        : "Customer";
      const customerEmail = profile?.email || user!.email || "";

      await supabase.functions.invoke("send-order-emails", {
        body: {
          orderId: order.id,
          customerEmail: customerEmail,
          customerName: customerName,
          shippingAddress: address.trim(),
          contactNo: contactNo.trim(),
          totalAmount: finalTotal,
          paymentMethod: paymentMethod === "upi" ? "UPI" : "Place Order (Contact)",
          items: items.map((item) => ({
            product_name: item.product_name,
            quantity: item.quantity,
            product_price: item.product_price,
            product_image: item.product_image,
          })),
        },
      });
    } catch (emailError) {
      console.error("Failed to send order emails:", emailError);
    }

    setOrderId(order.id);
    setOrderPlaced(true);

    await clearCart();

    toast({
      title: "Order Placed!",
      description: `Your order #${order.id.slice(0, 8)} has been placed successfully`,
    });
  };

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate("/cart");
    }
  }, [items.length, orderPlaced, navigate]);

  if (items.length === 0 && !orderPlaced) {
    return null;
  }

  const shippingCost = totalPrice >= deliverySettings.threshold ? 0 : deliverySettings.fee;
  const finalTotal = totalPrice + shippingCost;

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
            <Link
              to="/cart"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Cart
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Checkout</span>
          </div>

          {orderPlaced ? (
            <div className="max-w-xl mx-auto text-center py-8 sm:py-12 px-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Check className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-4">
                Order Placed Successfully!
              </h1>
              <p className="text-muted-foreground mb-2">
                Your order #{orderId?.slice(0, 8)} has been placed.
              </p>
              {paymentMethod === "upi" && (
                <div className="bg-muted p-4 sm:p-6 rounded-lg my-6">
                  <p className="font-medium mb-4">
                    Please complete payment using UPI:
                  </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                      <code className="bg-background px-3 sm:px-4 py-2 rounded font-mono text-sm sm:text-base break-all">
                        {UPI_ID}
                      </code>
                      <Button variant="outline" size="icon" onClick={copyUpiId}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once the payment is done, please share the payment screenshot on WhatsApp at{" "}
                      <a href="https://wa.me/918584049992" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                        +91 8584049992
                      </a>
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Amount: ₹{finalTotal.toFixed(2)}
                    </p>
                  </div>
              )}
              {paymentMethod === "cod" && (
                <p className="text-muted-foreground mb-6">
                  We will contact you shortly to confirm your order. Please keep your phone available.
                </p>
              )}

              {tempCredentials && (
                <div className="bg-muted p-4 sm:p-6 rounded-lg my-6 text-left">
                  <h3 className="font-semibold text-foreground mb-3">Your Account Has Been Created</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You can now sign in to track your orders using:
                  </p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Username:</span>
                      <code className="bg-background px-2 py-1 rounded text-sm break-all">{tempCredentials.email}</code>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Temporary Password:</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">{tempCredentials.password}</code>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    For security reasons, we recommend changing your password after logging in. These credentials have also been sent to your email.
                  </p>
                </div>
              )}

              <Button onClick={() => navigate("/")} data-testid="button-continue-shopping">Continue Shopping</Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => navigate("/cart")}
                className="gap-2 mb-8"
                data-testid="button-back-to-cart"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Cart
              </Button>

              <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
                Checkout
              </h1>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact & Shipping Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            data-testid="input-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            data-testid="input-last-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={isGuest ? email : (user?.email || email)}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!isGuest}
                          data-testid="input-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactNo">Phone Number *</Label>
                        <Input
                          id="contactNo"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={contactNo}
                          onChange={(e) => setContactNo(e.target.value)}
                          data-testid="input-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Textarea
                          id="address"
                          placeholder="Enter your complete delivery address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={3}
                          data-testid="input-address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Order Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special instructions for your order"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          data-testid="input-notes"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(val) => setPaymentMethod(val as "upi" | "cod")}
                      >
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <RadioGroupItem value="upi" id="upi" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                              <CreditCard className="h-4 w-4" />
                              Pay via UPI
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pay using any UPI app (Google Pay, PhonePe, Paytm, etc.)
                            </p>
                            {paymentMethod === "upi" && (
                              <div className="mt-4 p-4 bg-muted rounded-lg">
                                <div className="flex flex-col items-center mb-4">
                                  <img 
                                    src={upiQrCode} 
                                    alt="UPI QR Code" 
                                    className="w-48 h-48 rounded-lg"
                                  />
                                </div>
                                <p className="text-sm font-medium mb-2 text-center">Or pay using UPI ID:</p>
                                <div className="flex items-center justify-center gap-2">
                                  <code className="bg-background px-3 py-1 rounded font-mono text-sm">
                                    {UPI_ID}
                                  </code>
                                  <Button variant="outline" size="sm" onClick={copyUpiId}>
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mt-3 text-center">
                                  Once the payment is done, please share the payment screenshot on WhatsApp at{" "}
                                  <a href="https://wa.me/918584049992" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                                    +91 8584049992
                                  </a>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <RadioGroupItem value="cod" id="cod" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                              <Package className="h-4 w-4" />
                              Place Order
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              We will contact you to confirm your order
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 mb-6">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-16 h-16 flex-shrink-0">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted rounded" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {item.product_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              ₹{(item.product_price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping</span>
                          <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full mt-6"
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        data-testid="button-place-order"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Place Order
                      </Button>
                    </CardContent>
                  </Card>
                </div>
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

export default CheckoutPage;
