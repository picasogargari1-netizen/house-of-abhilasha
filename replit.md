# House of Abhilasha

An e-commerce boutique web app for House of Abhilasha, specialising in ethnic Indian clothing and jewellery.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + ShadcnUI
- **Backend/Auth/DB**: Supabase (hosted at oxvkxbygniwgcahmmeea.supabase.co)
- **Image hosting**: ImageKit
- **Email**: Zoho Mail API
- **AI chat**: Supabase Edge Function calling Lovable AI gateway

## Running the app

```
npm run dev
```

Runs on port 5000.

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

## Supabase Edge Functions

Located in `supabase/functions/`. These are deployed to the Supabase project and called directly from the frontend:

- `chat` — AI shopping assistant
- `signup` — User registration with profile creation
- `send-order-emails` — Order confirmation emails via Zoho
- `send-password-reset-email` — Password reset via Zoho
- `guest-checkout` — Guest order placement
- `imagekit-auth` — ImageKit upload auth for admins
- `zoho-exchange-grant` — Zoho OAuth token exchange for admins
- `send-contact-email` — Contact form emails
- `send-visit-request` — Visit booking emails

## Database Schema

Full schema is in `supabase/setup-new-project.sql`. Tables:
- `profiles`, `cart_items`, `orders`, `order_items`
- `products`, `product_categories`, `product_subcategories`
- `banners`, `announcements`, `category_images`
- `blogs`, `newsletter_subscribers`, `site_settings`, `user_roles`

## User Preferences

- Keep the existing Supabase project as the backend (auth + database + edge functions)
- Admin email: support@houseofabhilasha.in
