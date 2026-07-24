# Corpers Kitchen

A real-time food ordering PWA for a fast-food spot near a corpers' lodge in Port Harcourt. Solves the "who ordered first" argument with a live queue that updates instantly for every visitor, backed by Firebase.

**Stack:** React + TypeScript + Vite + Tailwind CSS + Framer Motion + Firebase (Auth, Firestore, Storage) → deployed to GitHub Pages.

---

## Features

- **Live public queue** — every visitor sees the same real-time order queue, no login required.
- **Two payment options at checkout** — customers choose **Pay Online** (Paystack: card/bank/USSD, confirmed instantly) or **Bank Transfer** (manual: customer transfers to your account, submits proof, admin reviews and confirms).
- **One shared kitchen clock** — ready times are computed as a single continuous timeline across every active order, not independently per order: if order #2 arrives before order #1's pot is free, it queues behind it automatically.
- **Fixed-time batches** — weekend specials (Jollof Rice, Spaghetti) use an admin-set "this batch is ready at" time instead of the per-order clock, since they're cooked in a shared pot.
- **Admin dashboard** (`/admin`, Firebase Auth-protected) — a live **Ordering Open/Closed** switch, stats, searchable/filterable orders table with one-tap status changes, inventory add/edit/delete, a **Payments tab** to approve/reject manual bank transfers (matched against your own bank alert by sender name — no receipt upload needed), and analytics with CSV export + QR code.
- **Public Reviews page** (`/reviews`) — anyone can read and submit a star rating + written review, stored in Firestore.
- **Admin-controlled ordering** — instead of a fixed weekly schedule, you flip a real switch in the dashboard whenever you're ready to start taking orders. Starts OFF by default.
- **Admin-controlled Paystack toggle** — online payment starts OFF; turn it on once your Paystack account is fully verified. Until then, customers only see Bank Transfer.
- **PWA** — installable, offline app-shell caching, custom icons.

## Project structure

```
src/
  components/       shared UI (Navbar, Footer, Hero, LiveQueue, MenuSection, BankTransferPanel, PaymentSubmissionForm, …)
  components/admin/ dashboard-only UI (StatsCards, OrdersTable, InventoryPanel, PaymentsPanel, AnalyticsPanel, MenuItemModal)
  pages/            route-level pages (Home, Order, Track, Reviews, AdminLogin, AdminDashboard)
  hooks/            useAuth, useMenu, useQueue (computes the shared kitchen clock), useAdminOrders
  lib/              firebase.ts, auth.ts, orders.ts, menu.ts, paystack.ts, paymentSubmissions.ts, reviews.ts, notify.ts
  utils/            weekend.ts, orderNumber.ts, orderTiming.ts (the kitchen-clock logic), businessHours.ts, analytics.ts
  types/            shared TypeScript interfaces
  data/             seed menu + bankDetails.ts (edit this with your real account info)
firebase/
  firestore.rules   security rules — public read, admin-only writes, validated order/payment/review creation
  storage.rules     menu photos (admin-only write) + payment receipts (admin-only read)
.github/workflows/deploy.yml   builds and deploys to GitHub Pages on push to main
```

---

## 1. Firebase setup

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. Click the **`</>` (web) icon** to register a web app — this gives you the config values for `.env.local`.
3. **Authentication → Sign-in method → Email/Password** → enable. Then **Users → Add user** — create one admin account per staff member who needs `/admin` access.
4. **Firestore Database → Create database** (production mode).
5. **Storage → Get started** (optional — only needed if you ever add menu item photos; the manual bank-transfer payment flow does not use Storage at all).
6. In both Firestore and Storage **Rules** tabs, paste in `firebase/firestore.rules` and `firebase/storage.rules` respectively → **Publish**.
7. The live queue query needs one composite index (`status` + `createdAt`). The first time you load the site, a browser console error will contain a direct link to create it — click it.

## 2. Bank transfer details (manual payment path)

