create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  price_minor bigint not null
    check (price_minor between 1 and 9007199254740991),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  artwork_key text not null default 'northstar'
    check (artwork_key in ('northstar', 'open-road', 'pixel-plus', 'studio-select')),
  artwork_number smallint not null default 1 check (artwork_number between 1 and 999),
  artwork_caption text not null default '',
  artwork_title text not null default '',
  specifications jsonb not null default '[]'::jsonb
    check (jsonb_typeof(specifications) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  available_quantity integer not null default 0 check (available_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_reserved_not_above_available
    check (reserved_quantity <= available_quantity)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or length(display_name) <= 100),
  avatar_url text check (avatar_url is null or length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  subtotal_minor bigint not null
    check (subtotal_minor between 1 and 9007199254740991),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null check (length(btrim(product_name)) between 1 and 160),
  unit_price_minor bigint not null
    check (unit_price_minor between 0 and 9007199254740991),
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create table public.wallet_accounts (
  user_id uuid primary key references auth.users(id) on delete restrict,
  balance_minor bigint not null default 0
    check (balance_minor between 0 and 9007199254740991),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_minor bigint not null
    check (amount_minor between -9007199254740991 and 9007199254740991 and amount_minor <> 0),
  transaction_type text not null check (transaction_type in ('credit', 'debit', 'adjustment')),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'reversed')),
  reference text unique,
  created_at timestamptz not null default now()
);

create table public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (length(btrim(subject)) between 1 and 160),
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_type text not null check (sender_type in ('customer', 'admin', 'system')),
  body text not null check (length(btrim(body)) between 1 and 4000),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, idempotency_key)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  body text not null check (length(btrim(body)) between 1 and 2000),
  notification_type text not null check (length(btrim(notification_type)) between 1 and 80),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (length(btrim(action)) between 1 and 120),
  entity_type text not null check (length(btrim(entity_type)) between 1 and 120),
  entity_id uuid,
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index products_active_category_created_idx
  on public.products (category_id, created_at desc, id)
  where status = 'active';
create index product_categories_active_sort_idx
  on public.product_categories (sort_order, name)
  where is_active;
create index inventory_available_product_idx
  on public.inventory (product_id)
  where available_quantity > reserved_quantity;
create index cart_items_product_idx on public.cart_items (product_id);
create index wishlist_items_product_idx on public.wishlist_items (product_id);
create index orders_user_created_idx on public.orders (user_id, created_at desc, id);
create index order_items_order_idx on public.order_items (order_id, id);
create index wallet_transactions_user_created_idx
  on public.wallet_transactions (user_id, created_at desc, id);
create index support_conversations_user_updated_idx
  on public.support_conversations (user_id, updated_at desc, id);
create index support_messages_conversation_created_idx
  on public.support_messages (conversation_id, created_at, id);
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc, id);
create index admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc, id);

revoke all on public.product_categories, public.products, public.inventory,
  public.profiles, public.cart_items, public.wishlist_items, public.orders,
  public.order_items, public.wallet_accounts, public.wallet_transactions,
  public.support_conversations, public.support_messages, public.notifications,
  public.admin_audit_logs
  from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
create trigger wallet_accounts_set_updated_at
  before update on public.wallet_accounts
  for each row execute function public.set_updated_at();
create trigger support_conversations_set_updated_at
  before update on public.support_conversations
  for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public, anon, authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger auth_user_create_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

revoke all on function public.create_profile_for_new_user()
  from public, anon, authenticated;

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.is_blackx_owner()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    = 'own77777777@gmail.com';
$$;

grant execute on function public.is_blackx_owner() to anon, authenticated;
revoke all on function public.is_blackx_owner() from public;

