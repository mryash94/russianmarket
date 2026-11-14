-- ====================================================================
-- RUSSIAN MARKET: COMPLETE SAFE IDEMPOTENT SCHEMA MIGRATION
-- Project: deeprhlnoflqzpraxkaq
-- Generated: 2026-11-14
-- Note: All statements use IF NOT EXISTS to guarantee zero data loss.
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

-- 5. USER ROLES
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null default 'customer' check (role in ('admin', 'customer', 'support')),
  created_at timestamptz not null default now()
);

-- 6. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or length(display_name) <= 100),
  avatar_url text check (avatar_url is null or length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. CART & WISHLIST
create table if not exists public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 8. ORDERS & ORDER ITEMS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique check (length(btrim(order_number)) between 6 and 40),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in (
    'pending', 'payment_verified', 'processing', 'completed', 'failed', 'expired', 'cancelled', 'refunded'
  )),
  subtotal_minor bigint not null check (subtotal_minor between 1 and 9007199254740991),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  customer_email text,
  customer_name text,
  payment_method text not null default 'sunpay_modular',
  payment_reference text,
  idempotency_key uuid not null,
  admin_notes text,
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
  digital_asset_name text not null default 'collectible-asset.zip',
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

-- 9. CUSTOMER ENTITLEMENTS (DIGITAL VAULT)
create table if not exists public.customer_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  granted_at timestamptz not null default now(),
  download_count integer not null default 0,
  last_downloaded_at timestamptz,
  is_active boolean not null default true,
  unique (user_id, product_id, order_id)
);

-- 10. DIGITAL DOWNLOAD AUDIT
create table if not exists public.digital_downloads (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid references public.customer_entitlements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

-- 11. PAYMENT TRANSACTIONS
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'sunpay',
  provider_tx_id text,
  amount_minor bigint not null,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed', 'refunded', 'cancelled')),
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

-- 12. STORE SETTINGS
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'RUSSIAN MARKET',
  tagline text not null default 'Haute Digital Collectibles & Cryptographic Artifacts',
  logo_url text,
  currency text not null default 'INR',
  support_email text not null default 'concierge@russianmarket.store',
  refund_policy text not null default 'Due to the immutable cryptographic nature of digital collectible assets, all verified acquisitions are final. In the event of a verified delivery failure, our 24/7 concierge will reissue signed download tokens or perform an immediate store credit adjustment.',
  privacy_policy text not null default 'Russian Market enforces zero-knowledge transaction processing. Personal records and access tokens are strictly encrypted and never distributed to third parties.',
  delivery_policy text not null default 'Instant delivery upon verified payment settlement. Download tokens are signed with asymmetric ECDSA keys and remain active within your private customer vault.',
  sunpay_merchant_id text,
  sunpay_api_endpoint text default 'https://api.sunpay.gateway/v1',
  sunpay_sandbox_mode boolean not null default true,
  upi_merchant_id text default 'russianmarket@icici',
  upi_merchant_name text default 'Russian Market Collectibles',
  upi_min_amount_minor bigint default 10000,
  upi_max_amount_minor bigint default 5000000,
  upi_instructions text default 'Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred). Enter your 12-digit UPI UTR number after completing payment for manual curatorial verification.',
  updated_at timestamptz not null default now()
);

-- 13. CURATED VIDEOS
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text,
  collection text not null default 'Master Class',
  thumbnail_url text,
  video_url text not null,
  duration_seconds integer not null default 180,
  views_count integer not null default 0,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- 14. WALLET ACCOUNTS & TRANSACTIONS
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
  amount_minor bigint not null,
  transaction_type text not null check (transaction_type in ('credit', 'debit', 'adjustment')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'reversed')),
  reference text unique,
  created_at timestamptz not null default now()
);

-- 15. CUSTOMER SUPPORT CONVERSATIONS & MESSAGES
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (length(btrim(subject)) between 1 and 160),
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
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, idempotency_key)
);

