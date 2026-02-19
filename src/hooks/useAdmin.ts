import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsAdmin = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!user,
  });
};

export const useAllOrders = () => {
  return useQuery({
    queryKey: ["adminOrders"],
    queryFn: async () => {
      // First fetch orders with order items
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .order("created_at", { ascending: false });
      
      if (ordersError) throw ordersError;
      if (!orders) return [];

      // Get unique user IDs from orders
      const userIds = [...new Set(orders.map(order => order.user_id))];
      
      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, contact_no")
        .in("user_id", userIds);
      
      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Merge profile data into orders
      return orders.map(order => ({
        ...order,
        profile: profileMap.get(order.user_id) || null
      }));
    },
  });
};

export const useAllProfiles = () => {
  return useQuery({
    queryKey: ["adminProfiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProfiles"] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
    },
  });
};

export const useProductAvailability = () => {
  return useQuery({
    queryKey: ["productAvailability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpdateProductAvailability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ externalId, name, isAvailable }: { externalId: string; name: string; isAvailable: boolean }) => {
      // Upsert product availability
      const { data, error } = await supabase
        .from("products")
        .upsert({
          external_id: externalId,
          name: name,
          is_available: isAvailable,
        }, {
          onConflict: "external_id"
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
    },
  });
};

export interface AdminProduct {
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  discounted_price?: number | null;
  category: string;
  sub_category?: string | null;
  image_url1?: string;
  image_url2?: string;
  image_url3?: string;
  in_stock: boolean;
  featured: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  is_product_of_day?: boolean;
}

export const useAdminProducts = () => {
  return useQuery({
    queryKey: ["adminProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: AdminProduct) => {
      const insertData: Record<string, any> = {
        name: product.name,
        description: product.description || "",
        short_description: product.short_description || "",
        price: product.price,
        discounted_price: product.discounted_price ?? null,
        category: product.category,
        image_url1: product.image_url1 || null,
        image_url2: product.image_url2 || null,
        image_url3: product.image_url3 || null,
        in_stock: product.in_stock,
        featured: product.featured,
        is_available: true,
        source: "admin",
      };
      if (product.sub_category) {
        insertData.sub_category = product.sub_category;
      }
      const { data, error } = await supabase
        .from("products")
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminProduct> }) => {
      const cleanUpdates: Record<string, any> = { ...updates };
      if (!cleanUpdates.sub_category) {
        delete cleanUpdates.sub_category;
      }
      const { data, error } = await supabase
        .from("products")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productAvailability"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

