-- ====================================================================
-- RUSSIAN MARKET: COMPLETE PRODUCTION SCHEMA MIGRATION
-- Migration: 20261114160000_russian_market_production_schema.sql
-- Description: Sets up production tables, RLS policies, admin roles,
--              payment requests with expiry, atomic wallet procedures,
--              and realtime publications.
-- ====================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. PRODUCT CATEGORIES (VISA, MASTERCARD, RUPAY)
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PRODUCTS (DIGITAL COLLECTIBLE CARDS)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (length(btrim(sku)) between 3 and 40),
  category_id uuid not null references public.product_categories(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  collection text not null,
  price_minor bigint not null check (price_minor between 1 and 9007199254740991),
  sale_price_minor bigint check (sale_price_minor is null or sale_price_minor between 1 and price_minor),
  discount_percent integer not null default 0 check (discount_percent between 0 and 99),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  artwork_key text not null default 'northstar',
  artwork_number smallint not null default 1 check (artwork_number between 1 and 999),
  artwork_caption text not null default '',
  artwork_title text not null default '',
  specifications jsonb not null default '[]'::jsonb check (jsonb_typeof(specifications) = 'array'),
  images text[] not null default array[]::text[],
  digital_asset_name text not null default 'collectible-master.zip',
  digital_asset_path text not null default 'vault/rm-collectible-master.zip',
  digital_asset_size_bytes bigint not null default 52428800,
  digital_asset_mime text not null default 'application/zip',
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  tags text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. INVENTORY / ALLOCATIONS
create table if not exists public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  available_quantity integer not null default 0 check (available_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_reserved_not_above_available check (reserved_quantity <= available_quantity)
);

-- 5. USER ROLES (ROLE-BASED ACCESS CONTROL)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null default 'customer' check (role in ('admin', 'customer', 'support')),
  created_at timestamptz not null default now()
);

-- 6. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text check (display_name is null or length(display_name) <= 100),
  avatar_url text check (avatar_url is null or length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. ORDERS & ORDER ITEMS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'payment_verified', 'processing', 'completed', 'failed', 'expired', 'cancelled', 'refunded')),
  subtotal_minor bigint not null check (subtotal_minor between 1 and 9007199254740991),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  customer_email text,
  customer_name text,
  payment_method text not null default 'wallet',
  payment_reference text,
  idempotency_key uuid not null default gen_random_uuid(),
  admin_notes text,
  redemption_token text unique,
  is_redeemed boolean not null default false,
  redeemed_at timestamptz,
  redeemed_by text,
  verified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null check (length(btrim(product_name)) between 1 and 160),
  sku text not null,
  collection text not null,
  unit_price_minor bigint not null check (unit_price_minor between 0 and 9007199254740991),
  quantity integer not null check (quantity between 1 and 99),
  digital_asset_name text not null default 'collectible-master.zip',
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

-- 8. WALLET ACCOUNTS & TRANSACTIONS
create table if not exists public.wallet_accounts (
  user_id uuid primary key references auth.users(id) on delete restrict,
  balance_minor bigint not null default 0 check (balance_minor >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_minor bigint not null check (amount_minor <> 0),
  transaction_type text not null check (transaction_type in ('credit', 'debit', 'adjustment')),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'reversed')),
  reference text,
  description text not null default '',
  utr_number text,
  created_at timestamptz not null default now()
);

