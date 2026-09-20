# NEXT STEPS — What To Do Next

> Ready-to-use handoff doc. Covers what is implemented in this commit, and the exact
> remaining work to finish the **Digital Products** rollout plus outstanding fixes.
> Last updated: 2026-09-20

---

## 1. Current State (committed in this batch)

### 1.1 Implemented Features
- **Phone OTP auth** — `src/routes/auth.tsx` (OTP sign-in flow, `signInWithOtp`, removed invalid `emailRedirectTo`).
- **Product videos** — `src/components/product/ProductImageGallery.tsx` (video gallery support + per-image `video_url`), `src/routes/products.$slug.tsx`.
- **Social share / FAQ / delivery notification** — `src/components/product/SocialShare.tsx`, `ProductFAQ.tsx`, `DeliveryNotification.tsx`.
- **Returns & refunds** —
  - Customer request form: `src/routes/returns-request.tsx`
  - Public returns info/status page: `src/routes/returns.tsx` (refactored)
  - My Returns page (account): `src/routes/_authenticated/my-returns.tsx` (route `/_authenticated/my-returns`; renamed from `returns.tsx` to avoid `/returns` conflict)
  - Admin Returns & Chat tabs: `src/routes/_authenticated/admin.tsx`
- **Live chat** — `src/components/chat/ChatWidget.tsx` (wired into `src/routes/__root.tsx`).
- **Real-time order tracking** — `src/routes/track.tsx` (Supabase Realtime subscription on `orders`, live-update spinner, last-updated timestamp).
- **Digital products landing page (basic)** — `src/routes/digital.tsx` (marketplace grid fetching `products` where `product_type = 'digital'`; search input; inline product cards).
- **Header fix** — duplicate import cleanup, `MessageCircle` icon import (`Header.tsx`).
- **Database schema** — `supabase/migrations/20260919000001_phone_auth_videos_returns_notifications.sql`:
  `videos_json`, `product_images.video_url`, `return_requests`, `chat_messages`, `delivery_notifications`, `refund_transactions`, realtime publication, RLS policies, `products.product_type`, `products.digital_metadata`, profiles `referral_code`/`referred_by`, `referrals` table.

### 1.2 Known Issues / Blockers (fix BEFORE continuing)
1. **`src/integrations/supabase/types.ts` is OUTDATED.**
   It was reset to git HEAD and does NOT contain: `products.product_type`, `products.digital_metadata`,
   `chat_messages`, `return_requests`, `delivery_notifications`, `refund_transactions`, `referrals`, `videos_json`.
   → **Effect:** ~82 TypeScript errors (ChatWidget, admin returns/chat, track notifications, digital filter, etc.).
   → **Fix:** regenerate with `npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/integrations/supabase/types.ts`
   (or use the Supabase CLI local DB), then re-run `npx tsc --noEmit`.