Edit `src/data/bankDetails.ts` with your real account name, bank, and account number. This is what customers see when they choose Bank Transfer at checkout.

## 3. Paystack setup (online payment path)

1. [Paystack dashboard](https://dashboard.paystack.com) → **Settings → API Keys & Webhooks** → copy your **Test Public Key** (`pk_test_...`) into `.env.local` as `VITE_PAYSTACK_PUBLIC_KEY`.
2. **Settings → Preferences → Bank Account** → add your settlement account (Opay, Kuda, any Nigerian bank).
3. When ready for real payments, switch Paystack out of Test Mode and swap in your **Live Public Key** (`pk_live_...`), both locally and as a GitHub secret.
4. If this env var is left blank, the Paystack button will show a friendly error — customers can still use Bank Transfer.

## 4. Local setup

```bash
npm install
cp .env.example .env.local
# fill in the 6 Firebase values + your Paystack public key
npm run dev
```

First time in `/admin`, go to **Inventory → Seed Default Menu**.

## 5. How payment verification works

- **Paystack orders**: paid before the order is even created — they land directly in the live queue automatically, no admin action needed.
- **Manual bank transfer orders**: created as "Awaiting Payment". The customer sees your bank details + their order number as the transfer reference, then clicks **"I Have Made Payment"** and submits just the **sender name** they paid from (no receipt upload). This shows up in **Admin → Payments** — check your own bank alert for a matching name and amount, then click **Confirm Payment** (moves it into the live queue) or **Reject** (lets the customer submit again).

## 6. Opening and closing ordering

There's no fixed weekly schedule enforced in code — instead, **Admin → Overview** has a live **Ordering Open / Closed** switch. Flip it on whenever you're ready to start taking orders for the day (or off when you're done); it takes effect instantly for every visitor. The footer's listed hours are just informational text for customers, not something the app enforces on its own.

## 7. Order numbers reset every day

Order numbers look like `CK-240724-001` (date + sequence) and automatically start back at 001 every new calendar day (Nigerian time) — no manual reset needed. The date baked into the number means it's still globally unique forever, so old order numbers never collide with today's. The live queue is also scoped to today only, so anything left unfinished from a previous day (e.g. a bank transfer that was never confirmed) simply stops showing up once a new day starts — it's still sitting in Firestore for your own records, just out of the active queue.

## 8. Monthly sales statistics

**Admin → Analytics** already has Daily / Weekly / Monthly report toggles plus a CSV export — nothing in Firestore ever auto-deletes, so all your order history stays available to review or export at any time, not just the current month.

**Security note:** neither path calls Paystack's or a bank's servers to cryptographically verify the payment — that would need a backend with a secret key (a Cloud Function), which this static-hosted app doesn't have. For a shop this size the risk is low: Paystack orders are verified by Paystack's own popup flow, and manual transfers are eyeballed by a human admin against the actual receipt before being approved. See the comment in `firebase/firestore.rules` if you want to harden this further later.

## 9. Deploying to GitHub Pages

**GitHub Actions (recommended):**
1. Push to a GitHub repo.
2. **Settings → Pages → Source** → **GitHub Actions**.
3. **Settings → Secrets and variables → Actions** → add the 6 Firebase secrets + `VITE_PAYSTACK_PUBLIC_KEY`, matching `.env.example`.
4. Push to `main` — it builds and deploys automatically to `https://<username>.github.io/corpers-kitchen/`.

**Manual:** `npm run deploy` (uses the `gh-pages` package).

If your repo isn't named `corpers-kitchen`, update the `base`/`start_url`/`scope` strings in `vite.config.ts` to match.

## 10. Notes on the phone-number privacy rule

Phone numbers are **not** stored on the main order document at all — they live in an admin-only subcollection (`orders/{orderId}/private/contact`), enforced by Firestore security rules, not just hidden by app UI. The public order doc (which powers the live queue and tracking page without login) has no phone field to leak in the first place, even to someone bypassing the UI entirely and querying Firestore directly.
