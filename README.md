# Corpers Kitchen

Real-time food ordering PWA — live kitchen queue, daily specials, bank-transfer + Paystack payments, admin dashboard, moderated "Waiting Room" chat.
**Stack:** React + TypeScript + Vite + Tailwind + Framer Motion + Firebase (Auth, Firestore) → GitHub Pages.

## What's in it
- **Live queue** for everyone; one shared kitchen clock (11 min/order, anchored to payment *confirmation*, self-correcting when you mark an order Ready).
- **Minimum order ₦1,000** — enforced on the order form and in the Firestore rules.
- **Daily specials** — set an item's category to *Special* and pick any single day; specials always show first.
- **Two payment paths** — bank transfer (Zenith + Opay, each switchable on/off; you confirm by sender name in *Payments*) and Paystack (switch starts OFF).
- **Admin dashboard** — Overview switches (Ordering / Paystack / Chat), Kitchen Board (orders grouped by item, with special instructions), Orders (with **Time** column + look-up any past day), Inventory (photo links, specials), Payments, Chat moderation, Analytics (sales by item, CSV).
- **Waiting Room chat** — see below. **Starts OFF.**
- Order recovery (if the phone reloads while paying in a banking app), free browser "ready" notifications, Reviews page, Privacy page, PWA.

## Setup
1. Firebase console → create project → web app (gives the 6 values) → enable **Authentication → Email/Password** (add your admin user) → create **Firestore**.
2. Paste `firebase/firestore.rules` into Firestore → Rules → **Publish** (do this after every update). Storage is optional.
3. `cp .env.example .env.local`, fill it in, then `npm install && npm run dev`.
4. First time: `/admin` → Inventory → **Seed Default Menu**, then Overview → **Open Ordering**.
5. Firestore needs one composite index (`orders`: `status` + `createdAt`). The browser console shows a link the first time — click it.
6. Edit your bank details in `src/data/bankDetails.ts`.

## Deploy (GitHub Pages)
Push to `main`. Repo → Settings → Pages → Source: **GitHub Actions**. Add the 7 secrets from `.env.example` under Settings → Secrets → Actions. Every push redeploys to the same URL. If your repo isn't named `corpers-kitchen`, change `base`, `start_url`, `scope` in `vite.config.ts`.

## Waiting Room chat — how it's limited
- Admin → Overview → **Chat switch** (OFF by default). When off, nobody can post.
- Only customers with an order **today** can open `/chat`. First name only; no phone numbers or links (blocked in the app); 200 characters; 5-second cooldown.
- Admin → **Chat** tab: delete messages, mute a customer, post as the kitchen, pin an announcement.
- **Honest limits:** posting is enforced by the Firestore rules (chat on, real matching order, not muted, length). *Reading* is not — the database can't verify "customer with an order" without accounts, so a technical person could read messages (first names only). The cooldown and word/phone/link filters run in the app, not in the rules. Order numbers are visible in the public queue, so someone could post using another person's order number. You are responsible for moderating — keep the switch off when you can't watch it.

## Privacy model
Phone numbers are stored in `orders/{id}/private/contact` (admin-only read), not on the public order document.
