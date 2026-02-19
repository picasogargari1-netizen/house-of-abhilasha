-- Row Level Security Policies for House of Abhilasha
-- Run this in your Supabase SQL editor to enable RLS

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- CART_ITEMS: Users can only access their own cart
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own cart" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own cart" ON cart_items FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access cart" ON cart_items FOR ALL USING (auth.role() = 'service_role');

-- ORDERS: Users can view and create their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access orders" ON orders FOR ALL USING (auth.role() = 'service_role');

-- ORDER_ITEMS: Users can view items for their own orders
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert own order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Service role full access order_items" ON order_items FOR ALL USING (auth.role() = 'service_role');

-- PRODUCTS: Public read, admin write
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Service role full access products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- BANNERS: Public read, admin write
CREATE POLICY "Anyone can view banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Service role full access banners" ON banners FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage banners" ON banners FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- ANNOUNCEMENTS: Public read, admin write
CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Service role full access announcements" ON announcements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- BLOGS: Public read, admin write
CREATE POLICY "Anyone can view blogs" ON blogs FOR SELECT USING (true);
CREATE POLICY "Service role full access blogs" ON blogs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage blogs" ON blogs FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- NEWSLETTER_SUBSCRIBERS: Anyone can insert, admin can view
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access newsletter" ON newsletter_subscribers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can view subscribers" ON newsletter_subscribers FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);
CREATE POLICY "Admins can manage subscribers" ON newsletter_subscribers FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- CATEGORY_IMAGES: Public read, admin write
CREATE POLICY "Anyone can view category images" ON category_images FOR SELECT USING (true);
CREATE POLICY "Service role full access category_images" ON category_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage category images" ON category_images FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- PRODUCT_CATEGORIES: Public read, admin write
CREATE POLICY "Anyone can view categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Service role full access categories" ON product_categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage categories" ON product_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- PRODUCT_SUBCATEGORIES: Public read, admin write
CREATE POLICY "Anyone can view subcategories" ON product_subcategories FOR SELECT USING (true);
CREATE POLICY "Service role full access subcategories" ON product_subcategories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage subcategories" ON product_subcategories FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- USER_ROLES: Users can check their own role
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access user_roles" ON user_roles FOR ALL USING (auth.role() = 'service_role');

-- SITE_SETTINGS: Public read, admin write
CREATE POLICY "Anyone can view settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Service role full access settings" ON site_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage settings" ON site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);