-- 9. PAYMENT REQUESTS (SERVER-AUTHORITATIVE UPI & EXPIRY)
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  user_email text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'INR',
  reference text not null unique,
  merchant_upi_id text not null,
  merchant_display_name text not null,
  utr_number text,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'verified', 'rejected', 'expired')),
  expires_at timestamptz not null,
  notes text,
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. STORE SETTINGS (ADMIN CONFIGURABLE UPI & POLICIES)
create table if not exists public.store_settings (
  id integer primary key default 1,
  store_name text not null default 'RUSSIAN MARKET',
  tagline text not null default 'Haute Digital Collectibles',
  currency text not null default 'INR',
  support_email text not null default 'support@russianmarket.store',
  refund_policy text not null default '',
  privacy_policy text not null default '',
  delivery_policy text not null default '',
  upi_merchant_id text not null default 'russianmarket@upi',
  upi_merchant_name text not null default 'RUSSIAN MARKET VAULT',
  upi_min_amount_minor bigint not null default 10000, -- Rs 100
  upi_max_amount_minor bigint not null default 50000000, -- Rs 500,000
  upi_fixed_amounts bigint[] not null default array[50000, 100000, 200000, 500000, 1000000]::bigint[],
  upi_instructions text not null default 'Scan QR with any UPI app (GPay, PhonePe, Paytm, BHIM) and submit the 12-digit UTR Number for verified settlement.',
  payment_validity_minutes integer not null default 15 check (payment_validity_minutes between 5 and 120),
  qr_payment_enabled boolean not null default true,
  sunpay_merchant_id text,
  sunpay_api_endpoint text,
  sunpay_sandbox_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 11. CUSTOMER ENTITLEMENTS & DIGITAL DOWNLOADS
create table if not exists public.customer_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_title text not null,
  sku text not null,
  collection text not null,
  digital_asset_name text not null,
  digital_asset_size_bytes bigint not null default 52428800,
  format text not null default 'High-Res Digital Archive',
  granted_at timestamptz not null default now(),
  download_count integer not null default 0,
  last_downloaded_at timestamptz,
  is_active boolean not null default true,
  unique (user_id, product_id)
);

