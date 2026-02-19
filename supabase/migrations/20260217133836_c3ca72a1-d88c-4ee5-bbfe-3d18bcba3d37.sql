
-- Create storage bucket for category images
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true);

-- Storage policies for category images
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-images' AND has_role(auth.uid(), 'admin'));

-- Create category_images table
CREATE TABLE public.category_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  category_slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category images" ON public.category_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage category images" ON public.category_images FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed with existing categories
INSERT INTO public.category_images (category_name, category_slug) VALUES
  ('Co-Ords', 'co-ords'),
  ('Unisex Shirts', 'unisex-shirts'),
  ('Dresses', 'dresses'),
  ('Kurtis', 'kurtis'),
  ('Sarees', 'sarees'),
  ('Jewellery', 'jewellery');

-- Trigger for updated_at
CREATE TRIGGER update_category_images_updated_at
BEFORE UPDATE ON public.category_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