2. **`src/routes/digital.tsx` — 3 TypeScript errors**
   - `createFileRoute("/digital")` — not assignable to `keyof FileRoutesByPath` (router types need regenerate; run `npm run dev` once to regen `src/routeTree.gen.ts`).
   - `.eq("product_type", "digital")` — column missing from `types.ts` (blocker #1).
   - `<input onInput={setQuery}>`/`Input` prop mismatch — use the shadcn `Input` with `onChange={(e) => setQuery(e.target.value)}`.
3. **Migration may fail on re-run** — `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;` (line 109) fails if `orders` is already published. If applying, comment that line out or wrap in a DO block.
4. **Dev artifacts in repo folder** (do NOT commit): `dev-server.txt`, `dev-server-error.txt`, `ts-errors.txt`, `add-*.cjs` helper scripts. Consider deleting them after use.

---

## 2. Next Priority — Finish the Digital Products Rollout

Reference: the 21-point Digital Products requirement (marketplace → detail → library → admin → purchase flow → integrations).

### Phase A — Data + Types (blocker)
- [ ] Regenerate `types.ts` from Supabase (see 1.2.1) so `product_type` / `digital_metadata` and all new tables type-check.
- [ ] Verify migration is applied to the live DB: `supabase db push` or run the SQL in the Dashboard → SQL Editor (see 1.2.3 note).
- [ ] Add a `digital-metadata` helper in `src/lib/` (or extend `src/lib/format.ts`) to parse `digital_metadata` (file type, access type, version, file size, download limit).

### Phase B — Marketplace polish (`src/routes/digital.tsx`)
- [ ] Extract reusable **`DigitalProductCard`** component (`src/components/product/DigitalProductCard.tsx`) following the existing `ProductCard` patterns.
  - `DIGITAL` + `INSTANT ACCESS` badges (reuse `.badge` styles from `products.$slug.tsx`).
  - Price + MRP + discount (use `formatINR`), category chip, file-type icon.
  - Link to `/digital/$slug`.
- [ ] Hero: "Digital Tools That Make Life Easier".
- [ ] Search + filter bar: category dropdown (11 categories), sort (featured / newest / best-selling / price), price range, rating filter.
- [ ] Sections on page: New Arrivals, Best Sellers, Featured products.

### Phase C — Detail page (`src/routes/digital/$slug.tsx`)
- [ ] Create route `src/routes/digital/$slug.tsx` (file-based; ensure `createFileRoute("/digital/$slug")`).
- [ ] Premium SaaS-style page: hero with cover, title, rating, "What's included" checklist, format badge (Excel / Sheets / Notion / PDF / ZIP / Prompt Pack / Software / Web Tool), preview images, specs (version, file size, updates), FAQ accordion, reviews.
- [ ] **Instant-access purchase flow:** Add to Cart (digital) → checkout → after payment success redirect to the product page with a "Download" CTA (requires Phase G digital orders integration).

### Phase D — My Digital Library (`src/routes/_authenticated/digital-products.tsx`)
- [ ] New account page listing purchased digital products (query `order_items` → `products` where `product_type = 'digital'` and order `status in ('paid','delivered','completed')`).
- [ ] Secure **server-side download** (Edge Function or RPC) that verifies ownership server-side and returns a short-lived signed URL — never trust the client with the raw file URL.
- [ ] Download logging (`digital_downloads` table: product_id, user_id, order_item_id, timestamp, IP).

### Phase E — Admin digital management (`src/routes/_authenticated/admin.tsx`)
- [ ] New tab "Digital Products": list digital products, create/edit/archive, upload file (to Supabase Storage), set `digital_metadata`, toggle active.
- [ ] Download history view (from `digital_downloads`).

### Phase F — Storefront integrations
- [ ] Header: add "Digital" nav item (route `/digital`).
- [ ] Homepage: add a Digital section (link to `/digital`, featured digital products).
- [ ] Search: unified search with filter tabs **All | Physical | Digital** (extend existing search in Header / search page).
- [ ] Cart: allow mixing physical + digital items with one cart.
- [ ] Checkout (`src/routes/_authenticated/checkout.tsx`): **skip address/shipping step when cart is digital-only**; show "Instant delivery" notice.
- [ ] Orders: separate **Physical** vs **Digital** sections on the order page / order confirmation.

### Phase G — Payments & orders for digital
- [ ] Razorpay flow already exists — ensure `create_order_with_stock_check`/order creation treats digital items as instantly fulfilled (`status='paid'`, no shipment needed).
- [ ] On payment success: create library entry, optionally email download link.

### Phase H — Analytics
- [ ] Admin dashboard + analytics: digital product sales counts, revenue split physical vs digital, top digital products.

### Phase I — Seed data
- [ ] Seed **6 digital products** (via SQL or admin UI): LifeOS Pro, StudentOS, Vibe Coder OS, SaaS Builder OS, Trading Journal Pro, AI Automation Business Kit — each with `product_type='digital'`, demo images, `digital_metadata`.

### Phase J — Security (required before production)
- [ ] IDOR testing: user A must not access user B's digital library/downloads.
- [ ] RLS review on new tables (`return_requests`, `chat_messages`, `delivery_notifications`, `refund_transactions`, `referrals`) — confirm admin policies only via `user_roles` check.
- [ ] Auth bypass: download endpoint must require valid session + ownership.
- [ ] Direct file URLs: files in Supabase Storage must be private; only signed URLs served.
- [ ] Refunds: digital products — define policy (e.g. no refunds after download; enforce in refund flow).

### Phase K — SEO & production readiness
- [ ] Per-product meta tags on `/digital/$slug` (title, description, OG).
- [ ] Sitemap additions for `/digital`.
- [ ] `robots.txt` allow `/digital`.
- [ ] Final checklist: run `npx tsc --noEmit` (0 errors), `npm run build`, test all purchase/return/chat/digital flows, validate on mobile.

---

## 3. Other Outstanding Work (from earlier audits)
- [ ] **Dark mode**: `ThemeToggle` exists but styling not wired across pages.
- [ ] **Admin pages**: add `noindex` meta to admin routes.
- [ ] **Referral program**: schema exists (`referrals` table, `referral_code`) — no UI yet (account referral section, share link, reward on signup).
- [ ] **Returns admin actions**: process/approve/reject with refund transaction creation — partially in `admin.tsx`; finish end-to-end with `refund_transactions`.
- [ ] Clean up dev artifacts (list in 1.2.4).

---

## 4. Recommended Execution Order
1. Fix **blocker 1 & 2** (types.ts + digital.tsx) → get `npx tsc --noEmit` to 0.
2. Apply migration to live DB (fix the realtime `orders` line first).
3. Phases A → C (data, marketplace, detail page) — one deployable milestone.
4. Phase G (digital orders/payments) + Phase D (library/downloads) — the money milestone.
5. Phases E, F, H (admin, integrations, analytics).
6. Phase I (seed data), Phase J (security pass), Phase K (SEO/production).

---

## 5. Useful Commands
```bash
npm run dev          # start dev server (Vite on http://localhost:8080 --host to expose)
npm run build        # production build
npx tsc --noEmit     # type check
npm run lint         # eslint
supabase db push     # apply migrations
```