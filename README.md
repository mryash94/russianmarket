# RUSSIAN MARKET — Haute Digital Collectibles & Artifacts

RUSSIAN MARKET is an ultra-premium, mobile-first e-commerce platform and cryptographic digital vault. It provides collectors with an exclusive destination for acquiring original digital collectible artwork cards across three standardized categories (`VISA`, `MASTERCARD`, `RUPAY`) with sovereign provenance, liquid-glass aesthetic design, real-time database reactivity, integer-paise INR currency formatting, and secure asymmetric digital delivery.

---

## 💎 Features & Architecture

### 1. Ultra-Premium Design System & Brand Identity
- **Color Palette**: Deep midnight obsidian (`#030712`), deep navy, electric cyan (`#00F0FF`), and ice-blue reflections.
- **Glass Effects**: Multi-layer crystal and liquid-glass panels (`backdrop-filter: blur(24px) saturate(190%)`), translucent specular borders, and subtle glow flares.
- **Universal Collectible Cards**: Standardized collectible cards with realistic metallic chip illustration, contactless waves, angle-dependent holographic foil shimmer, and smooth 3D front/back flip animation (`rotateY(180deg)`).
- **Luxury Reverse Side**: Authentic collectible medallion, subtle guilloché pattern, metallic rim highlights, and clean edition metadata.
- **Typography & Icons**: Professional Inter font stack and crisp Lucide SVG icons.

### 2. Three Standardized Categories
1. **VISA**: Royal blue, midnight navy, and electric cyan.
2. **MASTERCARD**: Deep black, burgundy, and vibrant red/orange.
3. **RUPAY**: Emerald green and dark jade.

*Note: All products are fictional digital collectible artworks. They are NOT functional credit cards, bank cards, or financial credentials.*

### 3. Mobile-First Customer Storefront (Android Chrome & iOS Optimized)
- Precision layouts optimized for **320px, 360px, 375px, 390px, 412px, 430px**, tablet, and desktop viewports.
- **Floating Liquid-Glass Navbar**: Pill-shaped navigation (`CARDS`, `VIDEO`, `CHAT`, `WALLET`, `SETTINGS`) with WebGL fluid simulation, active drop physics, and mobile safe-area padding.
- **Single Purchase Action (`BUY NOW →`)**: Clean, direct purchase flow without shopping cart friction. Creates one canonical order per purchase.
- **Product Details**: Compact luxury dialog showing interactive 3D card, edition number, INR price, availability, and instant checkout.
- **Concierge Chat**: 24/7 authenticated concierge interface with non-overlapping message composer, status checkmarks, attachment simulation, and clear history controls.
- **Store Wallet**: INR balance ledger, transaction records, and 3D sovereign pass preview.

### 4. Robust Order Lifecycle & Idempotency
- **INR Currency Consistency**: Integer-paise calculations and Indian numbering formatting (`₹` / `en-IN`) everywhere.
- **Lifecycle States**:
  - `pending`: Registered order awaiting settlement.
  - `payment_verified`: Confirmed payment; unlocks digital vault assets.
  - `processing`: Encrypted token packaging.
  - `completed`: Vault delivered.
  - `cancelled`, `refunded`, `failed`, `expired`.
- **Integrity**: Server-calculated price totals, immutable item snapshots, unique order numbers (`RM-2026-XXXXXX`), and UUID idempotency keys to prevent duplicate submissions.

### 5. Administrative Control Room (`/admin`)
- Accessible via the top-bar Admin button.
- **Overview Metrics**: Total orders, pending orders, paid/verified orders, processing orders, completed orders, cancelled orders, and verified INR revenue.
- **Product Management**: Add, edit, and delete products with confirmation dialogs; manage VISA, MASTERCARD, RUPAY categories; configure edition quantities and INR prices.
- **Order Management**: Search by order number, customer name, email, or token; filter by payment status; verify payments and cancel orders.
- **QR Scanner & Redemption**: Scan or look up order verification tokens to validate presentations and seal digital collectible redemptions with duplicate redemption prevention.
- **Collector Accounts**: Inspect registered customers, order counts, and lifetime acquisition volume.
- **Store Governance**: Configure policies, currency standard (`INR`), and SunPay gateway endpoints.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8.3
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), Custom Liquid Glass CSS tokens
- **Animations & Icons**: Framer Motion, Lucide Icons
- **Database & Auth**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth, Realtime
- **Resilient Offline / Demo Engine**: Built-in reactive store engine (`storeEngine.ts`) ensures the application is 100% operational, persistent, and testable both with and without Supabase credentials.

---

## 🚀 Quick Start & Installation

### Requirements
- Node.js (v20+ or v22+)
- npm

### 1. Install Dependencies
```powershell
npm.cmd install
```

### 2. Run Local Development Server
```powershell
npm.cmd run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Build for Production
```powershell
npm.cmd run build
```

### 4. Preview Production Build Locally
```powershell
npm.cmd run preview
```

### 5. Code Quality & Linting
```powershell
npm.cmd run lint
```

---

## 🗄️ Supabase PostgreSQL Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```
3. Add your project URL and public Anon Key:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
   ```
4. Run the database migration script located at:
   [`supabase/migrations/20261113090000_russian_market_schema.sql`](./supabase/migrations/20261113090000_russian_market_schema.sql)
   in your Supabase SQL Editor.
5. All tables, functions (`is_admin()`), and Row Level Security policies will be configured automatically.

---

## 🔐 Security & Compliance

- **No Usable Payment Card Data**: RUSSIAN MARKET creates exclusively fictional collectible art cards. No bank account numbers, CVVs, or magnetic stripes are generated, requested, or accepted.
- **Row Level Security**: Every table enforces Postgres RLS policies. Unauthenticated or unpaid users cannot read administrative logs, other customers' orders, or digital vault files.
- **No Leaked Secrets**: Only the public anonymous Supabase key is used client-side; service-role keys, private webhook secrets, and payment signing credentials are strictly prohibited from frontend bundles.
- **Clean Git Tracking**: `.env`, `.env.local`, `node_modules/`, and build artifacts are strictly excluded via `.gitignore`.
