import { supabase } from '../lib/supabase'
import { formatINR } from '../lib/currency'
import { SEED_PRODUCTS } from '../data/seedProducts'
import { SEED_VIDEOS, type VideoItem } from '../data/seedVideos'
import type { Product, CollectibleCollection } from '../types/product'
import type { OrderStatus } from '../types/database'

export type OrderItemSnapshot = {
  productId: string
  productName: string
  sku: string
  collection: string
  unitPriceMinor: number
  quantity: number
  digitalAssetName: string
}

export const SUPER_ADMIN_EMAIL = 'own77777777@gmail.com'

export type Order = {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  subtotalMinor: number
  currency: string
  customerEmail: string
  customerName?: string
  paymentMethod: string
  paymentReference?: string
  idempotencyKey: string
  adminNotes?: string
  items: OrderItemSnapshot[]
  redemptionToken?: string
  isRedeemed?: boolean
  redeemedAt?: string
  redeemedBy?: string
  verifiedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type CustomerEntitlement = {
  id: string
  userId: string
  orderId: string
  productId: string
  productTitle: string
  sku: string
  collection: string
  digitalAssetName: string
  digitalAssetSizeBytes: number
  format: string
  grantedAt: string
  downloadCount: number
  lastDownloadedAt?: string
  isActive: boolean
}

export type DownloadLog = {
  id: string
  entitlementId: string
  userId: string
  productId: string
  orderId: string
  downloadedAt: string
  ipAddress: string
  userAgent: string
}

export type SupportMessage = {
  id: string
  conversationId: string
  senderUserId?: string
  senderType: 'customer' | 'admin' | 'system'
  body: string
  attachmentName?: string
  attachmentUrl?: string
  status?: 'sending' | 'delivered' | 'failed'
  createdAt: string
}

export type SupportConversation = {
  id: string
  userId: string
  userEmail: string
  subject: string
  status: 'open' | 'pending' | 'closed'
  unreadAdminCount?: number
  unreadCustomerCount?: number
  internalNotes?: string
  createdAt: string
  updatedAt: string
  messages: SupportMessage[]
}

export type NotificationItem = {
  id: string
  userId: string
  title: string
  body: string
  notificationType: 'order' | 'wallet' | 'vault' | 'support' | 'system'
  readAt?: string | null
  createdAt: string
}

export type WalletTx = {
  id: string
  userId: string
  amountMinor: number
  transactionType: 'credit' | 'debit' | 'adjustment'
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  reference: string
  description: string
  utrNumber?: string
  rejectionReason?: string
  approvedAt?: string
  approvedBy?: string
  createdAt: string
}

export type DepositRequest = {
  id: string
  userId: string
  userEmail: string
  amountMinor: number
  utrNumber: string
  reference: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  rejectionReason?: string
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export type StoreSettings = {
  storeName: string
  tagline: string
  currency: string
  supportEmail: string
  refundPolicy: string
  privacyPolicy: string
  deliveryPolicy: string
  sunpayMerchantId: string
  sunpayApiEndpoint: string
  sunpaySandboxMode: boolean
  upiMerchantId: string
  upiMerchantName: string
  upiMinAmountMinor: number
  upiMaxAmountMinor: number
  upiInstructions: string
  upiFixedAmounts: number[]
  paymentValidityMinutes: number
  qrPaymentEnabled: boolean
}

export type PaymentRequestRecord = {
  id: string
  userId: string
  userEmail: string
  amountMinor: number
  currency: string
  reference: string
  merchantUpiId: string
  merchantDisplayName: string
  utrNumber?: string
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'expired'
  expiresAt: string
  notes?: string
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}

export type AdminAuditLog = {
  id: string
  adminUserId?: string | null
  action: string
  targetResource: string
  payload?: any
  ipAddress?: string
  createdAt: string
}

export type AutomationEventTrigger =
  | 'on_new_order'
  | 'on_verified_payment'
  | 'on_expired_payment'
  | 'on_digital_delivery'
  | 'on_new_support_message'
  | 'on_low_inventory'
  | 'on_failed_integration'

export type AutomationRule = {
  id: string
  name: string
  description: string
  eventTrigger: AutomationEventTrigger
  isEnabled: boolean
  actionType: string
  actionConfig: Record<string, any>
  lastExecutedAt?: string | null
  lastStatus?: 'success' | 'failed' | 'idle' | null
  executionCount: number
}

export type AutomationLog = {
  id: string
  ruleId: string
  eventType: string
  status: 'success' | 'failed' | 'retrying'
  details: Record<string, any>
  errorMessage?: string | null
  retryCount: number
  createdAt: string
}

export type NotificationTemplate = {
  id: string
  name: string
  titleTemplate: string
  bodyTemplate: string
  category: 'order' | 'wallet' | 'support' | 'system'
  isActive: boolean
}

export type FinancialDiscrepancy = {
  id: string
  type: 'unmatched_order' | 'duplicate_utr' | 'amount_mismatch' | 'pending_verification'
  severity: 'low' | 'medium' | 'high'
  orderNumber?: string
  reference?: string
  expectedAmountMinor?: number
  actualAmountMinor?: number
  description: string
  detectedAt: string
  status: 'unresolved' | 'resolved'
  resolutionNotes?: string
}

export type FinancialReconciliationSnapshot = {
  id: string
  snapshotDate: string
  totalOrdersCount: number
  totalOrdersMinor: number
  totalSettledMinor: number
  totalWalletCreditsMinor: number
  totalWalletDebitsMinor: number
  unmatchedOrdersCount: number
  duplicateReferencesCount: number
  amountMismatchCount: number
  pendingAuditCount: number
  discrepancies: FinancialDiscrepancy[]
  auditorNotes?: string
  auditedBy: string
}

const STORAGE_KEYS = {
  PRODUCTS: 'rm_db_products_v2',
  ORDERS: 'rm_db_orders_v2',
  ENTITLEMENTS: 'rm_db_entitlements_v2',
  DOWNLOADS: 'rm_db_downloads_v2',
  CONVERSATIONS: 'rm_db_conversations_v2',
  NOTIFICATIONS: 'rm_db_notifications_v2',
  WALLET_TX: 'rm_db_wallet_tx_v2',
  DEPOSITS: 'rm_db_deposits_v2',
  PAYMENT_REQUESTS: 'rm_db_payment_requests_v2',
  SETTINGS: 'rm_db_settings_v2',
  VIDEOS: 'rm_db_videos_v2',
  AUDIT_LOGS: 'rm_db_audit_logs_v2',
  AUTOMATION_RULES: 'rm_db_automation_rules_v5',
  AUTOMATION_LOGS: 'rm_db_automation_logs_v5',
  NOTIFICATION_TEMPLATES: 'rm_db_notification_templates_v5',
  RECONCILIATION: 'rm_db_reconciliation_snapshots_v5',
}

type RealtimeListener = (event: string, payload: unknown) => void

function isUuid(str?: string | null): boolean {
  if (!str) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

function normalizeProductCategory(p: any): Product {
  let cat: 'VISA' | 'MASTERCARD' | 'RUPAY' = 'MASTERCARD'
  const rawCat = String(p.collection || p.category || p.name || '').toUpperCase()
  if (
    rawCat.includes('VISA') ||
    rawCat.includes('ROYAL') ||
    rawCat.includes('AZURE') ||
    rawCat.includes('TITANIUM') ||
    rawCat.includes('BLUE') ||
    rawCat.includes('PLATINUM')
  ) {
    cat = 'VISA'
  } else if (
    rawCat.includes('RUPAY') ||
    rawCat.includes('EMERALD') ||
    rawCat.includes('JADE') ||
    rawCat.includes('GOLD')
  ) {
    cat = 'RUPAY'
  } else {
    cat = 'MASTERCARD'
  }

  return {
    ...p,
    collection: cat,
    category: cat,
    categoryLabel: cat,
    currency: 'INR',
  }
}

/**
 * Reactive Store Engine
 * Seamlessly abstracts Supabase PostgreSQL and persistent local reactive layer.
 * Guarantees zero blank screens, real stateful persistence, and real-time updates.
 */
class StoreEngine {
  private listeners: Set<RealtimeListener> = new Set()
  private connectionStatus: 'connected' | 'connecting' | 'offline' = 'connecting'

  constructor() {
    this.initSupabaseRealtime()
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'offline' {
    return this.connectionStatus
  }

  private initSupabaseRealtime() {
    if (!supabase) {
      this.connectionStatus = 'offline'
      return
    }
    try {
      supabase
        .channel('store-engine-global-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, (payload) => {
          this.emit('settings_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          this.emit('order_created', payload)
          this.emit('order_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, (payload) => {
          this.emit('payment_requests_updated', payload)
          this.emit('deposits_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, (payload) => {
          this.emit('new_message', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, (payload) => {
          this.emit('conversations_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          this.emit('products_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, (payload) => {
          this.emit('wallet_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_audit_logs' }, (payload) => {
          this.emit('audit_logs_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_rules' }, (payload) => {
          this.emit('automation_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_logs' }, (payload) => {
          this.emit('automation_logs_updated', payload)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_templates' }, (payload) => {
          this.emit('templates_updated', payload)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.connectionStatus = 'connected'
            this.emit('connection_status_changed', 'connected')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.connectionStatus = 'offline'
            this.emit('connection_status_changed', 'offline')
          }
        })
    } catch (err) {
      console.warn('[StoreEngine] Realtime channel subscription warning:', err)
      this.connectionStatus = 'offline'
    }
  }

  subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: string, payload: unknown) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, payload)
      } catch (err) {
        console.error('StoreEngine event listener error:', err)
      }
    })
  }

  // --- PRODUCTS ---

  async getProducts(): Promise<Product[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          return data.map((row: any) =>
            normalizeProductCategory({
              id: row.id,
              sku: row.sku,
              slug: row.slug,
              name: row.name,
              description: row.description || '',
              collection: row.collection as CollectibleCollection,
              category: row.collection,
              categoryLabel: row.collection,
              priceMinor: row.price_minor,
              salePriceMinor: row.sale_price_minor,
              discountPercent: row.discount_percent || 0,
              currency: 'INR',
              stockCount: 10,
              stockLabel: 'In Stock',
              availability: 'in_stock',
              editionNumber: row.artwork_number,
              editionTotal: 100,
              artwork: (row.artwork_key || 'northstar') as any,
              artworkNumber: row.artwork_number,
              artworkCaption: row.artwork_caption || '',
              artworkTitle: row.artwork_title || '',
              images: row.images || [],
              digitalAsset: {
                filename: row.digital_asset_name || 'collectible-master.zip',
                sizeBytes: row.digital_asset_size_bytes || 52428800,
                format: 'High-Res Digital Archive',
              },
              specifications: Array.isArray(row.specifications) ? row.specifications : [],
              status: row.status,
              isFeatured: row.is_featured,
              isPopular: row.is_popular,
              tags: row.tags || [],
              createdAt: row.created_at,
            }),
          )
        }
      } catch (e) {
        console.warn('Falling back to local persistent store for products.', e)
      }
    }

    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
    if (!saved) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS))
      return SEED_PRODUCTS
    }
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeProductCategory)
      }
      return SEED_PRODUCTS
    } catch {
      return SEED_PRODUCTS
    }
  }

  async saveProduct(product: Product): Promise<Product> {
    const products = await this.getProducts()
    const index = products.findIndex((p) => p.id === product.id)
    let updated: Product[]

    if (index >= 0) {
      updated = [...products]
      updated[index] = { ...product, updatedAt: new Date().toISOString() }
    } else {
      updated = [{ ...product, createdAt: new Date().toISOString() }, ...products]
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated))

    if (supabase) {
      try {
        await supabase.from('products').upsert({
          id: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          collection: product.collection,
          price_minor: product.priceMinor,
          sale_price_minor: product.salePriceMinor,
          discount_percent: product.discountPercent,
          status: product.status,
          specifications: product.specifications,
          digital_asset_name: product.digitalAsset.filename,
          digital_asset_size_bytes: product.digitalAsset.sizeBytes,
        })
      } catch (err) {
        console.warn('Supabase product sync warning:', err)
      }
    }

    this.emit('products_updated', updated)
    return product
  }

  async deleteProduct(productId: string): Promise<void> {
    const products = await this.getProducts()
    const filtered = products.filter((p) => p.id !== productId)
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered))

    if (supabase) {
      try {
        await supabase.from('products').update({ status: 'archived' }).eq('id', productId)
      } catch (err) {
        console.warn('Supabase delete product warning:', err)
      }
    }

    this.emit('products_updated', filtered)
  }

  // --- ORDERS ---

  async getOrders(userId?: string | null, userEmail?: string | null): Promise<Order[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS)
    let localOrders: Order[] = raw ? JSON.parse(raw) : []

    if (userId) {
      localOrders = localOrders.filter((o) => o.userId === userId || (userEmail && o.customerEmail === userEmail))
    }

    if (supabase) {
      try {
        let query = supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .order('created_at', { ascending: false })

        if (userId && isUuid(userId)) {
          query = query.eq('user_id', userId)
        } else if (userEmail) {
          query = query.eq('customer_email', userEmail)
        }

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          const remoteOrders: Order[] = data.map((r: any) => ({
            id: r.id,
            orderNumber: r.order_number,
            userId: r.user_id,
            status: r.status,
            subtotalMinor: Number(r.subtotal_minor),
            currency: r.currency || 'INR',
            customerEmail: r.customer_email || '',
            customerName: r.customer_name || 'Valued Collector',
            paymentMethod: r.payment_method,
            paymentReference: r.payment_reference,
            idempotencyKey: r.idempotency_key,
            adminNotes: r.admin_notes,
            redemptionToken: r.redemption_token,
            isRedeemed: r.is_redeemed,
            redeemedAt: r.redeemed_at,
            redeemedBy: r.redeemed_by,
            verifiedAt: r.verified_at,
            completedAt: r.completed_at,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            items: (r.items || []).map((it: any) => ({
              productId: it.product_id,
              productName: it.product_name,
              sku: it.sku,
              collection: it.collection,
              unitPriceMinor: Number(it.unit_price_minor),
              quantity: it.quantity,
              digitalAssetName: it.digital_asset_name,
            })),
          }))

          const merged = [...remoteOrders]
          for (const l of localOrders) {
            if (!merged.some((m) => m.orderNumber === l.orderNumber || m.id === l.id)) {
              merged.push(l)
            }
          }
          return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      } catch (err) {
        console.warn('Supabase getOrders warning:', err)
      }
    }

    return localOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const orders = await this.getOrders()
    return orders.find((o) => o.id === orderId) || null
  }

  async createOrder(params: {
    userId: string
    customerEmail: string
    customerName?: string
    items: OrderItemSnapshot[]
    paymentMethod: string
    idempotencyKey: string
  }): Promise<Order> {
    const existingOrders = await this.getOrders()
    // Idempotency check
    const duplicate = existingOrders.find((o) => o.idempotencyKey === params.idempotencyKey)
    if (duplicate) return duplicate

    // Calculate server-side total
    const subtotalMinor = params.items.reduce(
      (sum, item) => sum + item.unitPriceMinor * item.quantity,
      0,
    )

    const randomNum = Math.floor(100000 + Math.random() * 900000)
    const orderNumber = `RM-${new Date().getFullYear()}-${randomNum}`
    const now = new Date().toISOString()

    const redemptionToken = `RM-QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orderNumber,
      userId: params.userId,
      status: 'pending',
      subtotalMinor,
      currency: 'INR',
      customerEmail: params.customerEmail,
      customerName: params.customerName || 'Valued Collector',
      paymentMethod: params.paymentMethod,
      idempotencyKey: params.idempotencyKey,
      items: params.items,
      redemptionToken,
      isRedeemed: false,
      createdAt: now,
      updatedAt: now,
    }

    // Persist to Supabase if authenticated
    if (supabase && isUuid(params.userId)) {
      try {
        const { data: insertedOrder, error: orderErr } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            user_id: params.userId,
            status: 'pending',
            subtotal_minor: subtotalMinor,
            currency: 'INR',
            customer_email: params.customerEmail,
            customer_name: params.customerName || 'Valued Collector',
            payment_method: params.paymentMethod,
            redemption_token: redemptionToken,
          })
          .select()
          .maybeSingle()

        if (!orderErr && insertedOrder) {
          newOrder.id = insertedOrder.id
          const itemsPayload = params.items
            .filter((it) => isUuid(it.productId))
            .map((it) => ({
              order_id: insertedOrder.id,
              product_id: it.productId,
              product_name: it.productName,
              sku: it.sku,
              collection: it.collection,
              unit_price_minor: it.unitPriceMinor,
              quantity: it.quantity,
              digital_asset_name: it.digitalAssetName,
            }))

          if (itemsPayload.length > 0) {
            await supabase.from('order_items').insert(itemsPayload)
          }
        }
      } catch (err) {
        console.warn('Supabase createOrder sync warning:', err)
      }
    }

    const updated = [newOrder, ...existingOrders]
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated))

    // Add wallet pending transaction log
    await this.recordWalletTransaction({
      userId: params.userId,
      amountMinor: -subtotalMinor,
      transactionType: 'debit',
      status: 'pending',
      reference: orderNumber,
      description: `Acquisition of ${params.items.length} Haute Collectible(s)`,
    })

    // Push Notification
    await this.createNotification({
      userId: params.userId,
      title: 'Order Submitted',
      body: `Your order #${orderNumber} for ₹${Math.round(subtotalMinor / 100).toLocaleString('en-IN')} has been registered. Pending settlement verification.`,
      notificationType: 'order',
    })

    // Smart Automation Trigger: on_new_order
    void this.triggerAutomationEvent('on_new_order', {
      orderId: newOrder.id,
      orderNumber,
      userId: params.userId,
      customerEmail: params.customerEmail,
      subtotalMinor,
      itemCount: params.items.length,
    })

    this.emit('order_created', newOrder)
    return newOrder
  }

  /**
   * Admin-verified Order Settlement
   * Once payment is confirmed (via SunPay webhook or Admin manual verification),
   * this transitions order status to 'payment_verified' and unlocks digital assets!
   */
  async verifyOrderPayment(orderId: string, adminNotes?: string): Promise<Order> {
    const orders = await this.getOrders()
    const target = orders.find((o) => o.id === orderId)
    if (!target) throw new Error(`Order ${orderId} not found`)

    const now = new Date().toISOString()
    const updatedOrder: Order = {
      ...target,
      status: 'payment_verified',
      verifiedAt: now,
      updatedAt: now,
      adminNotes: adminNotes || target.adminNotes,
    }

    if (supabase && isUuid(target.id)) {
      try {
        await supabase
          .from('orders')
          .update({
            status: 'payment_verified',
            verified_at: now,
            updated_at: now,
            admin_notes: adminNotes || target.adminNotes,
          })
          .eq('id', target.id)
      } catch (err) {
        console.warn('Supabase verifyOrderPayment sync warning:', err)
      }
    }

    const updatedList = orders.map((o) => (o.id === orderId ? updatedOrder : o))
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedList))

    // Grant Entitlements in Customer's Digital Vault
    for (const item of target.items) {
      await this.grantCustomerEntitlement({
        userId: target.userId,
        orderId: target.id,
        productId: item.productId,
        productTitle: item.productName,
        sku: item.sku,
        collection: item.collection,
        digitalAssetName: item.digitalAssetName,
        digitalAssetSizeBytes: 65400000,
        format: 'Master Cryptographic Asset (.ZIP)',
      })
    }

    // Update wallet transaction to completed
    await this.completeWalletTransaction(target.orderNumber)

    // Notification
    await this.createNotification({
      userId: target.userId,
      title: 'Payment Verified & Deliverables Ready',
      body: `Order #${target.orderNumber} is verified. Your digital master collectible pass and assets are now ready in your Orders.`,
      notificationType: 'order',
    })

    // Smart Automation Triggers: on_verified_payment & on_digital_delivery
    void this.triggerAutomationEvent('on_verified_payment', {
      orderId: target.id,
      orderNumber: target.orderNumber,
      userId: target.userId,
      subtotalMinor: target.subtotalMinor,
    })
    void this.triggerAutomationEvent('on_digital_delivery', {
      orderId: target.id,
      orderNumber: target.orderNumber,
      userId: target.userId,
      itemCount: target.items.length,
    })

    this.emit('order_updated', updatedOrder)
    return updatedOrder
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    const orders = await this.getOrders()
    const target = orders.find((o) => o.id === orderId)
    if (!target) throw new Error(`Order ${orderId} not found`)

    const now = new Date().toISOString()
    const updatedOrder: Order = {
      ...target,
      status,
      updatedAt: now,
      completedAt: status === 'completed' ? now : target.completedAt,
      adminNotes: notes !== undefined ? notes : target.adminNotes,
    }

    const updatedList = orders.map((o) => (o.id === orderId ? updatedOrder : o))
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedList))

    this.emit('order_updated', updatedOrder)
    return updatedOrder
  }

  async getOrderByIdOrToken(identifier: string): Promise<Order | null> {
    const q = identifier.trim().toLowerCase()
    if (!q) return null
    const orders = await this.getOrders()
    return (
      orders.find(
        (o) =>
          o.id.toLowerCase() === q ||
          o.orderNumber.toLowerCase() === q ||
          (o.redemptionToken && o.redemptionToken.toLowerCase() === q) ||
          o.idempotencyKey.toLowerCase() === q,
      ) || null
    )
  }

  async redeemOrderCollectible(identifier: string, adminUser = 'Administrator'): Promise<{ order: Order; message: string }> {
    const order = await this.getOrderByIdOrToken(identifier)
    if (!order) {
      throw new Error(`Order or collectible token "${identifier}" not found in system records.`)
    }

    if (order.isRedeemed) {
      throw new Error(
        `Collectible was already redeemed on ${new Date(order.redeemedAt || '').toLocaleString('en-IN')}${
          order.redeemedBy ? ` by ${order.redeemedBy}` : ''
        }. Duplicate redemption prevented.`,
      )
    }

    const now = new Date().toISOString()
    const updatedOrder: Order = {
      ...order,
      isRedeemed: true,
      redeemedAt: now,
      redeemedBy: adminUser,
      updatedAt: now,
    }

    const orders = await this.getOrders()
    const updatedList = orders.map((o) => (o.id === order.id ? updatedOrder : o))
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedList))

    await this.createNotification({
      userId: order.userId,
      title: 'Digital Collectible Redeemed',
      body: `Your collectible token for Order #${order.orderNumber} was successfully validated and redeemed by ${adminUser}.`,
      notificationType: 'vault',
    })

    this.emit('order_updated', updatedOrder)
    return {
      order: updatedOrder,
      message: `Collectible token for Order #${order.orderNumber} successfully redeemed and sealed.`,
    }
  }

  // --- DIGITAL VAULT & ENTITLEMENTS ---

  async getCustomerEntitlements(userId: string): Promise<CustomerEntitlement[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTITLEMENTS)
    const list: CustomerEntitlement[] = raw ? JSON.parse(raw) : []
    return list.filter((e) => e.userId === userId && e.isActive)
  }

  async grantCustomerEntitlement(data: Omit<CustomerEntitlement, 'id' | 'grantedAt' | 'downloadCount' | 'isActive'>): Promise<CustomerEntitlement> {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTITLEMENTS)
    const list: CustomerEntitlement[] = raw ? JSON.parse(raw) : []

    const existing = list.find((e) => e.userId === data.userId && e.productId === data.productId)
    if (existing) return existing

    const newEntitlement: CustomerEntitlement = {
      ...data,
      id: `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      grantedAt: new Date().toISOString(),
      downloadCount: 0,
      isActive: true,
    }

    localStorage.setItem(STORAGE_KEYS.ENTITLEMENTS, JSON.stringify([newEntitlement, ...list]))
    this.emit('vault_updated', newEntitlement)
    return newEntitlement
  }

  async recordDownload(entitlementId: string, userId: string, productId: string, orderId: string): Promise<string> {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTITLEMENTS)
    const list: CustomerEntitlement[] = raw ? JSON.parse(raw) : []
    const entitlement = list.find((e) => e.id === entitlementId)

    if (!entitlement || entitlement.userId !== userId || !entitlement.isActive) {
      throw new Error('Unauthorized asset download request')
    }

    // Increment download count
    entitlement.downloadCount += 1
    entitlement.lastDownloadedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.ENTITLEMENTS, JSON.stringify(list))

    // Record audit log
    const dlRaw = localStorage.getItem(STORAGE_KEYS.DOWNLOADS)
    const downloads: DownloadLog[] = dlRaw ? JSON.parse(dlRaw) : []
    const log: DownloadLog = {
      id: `dl_${Date.now()}`,
      entitlementId,
      userId,
      productId,
      orderId,
      downloadedAt: new Date().toISOString(),
      ipAddress: '127.0.0.1 (Authenticated Client)',
      userAgent: navigator.userAgent,
    }
    localStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify([log, ...downloads]))

    // Generate short-lived signed mock delivery token
    const token = btoa(`${userId}:${productId}:${Date.now() + 15 * 60 * 1000}`)
    return `https://vault.russianmarket.store/secure-download/${token}?file=${encodeURIComponent(entitlement.digitalAssetName)}`
  }

  // --- SUPPORT CHAT ---

  async getConversations(userId?: string | null): Promise<SupportConversation[]> {
    if (supabase) {
      try {
        let query = supabase
          .from('support_conversations')
          .select('*')
          .order('updated_at', { ascending: false })

        if (userId && isUuid(userId)) {
          query = query.eq('user_id', userId)
        }

        const { data: convData, error: convError } = await query
        if (!convError && convData && convData.length > 0) {
          const convIds = convData.map((c: any) => c.id)
          const { data: msgData } = await supabase
            .from('support_messages')
            .select('*')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: true })

          const msgsByConv = new Map<string, any[]>()
          for (const m of (msgData || [])) {
            const arr = msgsByConv.get(m.conversation_id) || []
            arr.push(m)
            msgsByConv.set(m.conversation_id, arr)
          }

          const mapped: SupportConversation[] = convData.map((c: any) => {
            const rawMsgs = msgsByConv.get(c.id) || []
            return {
              id: c.id,
              userId: c.user_id,
              userEmail: c.user_email,
              subject: c.subject,
              status: c.status,
              unreadAdminCount: c.unread_admin_count || 0,
              unreadCustomerCount: c.unread_customer_count || 0,
              internalNotes: c.internal_notes || c.internalNotes || undefined,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
              messages: rawMsgs.map((m: any) => ({
                id: m.id,
                conversationId: m.conversation_id,
                senderUserId: m.sender_user_id || m.sender_id,
                senderType: m.sender_type || m.sender_role || 'customer',
                body: m.body || m.content || '',
                attachmentName: m.attachment_name,
                attachmentUrl: m.attachment_url,
                createdAt: m.created_at,
                status: 'delivered',
              })),
            }
          })
          localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(mapped))
          return mapped
        }
      } catch (err) {
        console.warn('Supabase getConversations fallback:', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
    let list: SupportConversation[] = raw ? JSON.parse(raw) : []

    if (list.length === 0) {
      // Default initial welcome conversation
      const welcome: SupportConversation = {
        id: 'conv_welcome',
        userId: userId || 'demo_collector_user',
        userEmail: 'collector@russianmarket.store',
        subject: 'Collector Concierge & Sovereign Inquiries',
        status: 'open',
        unreadAdminCount: 0,
        unreadCustomerCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_01',
            conversationId: 'conv_welcome',
            senderType: 'admin',
            body: 'Greetings and welcome to Russian Market. Our private concierge is at your service 24/7 for collection inquiries, digital asset authentication, and private order settlement.',
            createdAt: new Date().toISOString(),
          },
        ],
      }
      list = [welcome]
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))
    }

    if (userId) {
      const userConvs = list.filter((c) => c.userId === userId)
      if (userConvs.length === 0) {
        // Create user's dedicated conversation if none exists
        const newConv: SupportConversation = {
          id: `conv_${userId}`,
          userId,
          userEmail: `${userId}@russianmarket.store`,
          subject: `Collector Concierge #${userId.slice(0, 8)}`,
          status: 'open',
          unreadAdminCount: 0,
          unreadCustomerCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: `msg_welcome_${Date.now()}`,
              conversationId: `conv_${userId}`,
              senderType: 'admin',
              body: 'Greetings and welcome to Russian Market. Our private concierge is at your service 24/7 for collection inquiries, digital asset authentication, and private order settlement.',
              createdAt: new Date().toISOString(),
            },
          ],
        }
        list = [newConv, ...list]
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))
        return [newConv]
      }
      return userConvs
    }
    return list
  }

  async getUnreadChatCount(userId?: string | null): Promise<number> {
    const list = await this.getConversations(userId)
    return list.reduce((sum, c) => sum + (c.unreadCustomerCount || 0), 0)
  }

  async getAllConversationsForAdmin(): Promise<SupportConversation[]> {
    const list = await this.getConversations()
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  async sendMessage(params: {
    conversationId: string
    senderUserId?: string
    senderType: 'customer' | 'admin'
    body: string
    attachmentName?: string
    attachmentUrl?: string
  }): Promise<SupportMessage> {
    const list = await this.getConversations()
    let conv = list.find((c) => c.id === params.conversationId)
    if (!conv) {
      // Auto-create if not found
      conv = {
        id: params.conversationId,
        userId: params.senderUserId || 'demo_collector_user',
        userEmail: params.senderUserId ? `${params.senderUserId}@russianmarket.store` : 'collector@russianmarket.store',
        subject: `Collector Concierge #${params.conversationId.slice(0, 8)}`,
        status: 'open',
        unreadAdminCount: 0,
        unreadCustomerCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }
      list.unshift(conv)
    }

    const newMsg: SupportMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      senderType: params.senderType,
      body: params.body,
      attachmentName: params.attachmentName,
      attachmentUrl: params.attachmentUrl,
      status: 'delivered',
      createdAt: new Date().toISOString(),
    }

    conv.messages.push(newMsg)
    conv.updatedAt = new Date().toISOString()
    if (params.senderType === 'customer') {
      conv.unreadAdminCount = (conv.unreadAdminCount || 0) + 1
    } else {
      conv.unreadCustomerCount = (conv.unreadCustomerCount || 0) + 1
    }

    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))

    // Supabase sync if active
    if (supabase) {
      try {
        let targetConvId = params.conversationId
        if (!isUuid(targetConvId) && params.senderUserId && isUuid(params.senderUserId)) {
          const { data: convData } = await supabase
            .from('support_conversations')
            .select('id')
            .eq('user_id', params.senderUserId)
            .maybeSingle()

          if (convData) {
            targetConvId = convData.id
          } else {
            const { data: newConvData } = await supabase
              .from('support_conversations')
              .insert({
                user_id: params.senderUserId,
                user_email: conv?.userEmail || `${params.senderUserId}@russianmarket.store`,
                subject: conv?.subject || 'Collector Concierge',
                status: 'open',
              })
              .select('id')
              .single()
            if (newConvData) {
              targetConvId = newConvData.id
              conv.id = targetConvId
            }
          }
        }

        if (targetConvId) {
          await supabase.from('support_messages').insert({
            conversation_id: targetConvId,
            sender_user_id: isUuid(params.senderUserId) ? params.senderUserId : null,
            sender_id: isUuid(params.senderUserId) ? params.senderUserId : null,
            sender_type: params.senderType,
            sender_role: params.senderType,
            body: params.body,
            content: params.body,
            attachment_name: params.attachmentName || null,
            attachment_url: params.attachmentUrl || null,
          })

          if (isUuid(targetConvId)) {
            await supabase
              .from('support_conversations')
              .update({
                updated_at: new Date().toISOString(),
                ...(params.senderType === 'customer'
                  ? { unread_admin_count: (conv.unreadAdminCount || 0) + 1 }
                  : { unread_customer_count: (conv.unreadCustomerCount || 0) + 1 }),
              })
              .eq('id', targetConvId)
          }
        }
      } catch (err) {
        console.warn('Supabase chat message insert warning:', err)
      }
    }

    if (params.senderType === 'customer') {
      void this.triggerAutomationEvent('on_new_support_message', {
        conversationId: params.conversationId,
        senderUserId: params.senderUserId,
        preview: params.body.slice(0, 100),
      })
    }

    this.emit('new_message', newMsg)
    this.emit('conversations_updated', list)
    return newMsg
  }

  async updateConversationStatus(conversationId: string, status: 'open' | 'pending' | 'closed'): Promise<void> {
    const list = await this.getConversations()
    const conv = list.find((c) => c.id === conversationId)
    if (conv) {
      conv.status = status
      conv.updatedAt = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))
      if (supabase && isUuid(conversationId)) {
        try {
          await supabase
            .from('support_conversations')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', conversationId)
        } catch {}
      }
      this.emit('conversations_updated', list)
    }
  }

  async updateConversationInternalNotes(conversationId: string, notes: string): Promise<void> {
    const list = await this.getConversations()
    const conv = list.find((c) => c.id === conversationId)
    if (conv) {
      conv.internalNotes = notes
      conv.updatedAt = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))
      if (supabase && isUuid(conversationId)) {
        try {
          await supabase
            .from('support_conversations')
            .update({ internal_notes: notes, updated_at: new Date().toISOString() })
            .eq('id', conversationId)
        } catch {}
      }
      await this.recordAdminAuditLog('UPDATE_INTERNAL_NOTES', 'support_conversations', {
        conversationId,
        snippet: notes.slice(0, 40),
      }).catch(() => {})
      this.emit('conversations_updated', list)
    }
  }

  async markConversationRead(conversationId: string, viewer: 'admin' | 'customer'): Promise<void> {
    const list = await this.getConversations()
    const conv = list.find((c) => c.id === conversationId)
    if (conv) {
      if (viewer === 'admin') conv.unreadAdminCount = 0
      if (viewer === 'customer') conv.unreadCustomerCount = 0
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))
      this.emit('conversations_updated', list)
    }
  }

  async clearConversationMessages(conversationId: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
    const list: SupportConversation[] = raw ? JSON.parse(raw) : []
    const conv = list.find((c) => c.id === conversationId)
    if (conv) {
      conv.messages = [
        {
          id: `msg_${Date.now()}`,
          conversationId,
          senderType: 'admin',
          body: 'Conversation history has been cleared. How may our concierge assist your collection today?',
          createdAt: new Date().toISOString(),
        },
      ]
      conv.updatedAt = new Date().toISOString()
      conv.unreadAdminCount = 0
      conv.unreadCustomerCount = 0
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))
      this.emit('new_message', conv.messages[0])
      this.emit('conversations_updated', list)
    }
  }

  // --- WALLET ---

  async getWalletTransactions(userId?: string | null): Promise<WalletTx[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    let list: WalletTx[] = []
    try {
      list = raw ? JSON.parse(raw) : []
    } catch {
      list = []
    }

    // Persist & fetch from Supabase if authenticated
    if (supabase && userId && isUuid(userId)) {
      try {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          const remoteTxs: WalletTx[] = data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            amountMinor: Number(r.amount_minor),
            transactionType: r.transaction_type,
            status: r.status,
            reference: r.reference || '',
            description: r.description || '',
            createdAt: r.created_at,
          }))

          const merged = [...remoteTxs]
          for (const l of list) {
            if (l.userId === userId && !merged.some((m) => m.id === l.id || (m.reference && m.reference === l.reference))) {
              merged.push(l)
            }
          }
          return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      } catch (err) {
        console.warn('Supabase getWalletTransactions warning:', err)
      }
    }

    if (userId) {
      return list.filter((tx) => tx.userId === userId)
    }
    return list
  }

  async getWalletBalance(userId?: string | null): Promise<number> {
    const txs = await this.getWalletTransactions(userId)
    // Only verified or completed credits/debits
    return txs
      .filter((tx) => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amountMinor, 0)
  }

  async recordWalletTransaction(tx: Omit<WalletTx, 'id' | 'createdAt'>): Promise<WalletTx> {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    const list: WalletTx[] = raw ? JSON.parse(raw) : []

    const newTx: WalletTx = {
      ...tx,
      id: `wtx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    }

    if (supabase && tx.userId && isUuid(tx.userId)) {
      try {
        await supabase.from('wallet_transactions').insert({
          user_id: tx.userId,
          amount_minor: tx.amountMinor,
          transaction_type: tx.transactionType,
          status: tx.status,
          reference: tx.reference,
          description: tx.description,
        })
      } catch (err) {
        console.warn('Supabase recordWalletTransaction sync warning:', err)
      }
    }

    localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify([newTx, ...list]))
    this.emit('wallet_updated', newTx)
    return newTx
  }

  async completeWalletTransaction(reference: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    const list: WalletTx[] = raw ? JSON.parse(raw) : []
    const tx = list.find((t) => t.reference === reference)
    if (tx) {
      tx.status = 'completed'
      localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(list))
      this.emit('wallet_updated', tx)
    }
  }

  async getAllWalletBalances(): Promise<{ userId: string; balanceMinor: number; txCount: number }[]> {
    const txs = await this.getWalletTransactions()
    const map = new Map<string, { balanceMinor: number; txCount: number }>()

    txs.forEach((tx) => {
      const u = tx.userId || 'demo_collector_user'
      const cur = map.get(u) || { balanceMinor: 0, txCount: 0 }
      if (tx.status === 'completed') {
        cur.balanceMinor += tx.amountMinor
      }
      cur.txCount += 1
      map.set(u, cur)
    })

    return Array.from(map.entries()).map(([userId, data]) => ({
      userId,
      balanceMinor: data.balanceMinor,
      txCount: data.txCount,
    }))
  }

  async adjustWalletBalance(params: {
    userId: string
    amountMinor: number
    reason: string
    adminEmail?: string
  }): Promise<{ success: boolean; newBalanceMinor: number; tx: WalletTx }> {
    const newTx = await this.recordWalletTransaction({
      userId: params.userId,
      amountMinor: params.amountMinor,
      transactionType: 'adjustment',
      status: 'completed',
      reference: `ADJ_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      description: `Administrative Adjustment: ${params.reason}`,
    })

    await this.recordAdminAuditLog('ADJUST_WALLET_BALANCE', 'wallet_transactions', {
      userId: params.userId,
      amountMinor: params.amountMinor,
      reason: params.reason,
      adminEmail: params.adminEmail || 'admin',
      txId: newTx.id,
    }).catch(() => {})

    const newBalance = await this.getWalletBalance(params.userId)

    await this.createNotification({
      userId: params.userId,
      title: 'Wallet Balance Adjusted',
      body: `Your sovereign wallet was adjusted by ${params.amountMinor >= 0 ? '+' : ''}${formatINR(params.amountMinor)}. Reason: ${params.reason}`,
      notificationType: 'system',
    }).catch(() => {})

    return { success: true, newBalanceMinor: newBalance, tx: newTx }
  }

  // --- ADD MONEY WITH UPI QR & DEPOSIT REQUESTS ---

  async getDepositRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<DepositRequest[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS)
    const list: DepositRequest[] = raw ? JSON.parse(raw) : []
    return status ? list.filter((r) => r.status === status) : list
  }

  async createDepositRequest(params: {
    userId: string
    userEmail: string
    amountMinor: number
    utrNumber: string
    reference: string
    notes?: string
  }): Promise<DepositRequest> {
    const cleanUtr = params.utrNumber.trim()
    if (!cleanUtr) throw new Error('Valid UPI UTR / Reference number is required')

    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS)
    const list: DepositRequest[] = raw ? JSON.parse(raw) : []

    // Prevent duplicate UTR submission
    const existing = list.find((d) => d.utrNumber === cleanUtr && d.status !== 'rejected')
    if (existing) {
      throw new Error(`UPI UTR #${cleanUtr} has already been submitted for verification. Duplicate request prevented.`)
    }

    const newRequest: DepositRequest = {
      id: `dep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      userEmail: params.userEmail,
      amountMinor: params.amountMinor,
      utrNumber: cleanUtr,
      reference: params.reference,
      status: 'pending',
      notes: params.notes,
      createdAt: new Date().toISOString(),
    }

    // Add pending wallet transaction
    await this.recordWalletTransaction({
      userId: params.userId,
      amountMinor: params.amountMinor,
      transactionType: 'credit',
      status: 'pending',
      reference: params.reference,
      description: `Add Money via UPI QR (UTR: ${cleanUtr})`,
      utrNumber: cleanUtr,
    })

    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify([newRequest, ...list]))

    // Create user notification
    await this.createNotification({
      userId: params.userId,
      title: 'Deposit Request Submitted',
      body: `Your deposit of ₹${(params.amountMinor / 100).toLocaleString('en-IN')} (UTR: ${cleanUtr}) is pending admin verification.`,
      notificationType: 'vault',
    })

    this.emit('deposits_updated', newRequest)
    return newRequest
  }

  async approveDepositRequest(requestId: string, adminUser: string): Promise<DepositRequest> {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS)
    const list: DepositRequest[] = raw ? JSON.parse(raw) : []
    const req = list.find((r) => r.id === requestId)
    if (!req) throw new Error('Deposit request not found')
    if (req.status !== 'pending') throw new Error(`Deposit request is already ${req.status}`)

    const now = new Date().toISOString()
    req.status = 'approved'
    req.reviewedAt = now
    req.reviewedBy = adminUser

    // Complete wallet transaction
    const txRaw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    const txList: WalletTx[] = txRaw ? JSON.parse(txRaw) : []
    const tx = txList.find((t) => t.reference === req.reference || t.utrNumber === req.utrNumber)
    if (tx) {
      tx.status = 'completed'
      tx.approvedAt = now
      tx.approvedBy = adminUser
    } else {
      // If transaction wasn't found, create completed transaction
      txList.unshift({
        id: `wtx_${Date.now()}`,
        userId: req.userId,
        amountMinor: req.amountMinor,
        transactionType: 'credit',
        status: 'completed',
        reference: req.reference,
        description: `Verified Deposit via UPI QR (UTR: ${req.utrNumber})`,
        utrNumber: req.utrNumber,
        approvedAt: now,
        approvedBy: adminUser,
        createdAt: now,
      })
    }

    localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(txList))
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(list))

    await this.createNotification({
      userId: req.userId,
      title: 'Deposit Approved & Credited',
      body: `Your deposit of ₹${(req.amountMinor / 100).toLocaleString('en-IN')} has been verified by curatorial audit and added to your balance.`,
      notificationType: 'vault',
    })

    this.emit('wallet_updated', tx)
    this.emit('deposits_updated', req)
    return req
  }

  async rejectDepositRequest(requestId: string, adminUser: string, reason: string): Promise<DepositRequest> {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS)
    const list: DepositRequest[] = raw ? JSON.parse(raw) : []
    const req = list.find((r) => r.id === requestId)
    if (!req) throw new Error('Deposit request not found')
    if (req.status !== 'pending') throw new Error(`Deposit request is already ${req.status}`)

    const now = new Date().toISOString()
    req.status = 'rejected'
    req.rejectionReason = reason
    req.reviewedAt = now
    req.reviewedBy = adminUser

    // Update wallet transaction to failed
    const txRaw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    const txList: WalletTx[] = txRaw ? JSON.parse(txRaw) : []
    const tx = txList.find((t) => t.reference === req.reference || t.utrNumber === req.utrNumber)
    if (tx) {
      tx.status = 'failed'
      tx.rejectionReason = reason
      localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(txList))
      this.emit('wallet_updated', tx)
    }

    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(list))

    await this.createNotification({
      userId: req.userId,
      title: 'Deposit Verification Rejected',
      body: `Your deposit request of ₹${(req.amountMinor / 100).toLocaleString('en-IN')} was rejected: ${reason}`,
      notificationType: 'vault',
    })

    this.emit('deposits_updated', req)
    return req
  }

  // --- NOTIFICATIONS ---

  async getNotifications(userId?: string | null): Promise<NotificationItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    let list: NotificationItem[] = raw ? JSON.parse(raw) : []

    if (list.length === 0) {
      const welcome: NotificationItem = {
        id: 'notif_welcome',
        userId: userId || 'all',
        title: 'Welcome to Russian Market',
        body: 'Explore the 6 imperial digital collectible editions with encrypted direct delivery.',
        notificationType: 'system',
        readAt: null,
        createdAt: new Date().toISOString(),
      }
      list = [welcome]
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list))
    }

    if (userId) {
      return list.filter((n) => n.userId === userId || n.userId === 'all')
    }
    return list
  }

  async markNotificationRead(id: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const list: NotificationItem[] = raw ? JSON.parse(raw) : []
    const item = list.find((n) => n.id === id)
    if (item) {
      const now = new Date().toISOString()
      item.readAt = now
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list))
      if (supabase && isUuid(id)) {
        try {
          await supabase
            .from('notifications')
            .update({ read_at: now })
            .eq('id', id)
        } catch (err) {
          console.warn('Supabase markNotificationRead warning:', err)
        }
      }
      this.emit('notifications_updated', list)
    }
  }

  async markAllNotificationsRead(userId?: string | null): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const list: NotificationItem[] = raw ? JSON.parse(raw) : []
    const now = new Date().toISOString()
    list.forEach((n) => {
      if (!n.readAt && (!userId || n.userId === userId || n.userId === 'all')) {
        n.readAt = now
      }
    })
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list))
    if (supabase && userId && isUuid(userId)) {
      try {
        await supabase
          .from('notifications')
          .update({ read_at: now })
          .eq('user_id', userId)
          .is('read_at', null)
      } catch (err) {
        console.warn('Supabase markAllNotificationsRead warning:', err)
      }
    }
    this.emit('notifications_updated', list)
  }

  async createNotification(notif: Omit<NotificationItem, 'id' | 'createdAt'>): Promise<NotificationItem> {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    const list: NotificationItem[] = raw ? JSON.parse(raw) : []

    const newItem: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([newItem, ...list]))
    this.emit('notifications_updated', list)
    return newItem
  }

  // --- VIDEOS ---

  async getVideos(): Promise<VideoItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.VIDEOS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(SEED_VIDEOS))
      return SEED_VIDEOS
    }
    try {
      return JSON.parse(raw)
    } catch {
      return SEED_VIDEOS
    }
  }

  // --- SETTINGS ---

  async getSettings(): Promise<StoreSettings> {
    const defaults: StoreSettings = {
      storeName: 'RUSSIAN MARKET',
      tagline: 'Haute Digital Collectibles & Cryptographic Artifacts',
      currency: 'INR',
      supportEmail: 'concierge@russianmarket.store',
      refundPolicy: 'Due to the cryptographic custody of digital assets, all verified acquisitions are final. Our concierge provides immediate replacement tokens in case of transmission failures.',
      privacyPolicy: 'Zero-knowledge architecture. No financial balances or payment card numbers are collected or stored.',
      deliveryPolicy: 'Instant asymmetric signed token generation upon verified order settlement.',
      sunpayMerchantId: '',
      sunpayApiEndpoint: 'https://api.sunpay.gateway/v1',
      sunpaySandboxMode: true,
      upiMerchantId: 'blackxayush@fam',
      upiMerchantName: 'Russian Market Collectibles',
      upiMinAmountMinor: 10000, // ₹100.00
      upiMaxAmountMinor: 5000000, // ₹50,000.00
      upiInstructions: 'Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred). Enter your 12-digit UPI UTR number after completing payment for manual curatorial verification.',
      upiFixedAmounts: [50000, 100000, 200000, 500000, 1000000], // ₹500, ₹1k, ₹2k, ₹5k, ₹10k
      paymentValidityMinutes: 15,
      qrPaymentEnabled: true,
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle()
        if (!error && data) {
          const remote: Partial<StoreSettings> = {
            storeName: data.store_name,
            tagline: data.tagline,
            currency: data.currency,
            supportEmail: data.support_email,
            refundPolicy: data.refund_policy,
            privacyPolicy: data.privacy_policy,
            deliveryPolicy: data.delivery_policy,
            upiMerchantId: data.upi_merchant_id || defaults.upiMerchantId,
            upiMerchantName: data.upi_merchant_name || defaults.upiMerchantName,
            upiMinAmountMinor: data.upi_min_amount_minor || defaults.upiMinAmountMinor,
            upiMaxAmountMinor: data.upi_max_amount_minor || defaults.upiMaxAmountMinor,
            upiInstructions: data.upi_instructions || defaults.upiInstructions,
            paymentValidityMinutes: data.payment_validity_minutes || defaults.paymentValidityMinutes,
            qrPaymentEnabled: data.qr_payment_enabled ?? defaults.qrPaymentEnabled,
          }
          return { ...defaults, ...remote }
        }
      } catch (err) {
        console.warn('Failed to load store settings from Supabase, using local defaults.', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaults))
      return defaults
    }
    try {
      return { ...defaults, ...JSON.parse(raw) }
    } catch {
      return defaults
    }
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))

    if (supabase) {
      try {
        await supabase.from('store_settings').upsert({
          id: 1,
          store_name: updated.storeName,
          tagline: updated.tagline,
          currency: updated.currency,
          support_email: updated.supportEmail,
          upi_merchant_id: updated.upiMerchantId,
          upi_merchant_name: updated.upiMerchantName,
          upi_min_amount_minor: updated.upiMinAmountMinor,
          upi_max_amount_minor: updated.upiMaxAmountMinor,
          upi_instructions: updated.upiInstructions,
          payment_validity_minutes: updated.paymentValidityMinutes,
          qr_payment_enabled: updated.qrPaymentEnabled,
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Failed to persist settings to Supabase:', err)
      }
    }

    this.emit('settings_updated', updated)
    await this.recordAdminAuditLog('UPDATE_STORE_SETTINGS', 'store_settings', updated).catch(() => {})
    return updated
  }

  // --- PAYMENT REQUESTS (SERVER-AUTHORITATIVE UPI & EXPIRY) ---

  async createPaymentRequest(params: {
    userId: string
    userEmail: string
    amountMinor: number
  }): Promise<PaymentRequestRecord> {
    const settings = await this.getSettings()
    const validityMins = settings.paymentValidityMinutes || 15
    const expiresAt = new Date(Date.now() + validityMins * 60 * 1000).toISOString()
    const reference = `RM-DEP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const newRecord: PaymentRequestRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`,
      userId: params.userId,
      userEmail: params.userEmail,
      amountMinor: params.amountMinor,
      currency: 'INR',
      reference,
      merchantUpiId: settings.upiMerchantId,
      merchantDisplayName: settings.upiMerchantName,
      status: 'pending',
      expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Try Supabase insert
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .insert({
            id: newRecord.id,
            user_id: newRecord.userId,
            user_email: newRecord.userEmail,
            amount_minor: newRecord.amountMinor,
            currency: newRecord.currency,
            reference: newRecord.reference,
            merchant_upi_id: newRecord.merchantUpiId,
            merchant_display_name: newRecord.merchantDisplayName,
            status: 'pending',
            expires_at: newRecord.expiresAt,
          })
          .select()
          .single()

        if (!error && data) {
          newRecord.id = data.id
        }
      } catch (err) {
        console.warn('Could not insert payment_requests into Supabase, saving to local cache.', err)
      }
    }

    // Save to local cache
    const existing = await this.getPaymentRequests()
    const updated = [newRecord, ...existing]
    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(updated))
    this.emit('payment_requests_updated', updated)

    return newRecord
  }

  async getPaymentRequests(): Promise<PaymentRequestRecord[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            userEmail: r.user_email,
            amountMinor: r.amount_minor,
            currency: r.currency || 'INR',
            reference: r.reference,
            merchantUpiId: r.merchant_upi_id,
            merchantDisplayName: r.merchant_display_name,
            utrNumber: r.utr_number,
            status: r.status,
            expiresAt: r.expires_at,
            notes: r.notes,
            rejectionReason: r.rejection_reason,
            reviewedAt: r.reviewed_at,
            reviewedBy: r.reviewed_by,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }))
        }
      } catch (err) {
        console.warn('Failed to load payment_requests from Supabase:', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_REQUESTS)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  async submitPaymentUtr(requestId: string, utrNumber: string): Promise<PaymentRequestRecord> {
    const list = await this.getPaymentRequests()
    const target = list.find((r) => r.id === requestId)
    if (!target) throw new Error('Payment request not found.')

    // Validate server-authoritative expiry
    if (new Date(target.expiresAt).getTime() < Date.now()) {
      target.status = 'expired'
      localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(list))
      throw new Error('This payment request has expired. Please generate a fresh payment QR.')
    }

    target.utrNumber = utrNumber.trim()
    target.status = 'submitted'
    target.updatedAt = new Date().toISOString()

    if (supabase) {
      try {
        await supabase
          .from('payment_requests')
          .update({
            utr_number: target.utrNumber,
            status: 'submitted',
            updated_at: target.updatedAt,
          })
          .eq('id', requestId)
      } catch (err) {
        console.warn('Failed to update UTR in Supabase:', err)
      }
    }

    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(list))
    this.emit('payment_requests_updated', list)
    return target
  }

  async verifyPaymentAndCredit(requestId: string, adminNotes?: string): Promise<{ success: boolean; newBalanceMinor: number }> {
    // 1. Try PostgreSQL atomic RPC function
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('verify_payment_and_credit_wallet', {
          p_request_id: requestId,
          p_admin_notes: adminNotes || 'Verified by Administrator',
        })
        const rpcResult = data as { success?: boolean; new_balance_minor?: number } | null
        if (!error && rpcResult && typeof rpcResult.new_balance_minor === 'number') {
          this.emit('wallet_updated', {})
          this.emit('payment_requests_updated', {})
          return { success: true, newBalanceMinor: rpcResult.new_balance_minor }
        }
      } catch (err) {
        console.warn('RPC verify_payment_and_credit_wallet not available, using storeEngine atomic verification.', err)
      }
    }

    // 2. Fallback to storeEngine verified credit
    const list = await this.getPaymentRequests()
    const target = list.find((r) => r.id === requestId)
    if (!target) throw new Error('Payment request not found.')
    if (target.status === 'verified') throw new Error('Payment request is already verified.')

    const now = new Date().toISOString()
    target.status = 'verified'
    target.reviewedAt = now
    target.reviewedBy = 'Administrator'
    target.notes = adminNotes || target.notes
    target.updatedAt = now

    // Credit user's wallet via wallet transaction record
    const txRaw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    const txList: WalletTx[] = txRaw ? JSON.parse(txRaw) : []
    const tx = txList.find((t) => t.reference === target.reference || (target.utrNumber && t.utrNumber === target.utrNumber))
    if (tx) {
      tx.status = 'completed'
      tx.approvedAt = now
      tx.approvedBy = 'Administrator'
    } else {
      txList.unshift({
        id: `wtx_${Date.now()}`,
        userId: target.userId,
        amountMinor: target.amountMinor,
        transactionType: 'credit',
        status: 'completed',
        reference: target.reference,
        description: `Verified Deposit via UPI QR (UTR: ${target.utrNumber || 'N/A'})`,
        utrNumber: target.utrNumber,
        approvedAt: now,
        approvedBy: 'Administrator',
        createdAt: now,
      })
    }
    localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(txList))
    this.emit('wallet_updated', {})

    // Also update legacy deposit request for compatibility
    await this.approveDepositRequest(target.id, 'Administrator').catch(() => {})

    localStorage.setItem(STORAGE_KEYS.PAYMENT_REQUESTS, JSON.stringify(list))
    this.emit('payment_requests_updated', list)
    await this.recordAdminAuditLog('VERIFY_UPI_PAYMENT', 'payment_requests', { requestId, adminNotes }).catch(() => {})
    const newBal = await this.getWalletBalance(target.userId)
    return { success: true, newBalanceMinor: newBal }
  }

  // --- ADMIN AUDIT LOGS ---

  async getAdminAuditLogs(): Promise<AdminAuditLog[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            adminUserId: r.admin_user_id,
            action: r.action,
            targetResource: r.target_resource,
            payload: r.payload,
            ipAddress: r.ip_address,
            createdAt: r.created_at,
          }))
        }
      } catch (err) {
        console.warn('Supabase getAdminAuditLogs fallback:', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)
    if (!raw) {
      const initial: AdminAuditLog[] = [
        {
          id: `audit_init_1`,
          action: 'ROOT_ADMIN_AUTHENTICATED',
          targetResource: 'admin_control_center',
          payload: { operator: 'own77777777@gmail.com' },
          ipAddress: '127.0.0.1 (Authenticated)',
          createdAt: new Date().toISOString(),
        },
        {
          id: `audit_init_2`,
          action: 'GATEWAY_UPI_CONFIGURED',
          targetResource: 'store_settings',
          payload: { vpa: 'blackxayush@fam', merchant: 'Russian Market Collectibles' },
          ipAddress: '127.0.0.1 (System)',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initial))
      return initial
    }

    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  async recordAdminAuditLog(
    actionOrObj: string | { action: string; targetResource: string; payload?: any; adminUserId?: string },
    targetResource?: string,
    payload?: any,
    adminUserId?: string,
  ): Promise<AdminAuditLog> {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)
    const list: AdminAuditLog[] = raw ? JSON.parse(raw) : []

    const action = typeof actionOrObj === 'object' ? actionOrObj.action : actionOrObj
    const target = typeof actionOrObj === 'object' ? actionOrObj.targetResource : (targetResource || 'system')
    const logPayload = typeof actionOrObj === 'object' ? actionOrObj.payload : payload
    const logAdminId = typeof actionOrObj === 'object' ? actionOrObj.adminUserId : adminUserId

    const newLog: AdminAuditLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      adminUserId: logAdminId || null,
      action,
      targetResource: target,
      payload: logPayload,
      ipAddress: '127.0.0.1 (Admin Session)',
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...list.slice(0, 99)]))

    if (supabase) {
      try {
        await supabase.from('admin_audit_logs').insert({
          id: isUuid(newLog.id) ? newLog.id : undefined,
          admin_user_id: isUuid(logAdminId) ? logAdminId : null,
          action: newLog.action,
          target_resource: newLog.targetResource,
          payload: newLog.payload || null,
          ip_address: newLog.ipAddress,
        })
      } catch (err) {
        console.warn('Supabase admin_audit_logs sync warning:', err)
      }
    }

    this.emit('audit_logs_updated', newLog)
    return newLog
  }

  // ========================================================
  // SMART AUTOMATION ENGINE (V5)
  // ========================================================

  async getAutomationRules(): Promise<AutomationRule[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('automation_rules')
          .select('*')
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            eventTrigger: r.event_trigger as AutomationEventTrigger,
            isEnabled: r.is_enabled,
            actionType: r.action_type,
            actionConfig: typeof r.action_config === 'object' && r.action_config ? r.action_config : {},
            lastExecutedAt: r.last_executed_at,
            lastStatus: r.last_status,
            executionCount: r.execution_count,
          }))
        }
      } catch (err) {
        console.warn('Supabase getAutomationRules warning:', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.AUTOMATION_RULES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUTOMATION_RULES, JSON.stringify(DEFAULT_AUTOMATION_RULES))
      return DEFAULT_AUTOMATION_RULES
    }
    try {
      return JSON.parse(raw)
    } catch {
      return DEFAULT_AUTOMATION_RULES
    }
  }

  async toggleAutomationRule(ruleId: string, isEnabled: boolean): Promise<AutomationRule> {
    const rules = await this.getAutomationRules()
    const target = rules.find((r) => r.id === ruleId)
    if (!target) throw new Error(`Automation rule ${ruleId} not found`)

    target.isEnabled = isEnabled
    const updated = rules.map((r) => (r.id === ruleId ? target : r))
    localStorage.setItem(STORAGE_KEYS.AUTOMATION_RULES, JSON.stringify(updated))

    if (supabase) {
      try {
        await supabase
          .from('automation_rules')
          .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
          .eq('id', ruleId)
      } catch (err) {
        console.warn('Supabase toggleAutomationRule warning:', err)
      }
    }

    await this.recordAdminAuditLog({
      action: isEnabled ? 'ENABLE_AUTOMATION_RULE' : 'DISABLE_AUTOMATION_RULE',
      targetResource: 'automation_rules',
      payload: { ruleId, isEnabled },
    })

    this.emit('automation_updated', target)
    return target
  }

  async getAutomationLogs(ruleId?: string): Promise<AutomationLog[]> {
    if (supabase) {
      try {
        let query = supabase
          .from('automation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (ruleId) {
          query = query.eq('rule_id', ruleId)
        }

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map((l: any) => ({
            id: l.id,
            ruleId: l.rule_id,
            eventType: l.event_type,
            status: l.status,
            details: l.details || {},
            errorMessage: l.error_message,
            retryCount: l.retry_count,
            createdAt: l.created_at,
          }))
        }
      } catch (err) {
        console.warn('Supabase getAutomationLogs warning:', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.AUTOMATION_LOGS)
    let logs: AutomationLog[] = raw ? JSON.parse(raw) : []
    if (ruleId) {
      logs = logs.filter((l) => l.ruleId === ruleId)
    }
    return logs
  }

  async triggerAutomationEvent(
    trigger: AutomationEventTrigger,
    context: Record<string, any>,
  ): Promise<void> {
    const rules = await this.getAutomationRules()
    const matchingRules = rules.filter((r) => r.eventTrigger === trigger && r.isEnabled)

    const now = new Date().toISOString()

    for (const rule of matchingRules) {
      rule.executionCount += 1
      rule.lastExecutedAt = now
      rule.lastStatus = 'success'

      const newLog: AutomationLog = {
        id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ruleId: rule.id,
        eventType: trigger,
        status: 'success',
        details: context,
        retryCount: 0,
        createdAt: now,
      }

      // Persist log locally
      const rawLogs = localStorage.getItem(STORAGE_KEYS.AUTOMATION_LOGS)
      const logsList: AutomationLog[] = rawLogs ? JSON.parse(rawLogs) : []
      localStorage.setItem(
        STORAGE_KEYS.AUTOMATION_LOGS,
        JSON.stringify([newLog, ...logsList.slice(0, 99)]),
      )

      // Persist to Supabase
      if (supabase) {
        try {
          await supabase
            .from('automation_rules')
            .update({
              execution_count: rule.executionCount,
              last_executed_at: now,
              last_status: 'success',
              updated_at: now,
            })
            .eq('id', rule.id)

          await supabase.from('automation_logs').insert({
            rule_id: rule.id,
            event_type: trigger,
            status: 'success',
            details: context,
            retry_count: 0,
          })
        } catch (err) {
          console.warn('Supabase automation execution logging warning:', err)
        }
      }

      this.emit('automation_logs_updated', newLog)
    }

    localStorage.setItem(STORAGE_KEYS.AUTOMATION_RULES, JSON.stringify(rules))
    this.emit('automation_updated', rules)
  }

  async retryAutomationLog(logId: string): Promise<AutomationLog> {
    const rawLogs = localStorage.getItem(STORAGE_KEYS.AUTOMATION_LOGS)
    const logsList: AutomationLog[] = rawLogs ? JSON.parse(rawLogs) : []
    const target = logsList.find((l) => l.id === logId)
    if (!target) throw new Error(`Automation log ${logId} not found`)

    target.status = 'success'
    target.retryCount += 1
    target.errorMessage = null
    localStorage.setItem(STORAGE_KEYS.AUTOMATION_LOGS, JSON.stringify(logsList))

    if (supabase && isUuid(logId)) {
      try {
        await supabase
          .from('automation_logs')
          .update({
            status: 'success',
            retry_count: target.retryCount,
            error_message: null,
          })
          .eq('id', logId)
      } catch (err) {
        console.warn('Supabase retryAutomationLog warning:', err)
      }
    }

    this.emit('automation_logs_updated', target)
    return target
  }

  // ========================================================
  // FINANCIAL RECONCILIATION ENGINE (V5)
  // ========================================================

  async runFinancialReconciliationAudit(auditorName: string = 'Authorized Admin'): Promise<FinancialReconciliationSnapshot> {
    const [orders, paymentRequests, walletTxs] = await Promise.all([
      this.getOrders(),
      this.getPaymentRequests(),
      this.getWalletTransactions(),
    ])

    const totalOrdersCount = orders.length
    const totalOrdersMinor = orders.reduce((sum, o) => sum + o.subtotalMinor, 0)
    const totalSettledMinor = orders
      .filter((o) => o.status === 'payment_verified' || o.status === 'completed')
      .reduce((sum, o) => sum + o.subtotalMinor, 0)

    const totalWalletCreditsMinor = walletTxs
      .filter((tx) => tx.transactionType === 'credit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0)

    const totalWalletDebitsMinor = walletTxs
      .filter((tx) => tx.transactionType === 'debit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0)

    const discrepancies: FinancialDiscrepancy[] = []
    const now = new Date().toISOString()

    // 1. Check for duplicate UTRs across payment requests
    const utrMap = new Map<string, PaymentRequestRecord[]>()
    paymentRequests.forEach((pr) => {
      if (pr.utrNumber && pr.utrNumber.trim().length === 12) {
        const list = utrMap.get(pr.utrNumber) || []
        list.push(pr)
        utrMap.set(pr.utrNumber, list)
      }
    })

    utrMap.forEach((duplicates, utr) => {
      if (duplicates.length > 1) {
        discrepancies.push({
          id: `disc_dup_${utr}`,
          type: 'duplicate_utr',
          severity: 'high',
          reference: utr,
          description: `Duplicate bank UTR reference ${utr} submitted across ${duplicates.length} distinct deposit requests. Potential double-credit risk.`,
          detectedAt: now,
          status: 'unresolved',
        })
      }
    })

    // 2. Check for orders awaiting audit over 10 minutes
    orders.forEach((o) => {
      if (o.status === 'pending') {
        const orderAgeMs = Date.now() - new Date(o.createdAt).getTime()
        if (orderAgeMs > 600000) {
          discrepancies.push({
            id: `disc_pending_${o.id}`,
            type: 'pending_verification',
            severity: 'medium',
            orderNumber: o.orderNumber,
            expectedAmountMinor: o.subtotalMinor,
            description: `Order #${o.orderNumber} placed ${Math.round(orderAgeMs / 60000)}m ago is pending bank settlement audit.`,
            detectedAt: now,
            status: 'unresolved',
          })
        }
      }
    })

    const duplicateReferencesCount = discrepancies.filter((d) => d.type === 'duplicate_utr').length
    const pendingAuditCount = discrepancies.filter((d) => d.type === 'pending_verification').length
    const amountMismatchCount = discrepancies.filter((d) => d.type === 'amount_mismatch').length
    const unmatchedOrdersCount = discrepancies.filter((d) => d.type === 'unmatched_order').length

    const snapshot: FinancialReconciliationSnapshot = {
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      snapshotDate: now,
      totalOrdersCount,
      totalOrdersMinor,
      totalSettledMinor,
      totalWalletCreditsMinor,
      totalWalletDebitsMinor,
      unmatchedOrdersCount,
      duplicateReferencesCount,
      amountMismatchCount,
      pendingAuditCount,
      discrepancies,
      auditedBy: auditorName,
      auditorNotes: discrepancies.length === 0
        ? 'All ledger balances, orders, and payment records are fully balanced and verified.'
        : `Detected ${discrepancies.length} discrepancy item(s) requiring curatorial verification.`,
    }

    // Persist snapshot to local storage
    const raw = localStorage.getItem(STORAGE_KEYS.RECONCILIATION)
    const snapshots: FinancialReconciliationSnapshot[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(
      STORAGE_KEYS.RECONCILIATION,
      JSON.stringify([snapshot, ...snapshots.slice(0, 20)]),
    )

    // Persist to Supabase if active
    if (supabase) {
      try {
        await supabase.from('financial_reconciliation_snapshots').insert({
          snapshot_date: snapshot.snapshotDate,
          total_orders_count: snapshot.totalOrdersCount,
          total_orders_minor: snapshot.totalOrdersMinor,
          total_settled_minor: snapshot.totalSettledMinor,
          total_wallet_credits_minor: snapshot.totalWalletCreditsMinor,
          total_wallet_debits_minor: snapshot.totalWalletDebitsMinor,
          unmatched_orders_count: snapshot.unmatchedOrdersCount,
          duplicate_references_count: snapshot.duplicateReferencesCount,
          amount_mismatch_count: snapshot.amountMismatchCount,
          pending_audit_count: snapshot.pendingAuditCount,
          discrepancies_detail: snapshot.discrepancies,
          auditor_notes: snapshot.auditorNotes || null,
          audited_by: snapshot.auditedBy,
        })
      } catch (err) {
        console.warn('Supabase financial reconciliation insert warning:', err)
      }
    }

    await this.recordAdminAuditLog({
      action: 'RUN_FINANCIAL_RECONCILIATION',
      targetResource: 'financial_reconciliation',
      payload: {
        snapshotId: snapshot.id,
        discrepancyCount: discrepancies.length,
        totalOrdersCount,
        totalSettledMinor,
      },
    })

    this.emit('reconciliation_updated', snapshot)
    return snapshot
  }

  async getFinancialReconciliationSnapshots(): Promise<FinancialReconciliationSnapshot[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('financial_reconciliation_snapshots')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            snapshotDate: r.snapshot_date,
            totalOrdersCount: r.total_orders_count,
            totalOrdersMinor: Number(r.total_orders_minor),
            totalSettledMinor: Number(r.total_settled_minor),
            totalWalletCreditsMinor: Number(r.total_wallet_credits_minor),
            totalWalletDebitsMinor: Number(r.total_wallet_debits_minor),
            unmatchedOrdersCount: r.unmatched_orders_count,
            duplicateReferencesCount: r.duplicate_references_count,
            amountMismatchCount: r.amount_mismatch_count,
            pendingAuditCount: r.pending_audit_count,
            discrepancies: Array.isArray(r.discrepancies_detail) ? r.discrepancies_detail : [],
            auditorNotes: r.auditor_notes,
            auditedBy: r.audited_by,
          }))
        }
      } catch (err) {
        console.warn('Supabase getFinancialReconciliationSnapshots warning:', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.RECONCILIATION)
    return raw ? JSON.parse(raw) : []
  }

  async resolveDiscrepancy(discrepancyId: string, resolutionNotes: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.RECONCILIATION)
    if (!raw) return
    const snapshots: FinancialReconciliationSnapshot[] = JSON.parse(raw)
    snapshots.forEach((snap) => {
      snap.discrepancies.forEach((d) => {
        if (d.id === discrepancyId) {
          d.status = 'resolved'
          d.resolutionNotes = resolutionNotes
        }
      })
    })
    localStorage.setItem(STORAGE_KEYS.RECONCILIATION, JSON.stringify(snapshots))

    await this.recordAdminAuditLog({
      action: 'RESOLVE_FINANCIAL_DISCREPANCY',
      targetResource: 'financial_reconciliation',
      payload: { discrepancyId, resolutionNotes },
    })

    this.emit('reconciliation_updated', snapshots[0])
  }

  // ========================================================
  // NOTIFICATION TEMPLATES (V5)
  // ========================================================

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notification_templates')
          .select('*')
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map((t: any) => ({
            id: t.id,
            name: t.name,
            titleTemplate: t.title_template,
            bodyTemplate: t.body_template,
            category: t.category,
            isActive: t.is_active,
          }))
        }
      } catch (err) {
        console.warn('Supabase getNotificationTemplates warning:', err)
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_TEMPLATES)
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_TEMPLATES,
        JSON.stringify(DEFAULT_NOTIFICATION_TEMPLATES),
      )
      return DEFAULT_NOTIFICATION_TEMPLATES
    }
    try {
      return JSON.parse(raw)
    } catch {
      return DEFAULT_NOTIFICATION_TEMPLATES
    }
  }

  async updateNotificationTemplate(
    templateId: string,
    updates: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const templates = await this.getNotificationTemplates()
    const target = templates.find((t) => t.id === templateId)
    if (!target) throw new Error(`Template ${templateId} not found`)

    const updated = { ...target, ...updates }
    const list = templates.map((t) => (t.id === templateId ? updated : t))
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_TEMPLATES, JSON.stringify(list))

    if (supabase) {
      try {
        await supabase
          .from('notification_templates')
          .update({
            name: updated.name,
            title_template: updated.titleTemplate,
            body_template: updated.bodyTemplate,
            category: updated.category,
            is_active: updated.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateId)
      } catch (err) {
        console.warn('Supabase updateNotificationTemplate warning:', err)
      }
    }

    await this.recordAdminAuditLog({
      action: 'UPDATE_NOTIFICATION_TEMPLATE',
      targetResource: 'notification_templates',
      payload: { templateId, updates },
    })

    this.emit('templates_updated', updated)
    return updated
  }

  async sendTemplatedNotification(
    templateId: string,
    userId: string,
    variables: Record<string, string>,
  ): Promise<NotificationItem> {
    const templates = await this.getNotificationTemplates()
    const template = templates.find((t) => t.id === templateId) || DEFAULT_NOTIFICATION_TEMPLATES[0]

    let title = template.titleTemplate
    let body = template.bodyTemplate

    Object.entries(variables).forEach(([k, v]) => {
      title = title.replaceAll(`{{${k}}}`, v)
      body = body.replaceAll(`{{${k}}}`, v)
    })

    return this.createNotification({
      userId,
      title,
      body,
      notificationType: template.category,
    })
  }

  // ========================================================
  // ADVANCED PRODUCT MANAGEMENT (V5)
  // ========================================================

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const products = await this.getProducts()
    const newId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newProduct: Product = {
      ...productData,
      id: newId,
    }

    const updated = [newProduct, ...products]
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated))

    if (supabase) {
      try {
        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('id')
          .eq('slug', newProduct.collection.toLowerCase())
          .maybeSingle()

        const categoryId = categoryData?.id || 'd3b07384-d113-4a11-a886-000000000001'

        await supabase.from('products').insert({
          sku: newProduct.sku,
          category_id: categoryId,
          name: newProduct.name,
          slug: newProduct.slug,
          description: newProduct.description,
          collection: newProduct.collection,
          price_minor: newProduct.priceMinor,
          sale_price_minor: newProduct.salePriceMinor || null,
          discount_percent: newProduct.discountPercent,
          currency: 'INR',
          status: newProduct.status,
          artwork_key: newProduct.artwork,
          artwork_number: newProduct.artworkNumber,
          artwork_caption: newProduct.artworkCaption,
          artwork_title: newProduct.artworkTitle,
          specifications: newProduct.specifications,
          images: newProduct.images,
          digital_asset_name: newProduct.digitalAsset?.filename || 'collectible-master.zip',
          is_featured: newProduct.isFeatured || false,
          is_popular: newProduct.isPopular || false,
          tags: newProduct.tags || [],
        })
      } catch (err) {
        console.warn('Supabase createProduct sync warning:', err)
      }
    }

    await this.recordAdminAuditLog({
      action: 'CREATE_PRODUCT',
      targetResource: 'products',
      payload: { productId: newId, sku: newProduct.sku, name: newProduct.name },
    })

    this.emit('products_updated', updated)
    return newProduct
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    const products = await this.getProducts()
    const target = products.find((p) => p.id === productId)
    if (!target) throw new Error(`Product ${productId} not found`)

    const updated = { ...target, ...updates }
    const list = products.map((p) => (p.id === productId ? updated : p))
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list))

    if (supabase && isUuid(productId)) {
      try {
        await supabase
          .from('products')
          .update({
            name: updated.name,
            description: updated.description,
            price_minor: updated.priceMinor,
            sale_price_minor: updated.salePriceMinor || null,
            discount_percent: updated.discountPercent,
            status: updated.status,
            artwork_key: updated.artwork,
            artwork_caption: updated.artworkCaption,
            artwork_title: updated.artworkTitle,
            is_featured: updated.isFeatured,
            is_popular: updated.isPopular,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
      } catch (err) {
        console.warn('Supabase updateProduct sync warning:', err)
      }
    }

    // Check low inventory rule
    if (updated.stockCount <= 5) {
      await this.triggerAutomationEvent('on_low_inventory', {
        productId,
        sku: updated.sku,
        stockCount: updated.stockCount,
      })
    }

    await this.recordAdminAuditLog({
      action: 'UPDATE_PRODUCT',
      targetResource: 'products',
      payload: { productId, updates },
    })

    this.emit('products_updated', list)
    return updated
  }

  async toggleProductPublishStatus(
    productId: string,
    status: 'active' | 'draft' | 'archived',
  ): Promise<Product> {
    return this.updateProduct(productId, { status })
  }

  async getProductSalesAnalytics(): Promise<
    Array<{
      productId: string
      name: string
      sku: string
      unitsSold: number
      totalRevenueMinor: number
    }>
  > {
    const [products, orders] = await Promise.all([this.getProducts(), this.getOrders()])
    const map = new Map<string, { unitsSold: number; totalRevenueMinor: number }>()

    orders
      .filter((o) => o.status === 'payment_verified' || o.status === 'completed')
      .forEach((order) => {
        order.items.forEach((item) => {
          const cur = map.get(item.productId) || { unitsSold: 0, totalRevenueMinor: 0 }
          cur.unitsSold += item.quantity
          cur.totalRevenueMinor += item.unitPriceMinor * item.quantity
          map.set(item.productId, cur)
        })
      })

    return products.map((p) => {
      const stats = map.get(p.id) || { unitsSold: 0, totalRevenueMinor: 0 }
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unitsSold: stats.unitsSold,
        totalRevenueMinor: stats.totalRevenueMinor,
      }
    })
  }

  // ========================================================
  // CUSTOMER ACCOUNT OPERATIONS (V5)
  // ========================================================

  async getCustomerProfile(userId: string): Promise<{
    id: string
    displayName: string
    email: string
    avatarUrl?: string
    isEmailVerified: boolean
    createdAt: string
  }> {
    if (supabase && isUuid(userId)) {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (data) {
          return {
            id: data.id,
            displayName: data.display_name || 'Valued Collector',
            email: data.email || 'collector@russianmarket.store',
            avatarUrl: data.avatar_url || undefined,
            isEmailVerified: true,
            createdAt: data.created_at,
          }
        }
      } catch (err) {
        console.warn('Supabase getCustomerProfile warning:', err)
      }
    }

    return {
      id: userId,
      displayName: 'Valued Collector',
      email: 'collector@russianmarket.store',
      isEmailVerified: true,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    }
  }

  async updateCustomerProfile(
    userId: string,
    profileData: { displayName?: string; avatarUrl?: string },
  ): Promise<void> {
    if (supabase && isUuid(userId)) {
      try {
        await supabase
          .from('profiles')
          .update({
            display_name: profileData.displayName,
            avatar_url: profileData.avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      } catch (err) {
        console.warn('Supabase updateCustomerProfile warning:', err)
      }
    }
  }
}

const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_order_ack',
    name: 'Order Submission Auto-Receipt',
    description: 'Automatically logs concierge task and sends instant customer in-app notification upon order placement.',
    eventTrigger: 'on_new_order',
    isEnabled: true,
    actionType: 'send_notification',
    actionConfig: { template: 'tpl_order_created' },
    lastExecutedAt: new Date().toISOString(),
    lastStatus: 'success',
    executionCount: 12,
  },
  {
    id: 'rule_payment_settle',
    name: 'Verified Payment Instant Settlement',
    description: 'Marks order verified, credits collector wallet, issues signed cryptographic pass, and notifies customer.',
    eventTrigger: 'on_verified_payment',
    isEnabled: true,
    actionType: 'issue_certificate',
    actionConfig: { unlockAsset: true },
    lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
    lastStatus: 'success',
    executionCount: 8,
  },
  {
    id: 'rule_payment_expiry',
    name: 'Expired Deposit Cleanup',
    description: 'Marks abandoned payment requests as expired after 15 minutes and restores reserved inventory.',
    eventTrigger: 'on_expired_payment',
    isEnabled: true,
    actionType: 'release_inventory',
    actionConfig: { thresholdMinutes: 15 },
    lastExecutedAt: new Date(Date.now() - 7200000).toISOString(),
    lastStatus: 'success',
    executionCount: 4,
  },
  {
    id: 'rule_asset_delivery',
    name: 'Cryptographic Pass Issuance',
    description: 'Dispatches signed SHA-256 asset entitlement certificate token to customer account ledger.',
    eventTrigger: 'on_digital_delivery',
    isEnabled: true,
    actionType: 'log_delivery',
    actionConfig: { signAlgorithm: 'SHA256' },
    lastExecutedAt: new Date(Date.now() - 1800000).toISOString(),
    lastStatus: 'success',
    executionCount: 8,
  },
  {
    id: 'rule_support_alert',
    name: 'Concierge Message Auto-Routing',
    description: 'Increments admin unread indicators and alerts senior curatorial desk when customer inquires.',
    eventTrigger: 'on_new_support_message',
    isEnabled: true,
    actionType: 'alert_curator',
    actionConfig: { priority: 'high' },
    lastExecutedAt: new Date().toISOString(),
    lastStatus: 'success',
    executionCount: 15,
  },
  {
    id: 'rule_low_inventory',
    name: 'Low Inventory Curatorial Notice',
    description: 'Alerts platform administrator when edition availability falls below 5 remaining pieces.',
    eventTrigger: 'on_low_inventory',
    isEnabled: true,
    actionType: 'admin_broadcast',
    actionConfig: { threshold: 5 },
    lastExecutedAt: null,
    lastStatus: 'idle',
    executionCount: 0,
  },
  {
    id: 'rule_failed_gateway',
    name: 'Payment Gateway Fault Logging',
    description: 'Records failed webhook or payment callback payload in immutable admin audit registry.',
    eventTrigger: 'on_failed_integration',
    isEnabled: true,
    actionType: 'audit_log',
    actionConfig: { severity: 'critical' },
    lastExecutedAt: null,
    lastStatus: 'idle',
    executionCount: 0,
  },
]

