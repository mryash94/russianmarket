# SPECIFICATION: RUSSIAN MARKET FULL-STACK ARCHITECTURE

**Status: FINALIZED**
**Version: 2.0.0-PROD**
**Target: Supabase (`deeprhlnoflqzpraxkaq`) + Vercel Deployment**

---

## 1. Authentication Architecture
- **Customer Auth**: Supabase Google OAuth (`supabase.auth.signInWithOAuth({ provider: 'google' })`) + Email OTP + Email/Password + Passkey/Wallet triggers via `AuthDrawer`.
- **Admin Auth**: Protected authorization for `own77777777@gmail.com` backed by server-side `user_roles` table and PostgreSQL `is_admin()` security-definer function. Frontend role check synchronized with database.
- **BUY NOW Redirection**:
  - Unauthenticated BUY NOW triggers stores `{ action: 'buy_now', productId }` in session storage.
  - Opens `AuthDrawer`.
  - On auth state change, detects pending action, restores cart, and launches `CheckoutModal` seamlessly.

---

## 2. Database Schema & Security
- **Unified Schema Migration**: `20261114160000_russian_market_production_schema.sql` (safe, idempotent, preserves all existing tables).
- **Core Entities**:
  - `product_categories`: VISA, MASTERCARD, RUPAY
  - `products`: Haute digital collectible cards with artwork keys, edition quotas, price in INR.
  - `inventory`: Available vs reserved quantity check.
  - `user_roles`: Maps `user_id` to role (`admin`, `customer`, `support`).
  - `profiles`: Display name, avatar URL, email.
  - `orders` & `order_items`: Full snapshot of purchased digital items, status machine, idempotency key, redemption token.
  - `wallet_accounts` & `wallet_transactions`: Strict ledger in minor units (paise).
  - `payment_requests`: Stores UPI deposit requests, exact amounts, UTR, server-authoritative `expires_at`, merchant details, verification state.
  - `store_settings`: Admin-configurable UPI parameters, payment validity duration, instructions.
  - `support_conversations` & `support_messages`: Real-time chat.
  - `customer_entitlements` & `digital_downloads`: Verified access tokens for digital asset zip downloads.
  - `admin_audit_logs`: Traceability for all administrative actions.
- **RLS Enforcement**:
  - All public reads on products/settings permitted.
  - Customer records restricted to `user_id = auth.uid()`.
  - Admin access gated by `public.is_admin()`.

---

## 3. UPI Payment System & Realtime Expiry
- **Admin UPI Settings**: Editable Merchant UPI ID (`pa`), Display Name (`pn`), Min/Max Amount, Expiry Minutes, QR Toggle.
- **Payment Request Lifecycle**:
  `pending` -> customer views QR with countdown timer (`expires_at`) -> customer enters UTR -> status becomes `submitted` -> Admin verifies in Control Center -> status becomes `verified` -> atomic database transaction credits wallet.
- **Server-Authoritative Expiry**:
  - Database stores `expires_at timestamptz`.
  - Frontend computes remaining seconds from server timestamp.
  - Reopening browser restores remaining countdown or displays expired state.
  - Expired payment requests cannot be submitted.

---

## 4. Admin Control Center Upgrade
- **Route**: Accessible at `/admin` with route-level guard.
- **Navigation**: Responsive collapsible sidebar with 17 management modules.
- **Aesthetic**: Premium Black & Graphite luxury styling with subtle cyan/emerald accents matching Russian Market design system.
- **Features**: Live metrics, Order status updates, Product management, Customer CRM, Live Chat Inbox, Wallet approvals, QR scanner, UPI configuration, Audit logs.

---

## 5. Supabase Realtime
- WebSocket subscriptions on:
  - `orders` (new customer orders, status changes)
  - `support_messages` (bidirectional chat)
  - `wallet_transactions` & `payment_requests` (deposit approvals, balance updates)
- Clean unsubscribe lifecycle preventing duplicate event listeners.