create table if not exists public.digital_downloads (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid references public.customer_entitlements(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  downloaded_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

-- 12. SUPPORT CONVERSATIONS & MESSAGES
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  subject text not null default 'General Inquiry',
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_type text not null check (sender_type in ('customer', 'admin', 'system')),
  body text not null check (length(btrim(body)) between 1 and 4000),
  attachment_name text,
  attachment_url text,
  created_at timestamptz not null default now()
);

-- 13. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  notification_type text not null default 'order' check (notification_type in ('order', 'vault', 'support', 'system')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 14. ADMIN AUDIT LOGS
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 15. VIDEOS
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  collection text not null,
  thumbnail_url text,
  video_url text not null,
  duration_seconds integer not null default 0,
  views_count integer not null default 0,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- FUNCTIONS, TRIGGERS & PROCEDURES
-- ====================================================================

-- Check if current authenticated user is an authorized admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    where r.user_id = auth.uid()
      and r.role = 'admin'
  ) or (
    lower(btrim(coalesce(auth.jwt() ->> 'email', ''))) = 'own77777777@gmail.com'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Automatic user profile creation & admin bootstrap trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_initial_admin boolean := false;
begin
  if lower(btrim(coalesce(new.email, ''))) = 'own77777777@gmail.com' then
    is_initial_admin := true;
  end if;

  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, 'Collector'), '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email;

  -- Create wallet account
  insert into public.wallet_accounts (user_id, balance_minor, currency)
  values (new.id, 0, 'INR')
  on conflict (user_id) do nothing;

  -- Assign Role
  insert into public.user_roles (user_id, role)
  values (new.id, case when is_initial_admin then 'admin' else 'customer' end)
  on conflict (user_id) do update
  set role = case when is_initial_admin then 'admin' else public.user_roles.role end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic Payment Verification & Wallet Credit
create or replace function public.verify_payment_and_credit_wallet(
  p_request_id uuid,
  p_admin_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  req record;
  admin_uid uuid := auth.uid();
  admin_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  new_balance bigint;
begin
  -- Check admin authorization
  if not public.is_admin() then
    raise exception 'Access denied: Admin role required.' using errcode = '42501';
  end if;

  -- Lock payment request row for update
  select * into req
  from public.payment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Payment request not found.' using errcode = 'P0002';
  end if;

  if req.status = 'verified' then
    raise exception 'Payment request is already verified.' using errcode = '23505';
  end if;

  -- Update payment request status
  update public.payment_requests
  set status = 'verified',
      reviewed_at = now(),
      reviewed_by = coalesce(admin_email, admin_uid::text, 'admin'),
      notes = coalesce(p_admin_notes, notes),
      updated_at = now()
  where id = p_request_id;

  -- Lock or create wallet account
  insert into public.wallet_accounts (user_id, balance_minor, currency)
  values (req.user_id, 0, req.currency)
  on conflict (user_id) do nothing;

  update public.wallet_accounts
  set balance_minor = balance_minor + req.amount_minor,
      updated_at = now()
  where user_id = req.user_id
  returning balance_minor into new_balance;

  -- Insert ledger transaction
  insert into public.wallet_transactions (
    user_id,
    amount_minor,
    transaction_type,
    status,
    reference,
    description,
    utr_number
  ) values (
    req.user_id,
    req.amount_minor,
    'credit',
    'completed',
    req.reference,
    'UPI Deposit: ' || coalesce(req.reference, ''),
    req.utr_number
  );

  -- Insert notification for customer
  insert into public.notifications (
    user_id,
    title,
    body,
    notification_type
  ) values (
    req.user_id,
    'Deposit Verified',
    'Your deposit of ₹' || (req.amount_minor / 100)::text || ' has been approved and credited to your wallet.',
    'vault'
  );

  -- Insert audit log
  insert into public.admin_audit_logs (
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    admin_uid,
    admin_email,
    'VERIFY_PAYMENT',
    'payment_request',
    req.id::text,
    jsonb_build_object(
      'amount_minor', req.amount_minor,
      'utr_number', req.utr_number,
      'reference', req.reference,
      'user_id', req.user_id,
      'new_balance_minor', new_balance
    )
  );

  return jsonb_build_object(
    'success', true,
    'payment_request_id', req.id,
    'new_balance_minor', new_balance
  );
end;
$$;

grant execute on function public.verify_payment_and_credit_wallet(uuid, text) to authenticated;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payment_requests enable row level security;
alter table public.store_settings enable row level security;
alter table public.customer_entitlements enable row level security;
alter table public.digital_downloads enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.videos enable row level security;

-- Catalog & Public Read Policies
drop policy if exists "Public read active categories" on public.product_categories;
create policy "Public read active categories"
  on public.product_categories for select to public
  using (is_active or public.is_admin());

drop policy if exists "Admin manage categories" on public.product_categories;
create policy "Admin manage categories"
  on public.product_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select to public
  using (status = 'active' or public.is_admin());

drop policy if exists "Admin manage products" on public.products;
create policy "Admin manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read store settings" on public.store_settings;
create policy "Public read store settings"
  on public.store_settings for select to public
  using (true);

drop policy if exists "Admin update store settings" on public.store_settings;
create policy "Admin update store settings"
  on public.store_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read published videos" on public.videos;
create policy "Public read published videos"
  on public.videos for select to public
  using (is_published or public.is_admin());

-- Customer Isolation & Admin Policies
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users insert own orders" on public.orders;
create policy "Users insert own orders"
  on public.orders for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Admin manage orders" on public.orders;
create policy "Admin manage orders"
  on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own order items" on public.order_items;
create policy "Users read own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Users read own wallet account" on public.wallet_accounts;
create policy "Users read own wallet account"
  on public.wallet_accounts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own wallet transactions" on public.wallet_transactions;
create policy "Users read own wallet transactions"
  on public.wallet_transactions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own payment requests" on public.payment_requests;
create policy "Users read own payment requests"
  on public.payment_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users insert own payment requests" on public.payment_requests;
create policy "Users insert own payment requests"
  on public.payment_requests for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users submit UTR on own requests" on public.payment_requests;
create policy "Users submit UTR on own requests"
  on public.payment_requests for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own entitlements" on public.customer_entitlements;
create policy "Users read own entitlements"
  on public.customer_entitlements for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own conversations" on public.support_conversations;
create policy "Users read own conversations"
  on public.support_conversations for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users insert own conversations" on public.support_conversations;
create policy "Users insert own conversations"
  on public.support_conversations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users read conversation messages" on public.support_messages;
create policy "Users read conversation messages"
  on public.support_messages for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.support_conversations c
      where c.id = support_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert conversation messages" on public.support_messages;
create policy "Users insert conversation messages"
  on public.support_messages for insert to authenticated
  with check (
    public.is_admin() or exists (
      select 1 from public.support_conversations c
      where c.id = support_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users mark read own notifications" on public.notifications;
create policy "Users mark read own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Admin read audit logs" on public.admin_audit_logs;
create policy "Admin read audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.is_admin());

-- ====================================================================
-- SCHEMA USAGE & ROLES GRANT
-- ====================================================================
grant usage on schema public to anon, authenticated;
grant select on public.product_categories, public.products, public.store_settings, public.videos to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Default store settings row
insert into public.store_settings (id, store_name, tagline, currency)
values (1, 'RUSSIAN MARKET', 'Haute Digital Collectibles', 'INR')
on conflict (id) do nothing;