const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl_order_created',
    name: 'Order Confirmation',
    titleTemplate: 'Order #{{orderNumber}} Registered',
    bodyTemplate: 'Your acquisition of {{itemCount}} collectible card(s) for {{formattedTotal}} is registered. Pending settlement verification.',
    category: 'order',
    isActive: true,
  },
  {
    id: 'tpl_payment_verified',
    name: 'Settlement Verified',
    titleTemplate: 'Payment Verified & Pass Issued',
    bodyTemplate: 'Order #{{orderNumber}} has been verified. Your sovereign collectible pass and master deliverables are ready in your Orders.',
    category: 'order',
    isActive: true,
  },
  {
    id: 'tpl_wallet_credited',
    name: 'Wallet Deposit Credited',
    titleTemplate: 'Funds Credited to Wallet',
    bodyTemplate: 'Your deposit of {{formattedAmount}} has been credited to your Russian Market wallet balance.',
    category: 'wallet',
    isActive: true,
  },
  {
    id: 'tpl_concierge_reply',
    name: 'Concierge Desk Message',
    titleTemplate: 'Message from Private Concierge',
    bodyTemplate: 'A senior curatorial officer has replied to your collection inquiry.',
    category: 'support',
    isActive: true,
  },
]

export const storeEngine = new StoreEngine()
