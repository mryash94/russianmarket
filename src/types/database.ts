type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Table<Row extends Record<string, unknown>> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export type OrderStatus =
  | 'pending'
  | 'payment_verified'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'refunded'

export type PaymentTransactionStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'refunded'
  | 'cancelled'

export type Database = {
  public: {
    Tables: {
      product_categories: Table<{
        id: string
        name: string
        slug: string
        description: string | null
        is_active: boolean
        sort_order: number
        created_at: string
        updated_at: string
      }>
      products: Table<{
        id: string
        sku: string
        category_id: string
        name: string
        slug: string
        description: string | null
        collection: string
        price_minor: number
        sale_price_minor: number | null
        discount_percent: number
        currency: string
        status: 'draft' | 'active' | 'archived'
        artwork_key: string
        artwork_number: number
        artwork_caption: string
        artwork_title: string
        specifications: Json
        images: string[]
        digital_asset_name: string
        digital_asset_path: string
        digital_asset_size_bytes: number
        digital_asset_mime: string
        is_featured: boolean
        is_popular: boolean
        tags: string[]
        created_at: string
        updated_at: string
      }>
      inventory: Table<{
        product_id: string
        available_quantity: number
        reserved_quantity: number
        created_at: string
        updated_at: string
      }>
      profiles: Table<{
        id: string
        email?: string | null
        display_name: string | null
        avatar_url: string | null
        created_at: string
        updated_at: string
      }>
      cart_items: Table<{
        user_id: string
        product_id: string
        quantity: number
        created_at: string
        updated_at: string
      }>
      wishlist_items: Table<{
        user_id: string
        product_id: string
        created_at: string
      }>
      orders: Table<{
        id: string
        order_number: string
        user_id: string
        status: OrderStatus
        subtotal_minor: number
        currency: string
        customer_email: string | null
        customer_name: string | null
        payment_method: string
        payment_reference: string | null
        idempotency_key: string
        admin_notes: string | null
        redemption_token?: string | null
        is_redeemed?: boolean
        verified_at: string | null
        completed_at: string | null
        created_at: string
        updated_at: string
      }>
      order_items: Table<{
        id: string
        order_id: string
        product_id: string
        product_name: string
        sku: string
        collection: string
        unit_price_minor: number
        quantity: number
        digital_asset_name: string
        created_at: string
      }>
      customer_entitlements: Table<{
        id: string
        user_id: string
        order_id: string
        product_id: string
        granted_at: string
        download_count: number
        last_downloaded_at: string | null
        is_active: boolean
      }>
      digital_downloads: Table<{
        id: string
        entitlement_id: string | null
        user_id: string
        order_id: string
        product_id: string
        downloaded_at: string
        ip_address: string | null
        user_agent: string | null
      }>
      payment_transactions: Table<{
        id: string
        order_id: string
        user_id: string
        provider: string
        provider_tx_id: string | null
        amount_minor: number
        currency: string
        status: PaymentTransactionStatus
        idempotency_key: string
        metadata: Json
        created_at: string
        verified_at: string | null
      }>
      store_settings: Table<{
        id: number
        store_name: string
        tagline: string
        logo_url: string | null
        currency: string
        support_email: string
        refund_policy: string
        privacy_policy: string
        delivery_policy: string
        sunpay_merchant_id: string | null
        sunpay_api_endpoint: string | null
        sunpay_sandbox_mode: boolean
        upi_merchant_id: string | null
        upi_merchant_name: string | null
        upi_min_amount_minor: number | null
        upi_max_amount_minor: number | null
        upi_instructions: string | null
        payment_validity_minutes: number | null
        qr_payment_enabled: boolean | null
        updated_at: string
      }>
      payment_requests: Table<{
        id: string
        user_id: string
        user_email: string
        amount_minor: number
        currency: string
        reference: string
        merchant_upi_id: string
        merchant_display_name: string
        utr_number: string | null
        status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'expired'
        expires_at: string
        notes: string | null
        rejection_reason: string | null
        reviewed_at: string | null
        reviewed_by: string | null
        created_at: string
        updated_at: string
      }>
      videos: Table<{
        id: string
        title: string
        description: string | null
        collection: string
        thumbnail_url: string | null
        video_url: string
        duration_seconds: number
        views_count: number
        sort_order: number
        is_published: boolean
        created_at: string
      }>
      user_roles: Table<{
        id: string
        user_id: string
        role: 'admin' | 'customer' | 'support'
        created_at: string
      }>
      wallet_accounts: Table<{
        user_id: string
        balance_minor: number
        currency: string
        created_at: string
        updated_at: string
      }>
      wallet_transactions: Table<{
        id: string
        user_id: string
        amount_minor: number
        transaction_type: 'credit' | 'debit' | 'adjustment'
        status: 'pending' | 'completed' | 'failed' | 'reversed'
        reference: string | null
        description?: string
        utr_number?: string | null
        created_at: string
      }>
      support_conversations: Table<{
        id: string
        user_id: string
        user_email?: string
        subject: string
        status: 'open' | 'pending' | 'closed'
        unread_admin_count?: number
        unread_customer_count?: number
        internal_notes?: string | null
        created_at: string
        updated_at: string
      }>
      support_messages: Table<{
        id: string
        conversation_id: string
        sender_user_id: string | null
        sender_type: 'customer' | 'admin' | 'system'
        body: string
        attachment_name?: string | null
        attachment_url?: string | null
        idempotency_key?: string | null
        created_at: string
      }>
      notifications: Table<{
        id: string
        user_id: string
        title: string
        body: string
        notification_type: string
        read_at: string | null
        created_at: string
      }>
      admin_audit_logs: Table<{
        id: string
        admin_user_id?: string | null
        actor_id?: string | null
        action: string
        target_resource?: string
        entity_type?: string
        entity_id?: string | null
        payload?: Json
        details?: Json
        ip_address?: string | null
        created_at: string
      }>
      automation_rules: Table<{
        id: string
        name: string
        description: string
        event_trigger: string
        is_enabled: boolean
        action_type: string
        action_config: Json
        last_executed_at: string | null
        last_status: 'success' | 'failed' | 'idle' | null
        execution_count: number
        created_at: string
        updated_at: string
      }>
      automation_logs: Table<{
        id: string
        rule_id: string
        event_type: string
        status: 'success' | 'failed' | 'retrying'
        details: Json
        error_message: string | null
        retry_count: number
        created_at: string
      }>
      notification_templates: Table<{
        id: string
        name: string
        title_template: string
        body_template: string
        category: 'order' | 'wallet' | 'support' | 'system'
        is_active: boolean
        created_at: string
        updated_at: string
      }>
      financial_reconciliation_snapshots: Table<{
        id: string
        snapshot_date: string
        total_orders_count: number
        total_orders_minor: number
        total_settled_minor: number
        total_wallet_credits_minor: number
        total_wallet_debits_minor: number
        unmatched_orders_count: number
        duplicate_references_count: number
        amount_mismatch_count: number
        pending_audit_count: number
        discrepancies_detail: Json
        auditor_notes: string | null
        audited_by: string
        created_at: string
      }>
    }
    Views: Record<string, never>
    Functions: {
      verify_payment_and_credit_wallet: {
        Args: {
          p_request_id: string
          p_admin_notes?: string
        }
        Returns: {
          success: boolean
          new_balance_minor: number
          message?: string
        }
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      merge_customer_selections: {
        Args: { p_cart_items: Json; p_wishlist_ids: string[] }
        Returns: Json
      }
      sync_customer_selections: {
        Args: { p_cart_items: Json; p_wishlist_ids: string[] }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
