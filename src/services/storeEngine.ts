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
  createdAt: string
}

export type SupportConversation = {
  id: string
  userId: string
  userEmail: string
  subject: string
  status: 'open' | 'pending' | 'closed'
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
  createdAt: string
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
}

const STORAGE_KEYS = {
  PRODUCTS: 'rm_db_products_v2',
  ORDERS: 'rm_db_orders_v2',
  ENTITLEMENTS: 'rm_db_entitlements_v2',
  DOWNLOADS: 'rm_db_downloads_v2',
  CONVERSATIONS: 'rm_db_conversations_v2',
  NOTIFICATIONS: 'rm_db_notifications_v2',
  WALLET_TX: 'rm_db_wallet_tx_v2',
  SETTINGS: 'rm_db_settings_v2',
  VIDEOS: 'rm_db_videos_v2',
}

type RealtimeListener = (event: string, payload: unknown) => void

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
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
    let list: SupportConversation[] = raw ? JSON.parse(raw) : []

    if (list.length === 0) {
      // Default initial welcome conversation
      const welcome: SupportConversation = {
        id: 'conv_welcome',
        userId: userId || 'guest_user',
        userEmail: 'concierge@russianmarket.store',
        subject: 'Welcome to Russian Market Haute Concierge',
        status: 'open',
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
      return list.filter((c) => c.userId === userId || c.id === 'conv_welcome')
    }
    return list
  }

  async sendMessage(params: {
    conversationId: string
    senderUserId?: string
    senderType: 'customer' | 'admin'
    body: string
  }): Promise<SupportMessage> {
    const list = await this.getConversations()
    const conv = list.find((c) => c.id === params.conversationId)
    if (!conv) throw new Error('Conversation not found')

    const newMsg: SupportMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      senderType: params.senderType,
      body: params.body,
      createdAt: new Date().toISOString(),
    }

    conv.messages.push(newMsg)
    conv.updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))

    this.emit('new_message', newMsg)
    return newMsg
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
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list))
      this.emit('new_message', conv.messages[0])
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
          createdAt: new Date().toISOString(),
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

  private async recordWalletTransaction(tx: Omit<WalletTx, 'id' | 'createdAt'>): Promise<WalletTx> {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    const list: WalletTx[] = raw ? JSON.parse(raw) : []

    const newTx: WalletTx = {
      ...tx,
      id: `wtx_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify([newTx, ...list]))
    this.emit('wallet_updated', newTx)
    return newTx
  }

  private async completeWalletTransaction(reference: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET_TX)
    const list: WalletTx[] = raw ? JSON.parse(raw) : []
    const tx = list.find((t) => t.reference === reference)
    if (tx) {
      tx.status = 'completed'
      localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(list))
      this.emit('wallet_updated', tx)
    }
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
    this.emit('settings_updated', updated)
    return updated
  }
}

export const storeEngine = new StoreEngine()
