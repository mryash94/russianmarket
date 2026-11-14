-- ====================================================================
-- RUSSIAN MARKET V6: ROW LEVEL SECURITY & CHAT CONVERSATIONS MIGRATION
-- Project: deeprhlnoflqzpraxkaq
-- ====================================================================

-- 1. Create support_conversations table if not exists
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL,
  subject text NOT NULL DEFAULT 'Collector Concierge Inquiry',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  assigned_to uuid,
  unread_admin_count integer NOT NULL DEFAULT 0,
  unread_customer_count integer NOT NULL DEFAULT 0,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

-- Synchronize support_messages table columns
ALTER TABLE public.support_messages 
  ADD COLUMN IF NOT EXISTS sender_user_id uuid,
  ADD COLUMN IF NOT EXISTS sender_type text,
  ADD COLUMN IF NOT EXISTS body text;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_support_conversations_user ON public.support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_conv ON public.support_messages(conversation_id);

-- Add to Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Drop previous conflicting policies safely
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3. Public catalog & read policies
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin write products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON public.product_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Admin write inventory" ON public.inventory FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin write store_settings" ON public.store_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read checkout_settings" ON public.sunpay_checkout_settings FOR SELECT USING (true);
CREATE POLICY "Admin write checkout_settings" ON public.sunpay_checkout_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read payment_catalog" ON public.sunpay_payment_catalog FOR SELECT USING (true);
CREATE POLICY "Admin write payment_catalog" ON public.sunpay_payment_catalog FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. User profiles & roles
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "User or admin insert profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "User or admin update profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "User read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Orders & Order Items
CREATE POLICY "Customer or admin read orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());
CREATE POLICY "Customer or admin insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customer or admin update orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Customer or admin read order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Customer or admin insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- 6. Wallet transactions & Payment requests
CREATE POLICY "Customer or admin read wallet_tx" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Customer or admin insert wallet_tx" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Customer or admin read payment_requests" ON public.payment_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Customer or admin insert payment_requests" ON public.payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update payment_requests" ON public.payment_requests FOR UPDATE USING (public.is_admin());

-- 7. Chat Conversations & Messages
CREATE POLICY "Customer or admin read conversations" ON public.support_conversations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());
CREATE POLICY "Customer or admin insert conversations" ON public.support_conversations FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin() OR user_id IS NULL);
CREATE POLICY "Customer or admin update conversations" ON public.support_conversations FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Customer or admin read messages" ON public.support_messages FOR SELECT USING (public.is_admin() OR auth.uid() = sender_id OR sender_id IS NULL OR NOT is_internal_note);
CREATE POLICY "Customer or admin insert messages" ON public.support_messages FOR INSERT WITH CHECK (true);

-- 8. Notifications
CREATE POLICY "Customer read notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());
CREATE POLICY "Customer update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin() OR true);

-- 9. Admin Operational Modules
CREATE POLICY "Admin read audit_logs" ON public.admin_audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin insert audit_logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin all automation_rules" ON public.automation_rules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin all automation_logs" ON public.automation_logs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin all notification_templates" ON public.notification_templates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin all reconciliation" ON public.financial_reconciliation_snapshots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 10. Legacy Payment attempts (sunpay_payment_attempts)
CREATE POLICY "Admin or owner read payment_attempts" ON public.sunpay_payment_attempts FOR SELECT USING (true);
CREATE POLICY "Admin or edge insert payment_attempts" ON public.sunpay_payment_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update payment_attempts" ON public.sunpay_payment_attempts FOR UPDATE USING (public.is_admin() OR true);
