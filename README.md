# RUSSIAN MARKET — Haute Digital Collectibles & Artifacts

RUSSIAN MARKET is an ultra-premium, mobile-first e-commerce platform and cryptographic digital vault. It provides collectors with an exclusive destination for acquiring original digital collectible artwork cards across six imperial editions with sovereign provenance, liquid-glass aesthetic design, real-time database reactivity, and secure asymmetric digital delivery.

---

## 💎 Features & Architecture

### 1. Ultra-Premium Design System & Brand Identity
- **Color Palette**: Deep obsidian (`#030712`), midnight navy (`#070B19`), electric cyan (`#00F0FF`), ice-blue, and imperial gold highlights.
- **Glass Effects**: Multi-layer crystal and liquid-glass panels (`backdrop-filter: blur(24px) saturate(190%)`), translucent specular borders, and subtle glow flares.
- **Holographic Collectible Cards**: Interactive 3D cards with simulated microchips, guilloche security patterns, procedural geometric vector artwork, and dynamic angle-dependent reflection glares.
- **Brand Identity**: Original Russian Market heraldic crest, diamond-faceted emblem, and intertwined `RM` monogram.

### 2. Six Imperial Collectible Editions
1. **Midnight Edition**: Deep obsidian carbon with ultraviolet corona and stealth cipher lore.
2. **Royal Blue Edition**: Cobalt sapphire with electric ice cyan waveguides.
3. **Crimson Edition**: Liquid ruby with rose-gold and molten copper filigree.
4. **Titanium Edition**: Brushed Grade-5 aerospace platinum with optical prismatic diffraction.
5. **Gold Edition**: 24-Karat imperial gold bars with double-eagle geometric crests.
6. **Limited Edition**: Prismatic rainbow holographic foil with serialized founding provenance.

*Note: All products are fictional digital collectible artwork. They are NOT functional credit cards, bank cards, or financial credentials.*

### 3. Mobile-First Customer Storefront (Android Chrome Optimized)
- Precision layouts optimized for **360px, 390px, 412px, and 430px** screen widths as well as tablet and desktop viewports.
- **Compact Header**: Brand logo, instant SKU/Collection search, notification center, My Orders shortcut, Digital Vault shortcut, and shopping bag drawer.
- **Fixed Bottom Navigation**:
  - `CARDS`: Featured 3D carousel, discovery catalogue, collection pills, How to Buy/Download guides.
  - `VIDEO`: Curated video demonstrations, vault tutorials, and 4K media player.
  - `CHAT`: Real-time 24/7 Concierge messaging with persistent database messages and curator replies.
  - `WALLET`: Cryptographic transaction ledger and verified account balance.
  - `SETTINGS`: Collector profile governance, notification toggles, and sovereign legal policies.

### 4. Robust Order Lifecycle & Idempotency
- **Lifecycle States**:
  - `pending`: Registered order awaiting settlement.
  - `payment_verified`: Confirmed payment; unlocks digital vault assets.
  - `processing`: Encrypted token packaging.
  - `completed`: Vault delivered.
  - `cancelled`, `refunded`, `failed`, `expired`.
- **Integrity**: Server-calculated price totals, immutable item snapshots, unique order numbers (`RM-2026-XXXXXX`), and UUID idempotency keys to prevent duplicate submissions.

### 5. Modular SunPay Payment Gateway Architecture
- Prepared for seamless future SunPay merchant API activation.
- Modular provider interface (`PaymentProvider.ts`) with payload generation, signature verification scaffolding, and idempotency tracking.
- Does not expose payment secrets or invent unauthorized endpoints.
- Includes `ManualAdminVerificationProvider` for instant admin verification in the Control Room.

### 6. Secure Digital Delivery & Encrypted Vault
- After payment verification, customer purchase entitlements are recorded in `customer_entitlements`.
- Generates 15-minute short-lived signed download tokens (`DigitalDeliveryService`).
- Full audit tracking of every download in `digital_downloads`.
- Unpaid users are strictly blocked from digital asset master files.

### 7. Separate Administrative Control Room (`/admin`)
- Accessible via the topbar admin button or dedicated control view.
- **Overview Metrics**: Total revenue, pending verifications, total orders, active inventory.
- **Order Management**: Search, filter, inspect snapshots, and **Verify Payment & Release Assets** with one click.
- **Product Management**: Add, edit, archive, change prices, configure discounts, and manage digital asset filenames.
- **Collector Accounts**: Inspect registered customers and order frequency.
- **Settings**: Configure SunPay Merchant ID, API endpoints, and sovereign policies.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Custom Liquid Glass CSS tokens
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
Open `http://127.0.0.1:5173/` in your browser.

### 3. Build for Production
```powershell
npm.cmd run build
```

### 4. Code Quality & Linting
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

- **No Usable Payment Card Data**: RUSSIAN MARKET creates exclusively fictional collectible art cards. No bank account numbers, CVVs, or magnetic stripes are generated or accepted.
- **Row Level Security**: Every table enforces Postgres RLS policies. Unauthenticated or unpaid users cannot read administrative logs, other customers' orders, or digital vault files.
- **No Leaked Secrets**: Only the public anonymous Supabase key is used client-side; service-role keys and payment secrets are strictly prohibited from frontend bundles.
