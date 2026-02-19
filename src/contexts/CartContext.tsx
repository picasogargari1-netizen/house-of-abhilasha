import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (product: { id: string; name: string; image: string; price: number }, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const GUEST_CART_KEY = "hoa_guest_cart";

function getGuestCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCartStorage() {
  localStorage.removeItem(GUEST_CART_KEY);
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      migrateGuestCartAndFetch();
    } else {
      const guestItems = getGuestCart();
      setItems(guestItems);
      setLoading(false);
    }
  }, [user]);

  const migrateGuestCartAndFetch = async () => {
    if (!user) return;

    setLoading(true);

    const guestItems = getGuestCart();

    if (guestItems.length > 0) {
      for (const gItem of guestItems) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", gItem.product_id)
          .single();

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + gItem.quantity })
            .eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: gItem.product_id,
            product_name: gItem.product_name,
            product_image: gItem.product_image,
            product_price: gItem.product_price,
            quantity: gItem.quantity,
          });
        }
      }
      clearGuestCartStorage();
    }

    await fetchCartItems();
  };

  const fetchCartItems = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching cart:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addToCart = async (product: { id: string; name: string; image: string; price: number }, qty: number = 1) => {
    if (user) {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", String(product.id))
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + qty })
          .eq("id", existing.id);

        if (error) {
          console.error("Error updating cart:", error);
          toast({ title: "Error", description: "Failed to update cart", variant: "destructive" });
        } else {
          toast({ title: "Added to cart", description: `${product.name} has been added to your cart` });
          await fetchCartItems();
        }
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: String(product.id),
          product_name: product.name,
          product_image: product.image,
          product_price: product.price,
          quantity: qty,
        });

        if (error) {
          if (error.code === "23505") {
            const { data: row } = await supabase
              .from("cart_items")
              .select("id, quantity")
              .eq("user_id", user.id)
              .eq("product_id", String(product.id))
              .maybeSingle();
            if (row) {
              await supabase.from("cart_items").update({ quantity: row.quantity + qty }).eq("id", row.id);
            }
            toast({ title: "Added to cart", description: `${product.name} has been added to your cart` });
            await fetchCartItems();
          } else {
            console.error("Error adding to cart:", error);
            toast({ title: "Error", description: "Failed to add item to cart", variant: "destructive" });
          }
        } else {
          toast({ title: "Added to cart", description: `${product.name} has been added to your cart` });
          await fetchCartItems();
        }
      }
    } else {
      const currentItems = [...items];
      const existingIndex = currentItems.findIndex((item) => item.product_id === String(product.id));

      if (existingIndex >= 0) {
        currentItems[existingIndex].quantity += qty;
      } else {
        currentItems.push({
          id: `guest_${Date.now()}_${product.id}`,
          product_id: String(product.id),
          product_name: product.name,
          product_image: product.image,
          product_price: product.price,
          quantity: qty,
        });
      }

      setItems(currentItems);
      saveGuestCart(currentItems);
      toast({ title: "Added to cart", description: `${product.name} has been added to your cart` });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        console.error("Error removing from cart:", error);
      } else {
        setItems(items.filter((item) => item.product_id !== productId));
        toast({
          title: "Removed from cart",
          description: "Item has been removed from your cart",
        });
      }
    } else {
      const updated = items.filter((item) => item.product_id !== productId);
      setItems(updated);
      saveGuestCart(updated);
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        console.error("Error updating quantity:", error);
      } else {
        setItems(
          items.map((item) =>
            item.product_id === productId ? { ...item, quantity } : item
          )
        );
      }
    } else {
      const updated = items.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      );
      setItems(updated);
      saveGuestCart(updated);
    }
  };

  const clearCart = async () => {
    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error clearing cart:", error);
      } else {
        setItems([]);
      }
    } else {
      setItems([]);
      clearGuestCartStorage();
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product_price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
