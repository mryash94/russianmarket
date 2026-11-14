-- ====================================================================
-- RUSSIAN MARKET V5 ELITE COMMERCE PLATFORM SCHEMA MIGRATION
-- Migration: 20261114180000_russian_market_v5_elite_schema.sql
-- Description: Adds Smart Automation Engine rules & execution logs,
--              Notification Templates & delivery metadata,
--              Financial Reconciliation tracking snapshots,
--              and production database indexing for high concurrency.
-- ====================================================================

-- 1. PERFORMANCE INDEXES
create index if not exists idx_orders_user_created on public.orders(user_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_wallet_transactions_user_created on public.wallet_transactions(user_id, created_at desc);
create index if not exists idx_payment_requests_user_status on public.payment_requests(user_id, status);
create index if not exists idx_payment_requests_reference on public.payment_requests(reference);
create index if not exists idx_support_messages_conversation_created on public.support_messages(conversation_id, created_at asc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at);

-- 2. SMART AUTOMATION ENGINE (RULES & EXECUTION LOGS)
create table if not exists public.automation_rules (
  id text primary key,
  name text not null check (length(btrim(name)) between 2 and 120),
  description text not null default '',
  event_trigger text not null check (event_trigger in (
    'on_new_order',
    'on_verified_payment',
    'on_expired_payment',
    'on_digital_delivery',
    'on_new_support_message',
    'on_low_inventory',
    'on_failed_integration'
  )),
  is_enabled boolean not null default true,
  action_type text not null,
  action_config jsonb not null default '{}'::jsonb,
  last_executed_at timestamptz,
  last_status text check (last_status in ('success', 'failed', 'idle')),
  execution_count integer not null default 0 check (execution_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null references public.automation_rules(id) on delete cascade,
  event_type text not null,
  status text not null check (status in ('success', 'failed', 'retrying')),
  details jsonb not null default '{}'::jsonb,
  error_message text,
  retry_count integer not null default 0 check (retry_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_automation_logs_rule_created on public.automation_logs(rule_id, created_at desc);

-- 3. UNIFIED NOTIFICATION TEMPLATES
create table if not exists public.notification_templates (
  id text primary key,
  name text not null,
  title_template text not null,
  body_template text not null,
  category text not null default 'order' check (category in ('order', 'wallet', 'support', 'system')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. FINANCIAL RECONCILIATION SNAPSHOTS & AUDIT LOGS
create table if not exists public.financial_reconciliation_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date timestamptz not null default now(),
  total_orders_count integer not null default 0,
  total_orders_minor bigint not null default 0,
  total_settled_minor bigint not null default 0,
  total_wallet_credits_minor bigint not null default 0,
  total_wallet_debits_minor bigint not null default 0,
  unmatched_orders_count integer not null default 0,
  duplicate_references_count integer not null default 0,
  amount_mismatch_count integer not null default 0,
  pending_audit_count integer not null default 0,
  discrepancies_detail jsonb not null default '[]'::jsonb,
  auditor_notes text,
  audited_by text not null default 'System Administrator',
  created_at timestamptz not null default now()
);

-- 5. SEED INITIAL AUTOMATION RULES (IDEMPOTENT UPSERT)
insert into public.automation_rules (id, name, description, event_trigger, is_enabled, action_type, action_config)
values
  ('rule_order_ack', 'Order Submission Auto-Receipt', 'Automatically logs concierge task and sends instant customer in-app notification upon order placement.', 'on_new_order', true, 'send_notification', '{"template": "tpl_order_created"}'::jsonb),
  ('rule_payment_settle', 'Verified Payment Instant Settlement', 'Marks order verified, credits collector wallet, issues signed cryptographic pass, and notifies customer.', 'on_verified_payment', true, 'issue_certificate', '{"unlockAsset": true}'::jsonb),
  ('rule_payment_expiry', 'Expired Deposit Cleanup', 'Marks abandoned payment requests as expired after 15 minutes and restores reserved inventory.', 'on_expired_payment', true, 'release_inventory', '{"thresholdMinutes": 15}'::jsonb),
  ('rule_asset_delivery', 'Cryptographic Pass Issuance', 'Dispatches signed SHA-256 asset entitlement certificate token to customer account ledger.', 'on_digital_delivery', true, 'log_delivery', '{"signAlgorithm": "SHA256"}'::jsonb),
  ('rule_support_alert', 'Concierge Message Auto-Routing', 'Increments admin unread indicators and alerts senior curatorial desk when customer inquires.', 'on_new_support_message', true, 'alert_curator', '{"priority": "high"}'::jsonb),
  ('rule_low_inventory', 'Low Inventory Curatorial Notice', 'Alerts platform administrator when edition availability falls below 5 remaining pieces.', 'on_low_inventory', true, 'admin_broadcast', '{"threshold": 5}'::jsonb),
  ('rule_failed_gateway', 'Payment Gateway Fault Logging', 'Records failed webhook or payment callback payload in immutable admin audit registry.', 'on_failed_integration', true, 'audit_log', '{"severity": "critical"}'::jsonb)
on conflict (id) do nothing;

-- 6. SEED NOTIFICATION TEMPLATES (IDEMPOTENT UPSERT)
insert into public.notification_templates (id, name, title_template, body_template, category, is_active)
values
  ('tpl_order_created', 'Order Confirmation', 'Order #{{orderNumber}} Registered', 'Your acquisition of {{itemCount}} collectible card(s) for {{formattedTotal}} is registered. Pending settlement verification.', 'order', true),
  ('tpl_payment_verified', 'Settlement Verified', 'Payment Verified & Pass Issued', 'Order #{{orderNumber}} has been verified. Your sovereign collectible pass and master deliverables are ready in your Orders.', 'order', true),
  ('tpl_wallet_credited', 'Wallet Deposit Credited', 'Funds Credited to Wallet', 'Your deposit of {{formattedAmount}} has been credited to your Russian Market wallet balance.', 'wallet', true),
  ('tpl_concierge_reply', 'Concierge Desk Message', 'Message from Private Concierge', 'A senior curatorial officer has replied to your collection inquiry.', 'support', true)
on conflict (id) do nothing;

-- 7. ROW LEVEL SECURITY (RLS) FOR V5 TABLES
alter table public.automation_rules enable row level security;
alter table public.automation_logs enable row level security;
alter table public.notification_templates enable row level security;
alter table public.financial_reconciliation_snapshots enable row level security;

-- Policies: Automation Rules & Logs (Strictly Admin-Only)
drop policy if exists "Admin manage automation rules" on public.automation_rules;
create policy "Admin manage automation rules"
  on public.automation_rules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage automation logs" on public.automation_logs;
create policy "Admin manage automation logs"
  on public.automation_logs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Policies: Notification Templates (Public read active, Admin manage)
drop policy if exists "Public read active templates" on public.notification_templates;
create policy "Public read active templates"
  on public.notification_templates for select to public
  using (is_active = true);

drop policy if exists "Admin manage templates" on public.notification_templates;
create policy "Admin manage templates"
  on public.notification_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Policies: Financial Reconciliation Snapshots (Strictly Admin-Only)
drop policy if exists "Admin manage reconciliation snapshots" on public.financial_reconciliation_snapshots;
create policy "Admin manage reconciliation snapshots"
  on public.financial_reconciliation_snapshots for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 8. REALTIME REPLICATION FOR AUTOMATION RULES & NOTIFICATION TEMPLATES
alter publication supabase_realtime add table public.automation_rules;
alter publication supabase_realtime add table public.automation_logs;
alter publication supabase_realtime add table public.notification_templates;
