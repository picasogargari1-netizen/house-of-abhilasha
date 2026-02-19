-- Add all product fields to the products table for admin-created products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS image_url1 TEXT,
ADD COLUMN IF NOT EXISTS image_url2 TEXT,
ADD COLUMN IF NOT EXISTS image_url3 TEXT,
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin';

-- Allow external_id to be null for admin-created products (they won't have Google Sheet IDs)
ALTER TABLE public.products ALTER COLUMN external_id DROP NOT NULL;

-- Make name column have a default
ALTER TABLE public.products ALTER COLUMN name SET DEFAULT '';

-- Add policy for anonymous users to view products (for non-logged in browsing)
CREATE POLICY "Anyone can view products public"
ON public.products FOR SELECT
USING (true);