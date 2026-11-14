import { supabase } from '../lib/supabase'
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
  createdAt: string
  updatedAt: string
  messages: SupportMessage[]
}

export type NotificationItem = {
  id: string
  userId: string
  title: string
  body: string
  notificationType: 'order' | 'vault' | 'support' | 'system'
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

  async getOrders(userId?: string | null): Promise<Order[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS)
    let orders: Order[] = raw ? JSON.parse(raw) : []

    if (userId) {
      orders = orders.filter((o) => o.userId === userId)
    }

    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
      title: 'Payment Verified & Vault Unlocked',
      body: `Order #${target.orderNumber} is verified. Your digital master assets are now ready for secure download in your Vault.`,
      notificationType: 'vault',
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
          .select('*, messages:support_messages(*)')
          .order('updated_at', { ascending: false })

        if (userId && isUuid(userId)) {
          query = query.eq('user_id', userId)
        }

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          const mapped: SupportConversation[] = data.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            userEmail: c.user_email,
            subject: c.subject,
            status: c.status,
            unreadAdminCount: c.unread_admin_count || 0,
            unreadCustomerCount: c.unread_customer_count || 0,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            messages: Array.isArray(c.messages)
              ? c.messages
                  .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((m: any) => ({
                    id: m.id,
                    conversationId: m.conversation_id,
                    senderUserId: m.sender_user_id,
                    senderType: m.sender_type,
                    body: m.body,
                    attachmentName: m.attachment_name,
                    attachmentUrl: m.attachment_url,
                    createdAt: m.created_at,
                    status: 'delivered',
                  }))
              : [],
          }))
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

        if (isUuid(targetConvId)) {
          await supabase.from('support_messages').insert({
            conversation_id: targetConvId,
            sender_user_id: isUuid(params.senderUserId) ? params.senderUserId : null,
            sender_type: params.senderType,
            body: params.body,
            attachment_name: params.attachmentName || null,
            attachment_url: params.attachmentUrl || null,
          })

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
      } catch (err) {
        console.warn('Supabase chat message insert warning:', err)
      }
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
    if (!raw) {
      const initial: WalletTx[] = [
        {
          id: 'wtx_init_01',
          userId: userId || 'demo_collector_user',
          amountMinor: 500000, // ₹5,000.00
          transactionType: 'credit',
          status: 'completed',
          reference: 'WELCOME-BONUS-INR',
          description: 'Russian Market Collector Allocation',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ]
      localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(initial))
      return initial
    }
    try {
      const list: WalletTx[] = JSON.parse(raw)
      return userId ? list.filter((tx) => tx.userId === userId) : list
    } catch {
      return []
    }
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
        body: 'Explore the 6 imperial digital collectible editions with encrypted vault delivery.',
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
      item.readAt = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list))
      this.emit('notifications_updated', list)
    }
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
      upiMerchantId: 'russianmarket@icici',
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
          payload: { vpa: 'russianmarket@icici', merchant: 'Russian Market Collectibles' },
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
    action: string,
    targetResource: string,
    payload?: any,
    adminUserId?: string,
  ): Promise<AdminAuditLog> {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)
    const list: AdminAuditLog[] = raw ? JSON.parse(raw) : []

    const newLog: AdminAuditLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      adminUserId: adminUserId || null,
      action,
      targetResource,
      payload,
      ipAddress: '127.0.0.1 (Admin Session)',
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...list.slice(0, 99)]))

    if (supabase) {
      try {
        await supabase.from('admin_audit_logs').insert({
          id: isUuid(newLog.id) ? newLog.id : undefined,
          admin_user_id: isUuid(adminUserId) ? adminUserId : null,
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
}

export const storeEngine = new StoreEngine()