create or replace function public.merge_customer_selections(
  p_cart_items jsonb,
  p_wishlist_ids uuid[] default array[]::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  result jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_cart_items is null or jsonb_typeof(p_cart_items) <> 'array' then
    raise exception 'Cart selection must be an array'
      using errcode = '22023';
  end if;
  if jsonb_array_length(p_cart_items) > 100
     or coalesce(cardinality(p_wishlist_ids), 0) > 100 then
    raise exception 'Cart and wishlist selections may contain at most 100 items each'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_cart_items) as input(product_id uuid, quantity integer)
    where input.product_id is null or input.quantity is null or input.quantity not between 1 and 99
  ) then
    raise exception 'Cart selection contains an invalid product or quantity'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  delete from public.cart_items item
  where item.user_id = current_user_id
    and not exists (
      select 1 from public.products product
      where product.id = item.product_id and product.status = 'active'
    );
  delete from public.wishlist_items item
  where item.user_id = current_user_id
    and not exists (
      select 1 from public.products product
      where product.id = item.product_id and product.status = 'active'
    );

  insert into public.cart_items (user_id, product_id, quantity)
  select current_user_id, input.product_id, max(input.quantity)
  from jsonb_to_recordset(p_cart_items) as input(product_id uuid, quantity integer)
  join public.products product
    on product.id = input.product_id and product.status = 'active'
  group by input.product_id
  on conflict (user_id, product_id) do update
    set quantity = greatest(public.cart_items.quantity, excluded.quantity);

  insert into public.wishlist_items (user_id, product_id)
  select distinct current_user_id, candidate.product_id
  from unnest(coalesce(p_wishlist_ids, array[]::uuid[])) as candidate(product_id)
  join public.products product
    on product.id = candidate.product_id and product.status = 'active'
  on conflict (user_id, product_id) do nothing;

  select jsonb_build_object(
    'cart_items',
    coalesce(
      (select jsonb_object_agg(item.product_id::text, item.quantity)
       from public.cart_items item where item.user_id = current_user_id),
      '{}'::jsonb
    ),
    'wishlist_ids',
    coalesce(
      (select jsonb_agg(item.product_id::text order by item.product_id)
       from public.wishlist_items item where item.user_id = current_user_id),
      '[]'::jsonb
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.merge_customer_selections(jsonb, uuid[]) to authenticated;
revoke all on function public.merge_customer_selections(jsonb, uuid[])
  from public, anon;

create or replace function public.sync_customer_selections(
  p_cart_items jsonb,
  p_wishlist_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_cart_items is null or jsonb_typeof(p_cart_items) <> 'array' then
    raise exception 'Cart selection must be an array'
      using errcode = '22023';
  end if;
  if jsonb_array_length(p_cart_items) > 100 then
    raise exception 'Cart selection must be an array of at most 100 items'
      using errcode = '22023';
  end if;
  if coalesce(cardinality(p_wishlist_ids), 0) > 100 then
    raise exception 'Wishlist selection must contain at most 100 items'
      using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_cart_items) as input(product_id uuid, quantity integer)
    where input.product_id is null or input.quantity is null or input.quantity not between 1 and 99
  ) then
    raise exception 'Cart selection contains an invalid product or quantity'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  if exists (
    select 1
    from jsonb_to_recordset(p_cart_items) as input(product_id uuid, quantity integer)
    left join public.products product
      on product.id = input.product_id and product.status = 'active'
    where product.id is null
  ) or exists (
    select 1
    from unnest(coalesce(p_wishlist_ids, array[]::uuid[])) as item(product_id)
    left join public.products product
      on product.id = item.product_id and product.status = 'active'
    where product.id is null
  ) then
    raise exception 'Selections contain a product that is not available'
      using errcode = '22023';
  end if;

  delete from public.cart_items item
  where item.user_id = current_user_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_cart_items) as input(product_id uuid, quantity integer)
      where input.product_id = item.product_id
    );
  insert into public.cart_items (user_id, product_id, quantity)
  select current_user_id, input.product_id, max(input.quantity)
  from jsonb_to_recordset(p_cart_items) as input(product_id uuid, quantity integer)
  group by input.product_id
  on conflict (user_id, product_id) do update
    set quantity = excluded.quantity;

  delete from public.wishlist_items item
  where item.user_id = current_user_id
    and not (item.product_id = any(coalesce(p_wishlist_ids, array[]::uuid[])));
  insert into public.wishlist_items (user_id, product_id)
  select distinct current_user_id, item.product_id
  from unnest(coalesce(p_wishlist_ids, array[]::uuid[])) as item(product_id)
  on conflict (user_id, product_id) do nothing;
end;
$$;

grant execute on function public.sync_customer_selections(jsonb, uuid[]) to authenticated;
revoke all on function public.sync_customer_selections(jsonb, uuid[])
  from public, anon;

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

grant select on public.product_categories, public.products, public.inventory to anon, authenticated;
grant insert, update, delete on public.product_categories, public.products, public.inventory
  to authenticated;
grant select, update (display_name, avatar_url) on public.profiles to authenticated;
grant select on public.cart_items, public.wishlist_items to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant select on public.wallet_accounts, public.wallet_transactions to authenticated;
grant select, insert on public.support_conversations to authenticated;
grant select, insert on public.support_messages to authenticated;
grant select, update (read_at) on public.notifications to authenticated;
grant select on public.admin_audit_logs to authenticated;

