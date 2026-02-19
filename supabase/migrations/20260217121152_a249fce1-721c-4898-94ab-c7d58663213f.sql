
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_arrival boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_product_of_day boolean NOT NULL DEFAULT false;