-- 16. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  body text not null check (length(btrim(body)) between 1 and 2000),
  notification_type text not null check (length(btrim(notification_type)) between 1 and 80),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 17. ADMIN AUDIT LOGS
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- ====================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  )
  or lower(btrim(coalesce(auth.jwt() ->> 'email', ''))) in (
    'admin@russianmarket.store',
    'admin@russianmarket.com',
    'collector@russianmarket.store'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Enable RLS
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customer_entitlements enable row level security;
alter table public.digital_downloads enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.store_settings enable row level security;
alter table public.videos enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Safe Policy Drops & Re-creations
do $$
begin
  -- Product Categories
  drop policy if exists "Public can read active categories" on public.product_categories;
  create policy "Public can read active categories" on public.product_categories
    for select to anon, authenticated using (is_active or public.is_admin());

  drop policy if exists "Admin manages categories" on public.product_categories;
  create policy "Admin manages categories" on public.product_categories
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- Products
  drop policy if exists "Public can read active products" on public.products;
  create policy "Public can read active products" on public.products
    for select to anon, authenticated using (status = 'active' or public.is_admin());

  drop policy if exists "Admin manages products" on public.products;
  create policy "Admin manages products" on public.products
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- Inventory
  drop policy if exists "Public can read inventory" on public.inventory;
  create policy "Public can read inventory" on public.inventory
    for select to anon, authenticated using (true);

  drop policy if exists "Admin manages inventory" on public.inventory;
  create policy "Admin manages inventory" on public.inventory
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- Profiles
  drop policy if exists "Customers view own profile" on public.profiles;
  create policy "Customers view own profile" on public.profiles
    for select to authenticated using (id = auth.uid() or public.is_admin());

  drop policy if exists "Customers update own profile" on public.profiles;
  create policy "Customers update own profile" on public.profiles
    for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

  -- Orders
  drop policy if exists "Customers view own orders" on public.orders;
  create policy "Customers view own orders" on public.orders
    for select to authenticated using (user_id = auth.uid() or public.is_admin());

  drop policy if exists "Customers insert own orders" on public.orders;
  create policy "Customers insert own orders" on public.orders
    for insert to authenticated with check (user_id = auth.uid() and status = 'pending');

  drop policy if exists "Admin manages all orders" on public.orders;
  create policy "Admin manages all orders" on public.orders
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- Order Items
  drop policy if exists "Customers view own order items" on public.order_items;
  create policy "Customers view own order items" on public.order_items
    for select to authenticated using (
      exists (select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin()))
    );

  drop policy if exists "Customers insert order items" on public.order_items;
  create policy "Customers insert order items" on public.order_items
    for insert to authenticated with check (
      exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
    );

  drop policy if exists "Admin manages order items" on public.order_items;
  create policy "Admin manages order items" on public.order_items
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- Store Settings
  drop policy if exists "Public view store settings" on public.store_settings;
  create policy "Public view store settings" on public.store_settings
    for select to anon, authenticated using (true);

  drop policy if exists "Admin update store settings" on public.store_settings;
  create policy "Admin update store settings" on public.store_settings
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

  -- Videos
  drop policy if exists "Public view published videos" on public.videos;
  create policy "Public view published videos" on public.videos
    for select to anon, authenticated using (is_published or public.is_admin());

  drop policy if exists "Admin manages videos" on public.videos;
  create policy "Admin manages videos" on public.videos
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- Support Threads & Messages
  drop policy if exists "Customers view own support threads" on public.support_conversations;
  create policy "Customers view own support threads" on public.support_conversations
    for select to authenticated using (user_id = auth.uid() or public.is_admin());

  drop policy if exists "Customers create support threads" on public.support_conversations;
  create policy "Customers create support threads" on public.support_conversations
    for insert to authenticated with check (user_id = auth.uid());

  drop policy if exists "Admin manages support threads" on public.support_conversations;
  create policy "Admin manages support threads" on public.support_conversations
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "Users view conversation messages" on public.support_messages;
  create policy "Users view conversation messages" on public.support_messages
    for select to authenticated using (
      public.is_admin() or exists (
        select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.user_id = auth.uid()
      )
    );

  drop policy if exists "Users send conversation messages" on public.support_messages;
  create policy "Users send conversation messages" on public.support_messages
    for insert to authenticated with check (
      (sender_type = 'customer' and sender_user_id = auth.uid()) or public.is_admin()
    );

  -- Notifications
  drop policy if exists "Customers view own notifications" on public.notifications;
  create policy "Customers view own notifications" on public.notifications
    for select to authenticated using (user_id = auth.uid() or public.is_admin());

  drop policy if exists "Customers mark notifications read" on public.notifications;
  create policy "Customers mark notifications read" on public.notifications
    for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
end $$;

-- 18. DEFAULT STORE SETTINGS SEED (IDEMPOTENT)
insert into public.store_settings (
  id, store_name, tagline, currency, support_email,
  upi_merchant_id, upi_merchant_name, upi_min_amount_minor, upi_max_amount_minor
) values (
  1, 'RUSSIAN MARKET', 'Haute Digital Collectibles & Cryptographic Artifacts', 'INR',
  'concierge@russianmarket.store', 'russianmarket@icici', 'Russian Market Collectibles', 10000, 5000000
) on conflict (id) do nothing;

-- 19. REALTIME PUBLICATION
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_messages'
  ) then
    alter publication supabase_realtime add table public.support_messages;
  end if;
exception when others then
  null;
end $$;