create or replace function public.audit_admin_catalog_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entity_uuid uuid;
begin
  if tg_table_name = 'inventory' then
    entity_uuid := coalesce(new.product_id, old.product_id);
  else
    entity_uuid := coalesce(new.id, old.id);
  end if;

  insert into public.admin_audit_logs (
    actor_id, action, entity_type, entity_id, details
  ) values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    entity_uuid,
    jsonb_build_object(
      'actor_email', lower(btrim(coalesce(auth.jwt() ->> 'email', ''))),
      'old', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
      'new', case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
    )
  );
  return null;
end;
$$;

revoke all on function public.audit_admin_catalog_mutation()
  from public, anon, authenticated;

create trigger product_categories_audit_mutation
  after insert or update or delete on public.product_categories
  for each row execute function public.audit_admin_catalog_mutation();
create trigger products_audit_mutation
  after insert or update or delete on public.products
  for each row execute function public.audit_admin_catalog_mutation();
create trigger inventory_audit_mutation
  after insert or update or delete on public.inventory
  for each row execute function public.audit_admin_catalog_mutation();

create policy "Public can view active product categories"
  on public.product_categories for select to anon, authenticated
  using (is_active or public.is_blackx_owner());
create policy "Owner manages product categories"
  on public.product_categories for all to authenticated
  using (public.is_blackx_owner()) with check (public.is_blackx_owner());

create policy "Public can view active products"
  on public.products for select to anon, authenticated
  using (status = 'active' or public.is_blackx_owner());
create policy "Owner manages products"
  on public.products for all to authenticated
  using (public.is_blackx_owner()) with check (public.is_blackx_owner());

create policy "Public can view active product inventory"
  on public.inventory for select to anon, authenticated
  using (
    exists (
      select 1 from public.products product
      where product.id = inventory.product_id
        and (product.status = 'active' or public.is_blackx_owner())
    )
  );
create policy "Owner manages inventory"
  on public.inventory for all to authenticated
  using (public.is_blackx_owner()) with check (public.is_blackx_owner());

create policy "Customers view their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_blackx_owner());
create policy "Customers update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy "Owner manages profiles"
  on public.profiles for all to authenticated
  using (public.is_blackx_owner()) with check (public.is_blackx_owner());

create policy "Customers manage their own cart"
  on public.cart_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.products product
      where product.id = cart_items.product_id and product.status = 'active'
    )
  );
create policy "Owner can review customer carts"
  on public.cart_items for select to authenticated
  using (public.is_blackx_owner());

create policy "Customers manage their own wishlist"
  on public.wishlist_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.products product
      where product.id = wishlist_items.product_id and product.status = 'active'
    )
  );
create policy "Owner can review customer wishlists"
  on public.wishlist_items for select to authenticated
  using (public.is_blackx_owner());

create policy "Customers read their own orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_blackx_owner());
create policy "Customers read their own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders customer_order
      where customer_order.id = order_items.order_id
        and (customer_order.user_id = (select auth.uid()) or public.is_blackx_owner())
    )
  );

create policy "Customers read their own wallet account"
  on public.wallet_accounts for select to authenticated
  using (user_id = (select auth.uid()) or public.is_blackx_owner());
create policy "Customers read their own wallet transactions"
  on public.wallet_transactions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_blackx_owner());

create policy "Customers read their own support conversations"
  on public.support_conversations for select to authenticated
  using (user_id = (select auth.uid()) or public.is_blackx_owner());
create policy "Customers create their own support conversations"
  on public.support_conversations for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open');
create policy "Owner manages support conversations"
  on public.support_conversations for all to authenticated
  using (public.is_blackx_owner()) with check (public.is_blackx_owner());

create policy "Customers read messages in their conversations"
  on public.support_messages for select to authenticated
  using (
    public.is_blackx_owner()
    or exists (
      select 1 from public.support_conversations conversation
      where conversation.id = support_messages.conversation_id
        and conversation.user_id = (select auth.uid())
    )
  );
create policy "Customers send messages in their open conversations"
  on public.support_messages for insert to authenticated
  with check (
    sender_type = 'customer'
    and sender_user_id = (select auth.uid())
    and exists (
      select 1 from public.support_conversations conversation
      where conversation.id = support_messages.conversation_id
        and conversation.user_id = (select auth.uid())
        and conversation.status = 'open'
    )
  );
create policy "Owner manages support messages"
  on public.support_messages for all to authenticated
  using (public.is_blackx_owner()) with check (public.is_blackx_owner());

create policy "Customers read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) or public.is_blackx_owner());
create policy "Customers mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owner reads admin audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.is_blackx_owner());
