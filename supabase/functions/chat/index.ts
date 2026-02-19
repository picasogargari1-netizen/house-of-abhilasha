import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://abhilasha-boutique-co.lovable.app";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  short_description?: string;
  in_stock: boolean;
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, category, short_description, in_stock")
      .eq("is_available", true);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Failed to fetch products:", e);
    return [];
  }
}

function formatProductsForContext(products: Product[]): string {
  if (!products.length) return "No products currently available.";
  
  return products.map(p => 
    `- **${p.name}** (₹${p.price}) - ${p.category}${p.short_description ? ` - ${p.short_description}` : ""} - [View Product](${BASE_URL}/product/${p.id})${!p.in_stock ? " (Out of Stock)" : ""}`
  ).join("\n");
}

function buildSystemPrompt(products: Product[]): string {
  const productList = formatProductsForContext(products);
  
  return `You are a helpful shopping assistant for House of Abhilasha, a boutique that specializes in ethnic Indian clothing and jewellery.

## Available Products
${productList}

## Product Categories
- Co-Ords (matching sets)
- Unisex Shirts
- Dresses
- Kurtis
- Sarees
- Jewellery

## Your Role
1. Help customers find products that match their needs - ALWAYS suggest specific products from the list above with their links
2. When recommending products, include the product name, price, and the markdown link to view it
3. Answer questions about the boutique's offerings
4. Provide styling suggestions based on available products
5. Help with sizing and care instructions
6. Guide customers on how to place orders (via WhatsApp at +91 85840 49992)

## Key Information
- Free delivery on orders above ₹999
- Expected delivery within 5-7 business days
- Easy exchange policy available
- All products are handcrafted with premium quality materials
- Orders are placed via WhatsApp

## Response Guidelines
- When users ask for suggestions or recommendations, ALWAYS include specific products from the available products list with their links
- Format product suggestions clearly with name, price, and clickable link
- Be friendly, helpful, and concise
- If a product is out of stock, mention it but still suggest alternatives`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const products = await fetchProducts();
    const systemPrompt = buildSystemPrompt(products);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
