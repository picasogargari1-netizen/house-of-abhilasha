# House of Abhilasha - E-Commerce Platform

## Overview
House of Abhilasha is an e-commerce platform for ethnic Indian clothing and jewellery. Frontend-only React SPA with Supabase as the backend (database, auth, storage, Edge Functions). Deployed via Vercel (static SPA) + Supabase Edge Functions.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: react-router-dom v6 (BrowserRouter with Routes)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context (AuthContext, CartContext) + TanStack React Query
- **Build Tool**: Vite with SWC plugin

### Backend (Supabase)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (product images, banners, blog images)
- **Edge Functions**: Supabase Deno Edge Functions for server-side logic
- **Email**: Zoho Mail SMTP via Supabase Edge Functions

### Edge Functions
- `guest-checkout` - Guest checkout with auto account creation, order processing, email notifications
- `signup` - Admin-level user registration with auto-confirmation
- `send-order-emails` - Order confirmation emails (customer + admin)
- `send-password-reset-email` - Password reset with temporary password
- `send-contact-email` - Contact form submissions
- `chat` - AI chatbot (Lovable AI Gateway)
- `send-visit-request` - Store visit request emails
- `zoho-exchange-grant` - Zoho OAuth token exchange

## Project Structure
```
├── src/                    # Frontend source code
│   ├── App.tsx             # Main app component with routes
│   ├── main.tsx            # Entry point
│   ├── index.css           # Global styles and CSS variables
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── admin/          # Admin dashboard components
│   ├── contexts/           # React contexts (Auth, Cart)
│   ├── hooks/              # Custom hooks (useProducts, useAdmin, etc.)
│   ├── integrations/       # Supabase client setup & types
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   └── assets/             # Static assets (images)
├── supabase/               # Supabase configuration
│   ├── config.toml         # Project config
│   ├── migrations/         # SQL migrations & RLS policies
│   └── functions/          # Edge Functions (Deno)
│       ├── guest-checkout/ # Guest checkout + account creation
│       ├── signup/         # Admin user registration
│       ├── send-order-emails/
│       ├── send-password-reset-email/
│       ├── send-contact-email/
│       ├── chat/           # AI chatbot
│       ├── send-visit-request/
│       └── zoho-exchange-grant/
├── vercel.json             # Vercel deployment config
├── vite.config.ts          # Vite configuration
└── tailwind.config.ts      # Tailwind CSS configuration
```

## Database Tables (Supabase PostgreSQL with RLS)
- `profiles` - User profile information
- `cart_items` - Shopping cart (per user)
- `orders` - Customer orders
- `order_items` - Items within orders
- `user_roles` - Admin/user role assignments
- `products` - Product catalog with pricing, images, categories
- `banners` - Homepage banner images
- `category_images` - Category display images
- `announcements` - Site-wide announcement messages
- `blogs` - Blog posts
- `newsletter_subscribers` - Email newsletter signups
- `product_categories` - Product category hierarchy
- `product_subcategories` - Subcategories within categories
- `site_settings` - Key-value site configuration (delivery fees etc.)

## Key Pages
- `/` - Homepage with hero, categories, featured products
- `/all-products` - All products listing
- `/category/:category` - Category-filtered products
- `/jewellery` - Jewellery collection
- `/product/:id` - Product detail page
- `/auth` - Login/Signup
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/profile` - User profile
- `/blogs` - Blog listing
- `/blog/:id` - Blog detail
- `/admin` - Admin dashboard
- `/admin-login` - Admin login

## Environment Variables
### Frontend (Vite - public)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

### Supabase Edge Function Secrets
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ZOHO_CLIENT_ID` - Zoho Mail OAuth client ID
- `ZOHO_CLIENT_SECRET` - Zoho Mail OAuth client secret
- `ZOHO_REFRESH_TOKEN` - Zoho Mail OAuth refresh token

## Development
- Run `npm run dev` to start the Vite dev server on port 5000
- Run `npm run build` to build static SPA for production (output: `dist/`)

## Deployment
- **Frontend**: Vercel (static SPA) - `vercel.json` configured with SPA rewrites
- **Backend**: Supabase Edge Functions deployed via Supabase CLI (`supabase functions deploy`)
- **RLS Policies**: Apply `supabase/migrations/rls_policies.sql` in Supabase SQL editor

## Recent Changes
- **2026-02-19**: Mobile responsiveness improvements
  - Hero banner uses portrait aspect ratio (4:5) on mobile for better display
  - Mobile hamburger menu shows only Shop categories, About Us, Contact, and Blogs (removed duplicate Collection/Jewellery)
  - Smaller brand name and header height on small screens
  - Better mobile sizing for announcement bar, promo banner buttons, product detail tabs, brand story, contact section, and footer
  - Announcement bar text truncated on mobile to prevent overflow
- **2026-02-19**: Migrated from Express.js + Drizzle to Supabase-only architecture
  - Removed Express server, Drizzle ORM, and all backend dependencies
  - Created `guest-checkout` Edge Function (user creation, order processing, Zoho emails)
  - Created `signup` Edge Function for admin-level user registration
  - Replaced all `/api/*` routes with Supabase client queries and Edge Function invocations
  - Added `site_settings` to Supabase TypeScript types
  - Created comprehensive RLS policies for all tables
  - Updated Vite config for static SPA build with Vercel deployment
  - Added `vercel.json` for Vercel hosting with SPA routing
- **2026-02-18**: Guest checkout flow implementation
  - Cart works without sign-in (localStorage for guests, Supabase for logged-in users)
  - Guest cart items migrate to Supabase when user signs in
  - Auto-creates Supabase account with temporary password on guest purchase
- **2026-02-17**: Initial Replit setup from Lovable migration
