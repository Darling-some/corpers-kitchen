# Corpers Kitchen

A food-ordering business and corpers community platform. The original Corpers Kitchen visual identity is retained: deep ink/purple surfaces (`#0F0A1F` / `#160F2E`), gold accents (`#D4AF37`), warm bone text, Fraunces display type and glass-card styling.

## Included

### Food ordering (existing product retained)
- Daily menu and specials, inventory availability and kitchen administration.
- Guest checkout, minimum order validation, bank-transfer submissions and Paystack public-key checkout.
- Live kitchen queue, order tracking, order history, payments review and sales analytics.
- Reviews, Waiting Room customer chat, PWA install support and privacy page.

### Corpers social community
- Email/password member registration and sign-in, username reservation, member profiles, optional private profiles and avatar uploads.
- Community feed, image posts, likes, comments and reporting, with server-side daily posting/comment limits.
- Anonymous confessions. Confessions are submitted through a callable backend function, have a per-account daily limit of three, and do not expose the submitter's UID in the public confession document.
- Three public real-time chatrooms (Corpers Lounge, Food & Kitchen, Tech & Career) with server-side rate limiting, member discovery, friend requests and private one-to-one conversations.
- Kitchen quiz with server-issued questions, server-validated answers and one XP reward claim per account per UTC day.
- XP, levels, achievement badges, leaderboard, virtual gifts, notifications and community moderation.
- Admin moderation tools for posts, confessions and user reports.

### Backend and security
- Firebase Authentication, Firestore, Firebase Storage and Cloud Functions.
- Firestore and Storage rules, composite indexes, Cloud Functions source and Firebase emulator configuration are included.
- Staff access is based on an explicit `admins/{uid}` record with `role: "admin"`. A merely authenticated member is not automatically an administrator.
- Order creation, Paystack verification, XP awards, quiz scoring, anonymous confession submission and gift balance changes are performed by Cloud Functions, not trusted to browser code.
- Profile owners cannot edit their own XP, level or badges. Private profile documents are restricted to their owner and staff.

## Requirements

- Node.js **24.12 or newer** for the current Firebase web SDK version in this project.
- A Firebase project with Authentication, Firestore, Storage and Cloud Functions enabled.
- A Firebase billing plan that supports Cloud Functions and Storage (typically Blaze). Review Firebase pricing and budgets before enabling paid services.
- Firebase CLI: `npm install -g firebase-tools`.

## Local setup

1. In Firebase Console, open Authentication → Sign-in method and enable **Email/Password**.
2. Create/enable Firestore and Firebase Storage.
3. Copy `.env.example` to `.env.local` and enter the Firebase web-app values. Enter only a Paystack **public** key in `VITE_PAYSTACK_PUBLIC_KEY`; never put a Paystack secret key in a `VITE_` variable.
4. Install and run the web app:

   ```bash
   npm ci
   npm run dev
   ```

   For local backend testing, set `VITE_USE_FIREBASE_EMULATORS=true` in `.env.local` and run `firebase emulators:start --only auth,firestore,functions,storage` in another terminal. Use only test data in the emulators.

5. Select your existing Firebase project:

   ```bash
   firebase login
   firebase use --add
   ```

6. Store the Paystack secret key in Firebase Secret Manager (the secret key must never be added to `.env.local`, GitHub Pages secrets or any `VITE_` variable):

   ```bash
   firebase functions:secrets:set PAYSTACK_SECRET_KEY
   ```

   For emulator-only testing, put a test value in `functions/.secret.local` instead; this file is ignored by Git.

   Use the appropriate test or live secret key. The server verifies Paystack transaction status, NGN currency and exact amount before accepting an online-paid order. A successful payment reference can only be consumed once.

7. Install and build Cloud Functions:

   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   ```

8. Back up/export your production Firestore data and create the administrator records described below. Then deploy Cloud Functions first:

   ```bash
   firebase deploy --only functions
   ```

9. Deploy the frontend to GitHub Pages and confirm that the new site loads and the callable order flow works.
10. Finally, deploy the stricter Firestore/Storage rules and indexes:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

   The rules deployment changes access control immediately. Deploy only after confirming the updated frontend and after reviewing the rules. During the short interval before rules are updated, social data access and the admin document check may be denied; refresh the site after the rules deployment. Do not deploy rules to production without a data backup.

## First administrator setup

1. Create or identify the staff account in Firebase Authentication → Users.
2. Copy that account's UID.
3. In Firestore, create a document at `admins/{UID}` with fields:
   - `role` (string): `admin`
   - `createdAt` (timestamp): current time
4. Sign in through `/admin/login`. The admin route checks this document. Do not create admin records for ordinary members.

The client and security rules intentionally do not allow users to create or promote their own administrator record. Provision administrators from Firebase Console or a trusted Admin SDK environment. Create this document before switching to the updated frontend so staff do not lose access to the dashboard.

## Firestore collections used

- Existing food app: `menuItems`, `orders`, `paymentSubmissions`, `reviews`, `chatMessages`, `chatMutes`, `settings`, `counters`, `idempotency`, `admins`.
- Social app: `profiles`, `usernames`, `posts` (+ `comments` subcollections), `confessions`, `confessionMeta`, `friendRequests`, `friendships`, `conversations` (+ `messages`), `communityRoomMessages`, `roomChatRateLimits`, `directMessageRateLimits`, `postRateLimits`, `commentRateLimits`, `reports`, `giftLedger`, `giftRequests`, `gameAttempts`, `quizChallenges`, `quizStarts`, `confessionRateLimits`, `xpEvents`, `commentCountEvents`, `paystackReferences`.
- Notifications: `profiles/{uid}/notifications`.

Cloud Functions maintain XP, level, badge and gift balances. Do not write to the protected XP or backend-only collections directly from a client.

## GitHub Pages deployment

The existing GitHub Pages deployment-branch workflow is retained. The Vite `base` path remains `/corpers-kitchen/`, and the `gh-pages` package publishes the built `dist` folder to the `gh-pages` branch.

1. Confirm `.env.local` contains your existing Firebase web-app values and the Paystack **public** key.
2. From the project root, run:

   ```bash
   npm run deploy
   ```

3. GitHub Pages should remain configured to deploy from the `gh-pages` branch and the repository root folder.

This command builds and publishes only the frontend. Firebase rules, indexes and Cloud Functions must be deployed separately with the Firebase CLI after review.

## Important production notes

- The Firebase configuration in `.env.local` is not included in this ZIP. Use your existing project's values; do not create a new Firebase project unless you intend to migrate data.
- Before deploying the stricter rules, review existing staff UIDs and create their `admins/{uid}` records. Otherwise, the old admin login will no longer grant access to staff tools.
- Existing customer orders and menu data remain in the same collection names. Export/backup Firestore before deploying new rules or indexes.
- The Paystack popup and bank-transfer experience are retained. Paystack success is verified server-side using `PAYSTACK_SECRET_KEY`; manual bank transfers still require staff to confirm the bank alert and approve the payment. Never expose the Paystack secret key in frontend environment variables.
- The Waiting Room remains separate from the social chat. It retains the original customer-order eligibility and moderation flow.
- Run a Firebase Emulator Suite test pass before production rollout. The app build alone does not verify live Firebase permissions, payment provider configuration, or deployed Functions.

## Useful commands

```bash
npm run build
npm run lint
cd functions && npm run build
```
