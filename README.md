# Corpers Kitchen

A real-time food ordering PWA for a fast-food spot near a corpers' lodge in Port Harcourt. Solves the "who ordered first" argument with a live queue that updates instantly for every visitor, backed by Firebase.

**Stack:** React + TypeScript + Vite + Tailwind CSS + Framer Motion + Firebase (Auth, Firestore) → deployed to GitHub Pages.

---

## Features

- **Live public queue** — every visitor sees the same real-time order queue, no login required.
- **Two payment options at checkout** — Paystack (instant, admin-toggleable) or manual bank transfer with multiple bank accounts to choose from.
- **Honest kitchen-clock timing** — one continuous timeline across every active order, anchored to the moment payment is actually *confirmed* (not just placed), and self-correcting the moment an order is marked ready.
- **Kitchen Board** — active orders grouped by menu item, so several same-item orders can be spotted and batch-cooked together while still respecting arrival order.
- **Order recovery** — if a customer's browser tab gets reloaded while they're off in their banking app, their last order number is recovered automatically from local storage instead of being lost.
- **Free browser notifications** — customers can opt in to be notified the instant their order is marked ready, no cost, no extra backend.
- **Admin-controlled ordering & Paystack toggles** — both start OFF by default; flip them on whenever you're ready.
- **Public Reviews page**, **Privacy Policy page**, PWA installable on Android/iPhone.

## Project structure

```
src/
  components/       shared UI (Navbar, Footer, Hero, LiveQueue, BankTransferPanel, PaymentSubmissionForm, …)
  components/admin/ dashboard UI (StatsCards, OrdersTable, InventoryPanel, PaymentsPanel, KitchenBoard, toggles, …)
  pages/            Home, Order, Track, Reviews, Privacy, AdminLogin, AdminDashboard
  hooks/            useAuth, useMenu, useQueue, useAdminOrders, useOrderingStatus, usePaystackEnabled
  lib/              firebase, auth, orders, menu, paystack, paymentSubmissions, reviews, settings,
                    notify (admin chime), orderNotifications (customer browser notifications),
                    orderRecovery (localStorage order-number recovery)
  utils/            orderNumber, orderTiming (the kitchen-clock logic), businessHours, analytics, weekend
  data/             seed menu, bankDetails.ts (edit with your real accounts), ussdCodes.ts
firebase/
  firestore.rules, storage.rules
```

---

## 1. Firebase setup

1. [Firebase console](https://console.firebase.google.com) → Add project → register a web app (gives you `.env.local` values).
2. **Authentication → Email/Password** → enable. **Users → Add user** for each admin.
3. **Firestore Database → Create database** (production mode).
4. Publish `firebase/firestore.rules` and `firebase/storage.rules` in their respective Rules tabs.
5. Storage is optional — only needed if you ever add menu item photos.
6. The live queue query needs one composite index (`status` + `createdAt`) — the first load's browser console error contains a direct link to create it.

## 2. Bank transfer accounts (manual payment path)

Edit `src/data/bankDetails.ts` — `BANK_ACCOUNTS` is an array, so you can list multiple accounts (Opay, Zenith, etc.). Customers pick whichever bank they want at checkout — handy if one bank's network is down.

## 3. Paystack setup (optional online payment path)

1. [Paystack dashboard](https://dashboard.paystack.com) → Settings → API Keys & Webhooks → copy your Test Public Key into `.env.local` as `VITE_PAYSTACK_PUBLIC_KEY`.
2. In **Admin → Overview**, the Paystack toggle starts OFF — turn it on once your account is verified.

## 4. Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

First time in `/admin`: **Inventory → Seed Default Menu**, then flip the **Ordering** toggle ON in Overview.

## 5. How payment verification works

- **Paystack**: paid before the order is created — joins the live queue automatically.
- **Manual bank transfer**: order created "Awaiting Payment". Customer sees your bank details (pick from multiple accounts), submits just their **sender name** (no receipt upload), and can optionally quick-dial their bank's USSD code. This appears in **Admin → Payments** — check your bank alert for a matching name/amount, then Confirm or Reject.

## 6. Kitchen timing — how the clock actually works

Timing is anchored to **confirmation time**, not order-placed time — critical for manual transfers, since there's often a real gap between when a customer orders and when you get to confirm their transfer. The countdown never starts before you've actually accepted the order. It also self-corrects: if you mark an order ready faster (or slower) than the 11-minute default, everyone still waiting sees their estimate adjust to match reality.

**Kitchen Board** (its own admin tab) groups all not-yet-cooked orders by menu item, so five Noodles orders show up together for batch cooking, while still showing arrival order within each group.

## 7. Order recovery

If a customer's phone reloads the tab while they're in their banking app making a transfer, `/track` automatically recovers their last order number from local storage rather than showing a blank page. Their order number is also always visible with a one-tap copy button, so they can save it themselves too.

## 8. Notifications (free)

Customers can tap "Notify me when it's ready" on the tracking page. This uses the browser's built-in Notification API — free, no extra setup — and fires the instant an order is marked ready, as long as the site is open (foreground or background tab). True notifications after fully closing the app would require Firebase Cloud Messaging (a bigger, paid-tier setup) — not included here.

## 9. Opening and closing ordering

**Admin → Overview** has a live Ordering Open/Closed switch — no fixed schedule in code. Starts OFF by default.

## 10. Order numbers reset every day

Format: `CK-240724-001` (date + daily sequence), resets to 001 each new day, globally unique forever. The live queue is scoped to today only.

## 11. Monthly sales statistics

**Admin → Analytics** has Daily/Weekly/Monthly reports + CSV export. Nothing in Firestore auto-deletes.

## 12. Deploying to GitHub Pages

Push to a GitHub repo → **Settings → Pages → Source → GitHub Actions** → add the 6 Firebase secrets + `VITE_PAYSTACK_PUBLIC_KEY` under **Settings → Secrets and variables → Actions** → push to `main`.

## 13. Phone number privacy

Phone numbers live in an admin-only subcollection (`orders/{orderId}/private/contact`), enforced by Firestore rules — not just hidden by app UI.
