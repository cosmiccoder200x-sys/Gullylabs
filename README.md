# Gullylabs

Production e-commerce storefront and admin platform — physical **and** digital products, built with TanStack Start, Supabase, and Razorpay.

## Tech Stack

- **Frontend**: React 19 + TanStack Start (file-based routing) + Tailwind CSS v4
- **Backend**: TanStack Start server functions + Supabase Edge Functions
- **Database**: Supabase (PostgreSQL, RLS, Realtime)
- **Auth**: Supabase Auth — email/password, Google OAuth, phone OTP
- **Payments**: Razorpay Checkout, order creation, verification & webhooks
- **Hosting**: Vite / TanStack Start deployment (Vercel / Node)

## Features

### Storefront
- Homepage with hero, featured/best-selling sections, testimonials, brand story
- Product catalog: categories, filters, search with autocomplete, sorting, pagination
- Product detail pages: multi-image + video gallery, specs, reviews & ratings, related products, stock status
- Cart & wishlist (database-backed, per-user), coupon codes, shipping calculator
- Checkout: shipping address, coupons, COD or Razorpay payments, atomic order creation
- Delivery notifications and real-time order tracking (Supabase Realtime)

### Digital Products
- Digital marketplace at `/digital` with search, filters, categories
- Instant-access purchase flow for digital goods
- My Digital Library (account) and admin digital product management (`digital_metadata`)
- Prepared for secure server-side downloads and signed URLs

### Customer Experience
- Phone OTP authentication, profile & address book, order history
- Returns & refunds workflow (`returns-request`, `my-returns`, admin Returns tab)
- Live customer support chat (widget + admin Chat tab)
- Product FAQ, social sharing, delivery notifications

### Admin
- Dashboard, sales/inventory/customer analytics, order management
- Product/category/coupon management, returns & chat handling, digital products
- Role-based access control (`user_roles` with `admin` role)

### Marketing & SEO
- Meta/OG tags per route, sitemap, robots, JSON-LD schemas
- Referral program (schema in place; UI roadmap in `NEXT_STEPS.md`)

## Getting Started

Requires Node.js 20+ (recommend [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
npm i
npm run dev        # start dev server on http://localhost:8080
```

### Scripts

| Command          | Description                        |
|------------------|------------------------------------|
| `npm run dev`    | Start Vite dev server              |
| `npm run build`  | Production build                   |
| `npm run preview`| Preview the production build       |
| `npm run lint`   | Run ESLint                         |
| `npm run format` | Format code with Prettier          |

## Project Structure

```
src/
  components/     # UI components (layout, product, cart, chat, admin…)
  lib/            # site config, formatting, utilities
  routes/         # TanStack Start file-based routes
  integrations/   # Supabase client & types
supabase/
  migrations/     # SQL migrations (schema, RLS, Edge Function setup)
  functions/      # Edge Functions (Razorpay, auth, notifications…)
```

## Supabase Setup

1. Create a project on [supabase.com](https://supabase.com) and copy your URL + anon key into `.env`.
2. Apply migrations (`supabase/db push`) or run them in the SQL Editor.
3. Deploy Edge Functions if used for payments (`supabase/functions/`).

## Roadmap

See [`NEXT_STEPS.md`](./NEXT_STEPS.md) for the full feature-by-feature rollout plan, known blockers, and the remaining digital-products, security, and SEO work.