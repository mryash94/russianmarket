import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from '../components/Header'
import { Navigation, type AppSection } from '../components/Navigation'
import { CatalogPage } from '../features/catalog/CatalogPage'
import { ProductDetailsDialog } from '../features/catalog/ProductDetailsDialog'
import { CartDrawer } from '../features/commerce/CartDrawer'
import { CheckoutModal } from '../features/commerce/CheckoutModal'
import { MyOrdersModal } from '../features/orders/MyOrdersModal'
import { DigitalVaultModal } from '../features/vault/DigitalVaultModal'
import { VideoSection } from '../features/video/VideoSection'
import { ChatSection } from '../features/chat/ChatSection'
import { WalletSection } from '../features/wallet/WalletSection'
import { SettingsSection } from '../features/settings/SettingsSection'
import { AdminDashboard } from '../features/admin/AdminDashboard'
import { storeEngine, type NotificationItem } from '../services/storeEngine'
import { useAuth } from '../features/auth/authContext'
import type { Product } from '../types/product'

const CART_STORAGE_KEY = 'rm_cart_items_v2'

export function App() {
  const { user } = useAuth()
  const userId = user?.id || 'demo_collector_user'
  const userEmail = user?.email || 'collector@russianmarket.store'

  // Application State
  const [activeSection, setActiveSection] = useState<AppSection>('cards')
  const [products, setProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [isVaultOpen, setIsVaultOpen] = useState(false)
  const [isAdminView, setIsAdminView] = useState(false)

  // Realtime Badges & Data
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [ordersCount, setOrdersCount] = useState(0)
  const [vaultCount, setVaultCount] = useState(0)

  // Load Initial Store Data & Subscribe to Realtime Updates
  const refreshStoreData = useCallback(async () => {
    try {
      const [pList, nList, oList, vList] = await Promise.all([
        storeEngine.getProducts(),
        storeEngine.getNotifications(userId),
        storeEngine.getOrders(userId),
        storeEngine.getCustomerEntitlements(userId),
      ])
      setProducts(pList)
      setNotifications(nList)
      setOrdersCount(oList.length)
      setVaultCount(vList.length)
    } catch (err) {
      console.error('Failed to load store data:', err)
    }
  }, [userId])

  useEffect(() => {
    void refreshStoreData()

    const unsubscribe = storeEngine.subscribe(() => {
      void refreshStoreData()
    })
    return () => unsubscribe()
  }, [refreshStoreData])

  // Save Cart Changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const cartTotalCount = useMemo(() => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)
  }, [cartItems])

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.readAt).length
  }, [notifications])

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }))
    setIsCartOpen(true)
  }

  const handleQuickBuy = (product: Product) => {
    setCartItems((prev) => ({
      ...prev,
      [product.id]: prev[product.id] ? prev[product.id] : 1,
    }))
    setIsCheckoutOpen(true)
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
    } else {
      setCartItems((prev) => ({ ...prev, [productId]: quantity }))
    }
  }

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => {
      const copy = { ...prev }
      delete copy[productId]
      return copy
    })
  }

  const handleClearCart = () => {
    setCartItems({})
  }

  const handleMarkNotificationRead = async (id: string) => {
    await storeEngine.markNotificationRead(id)
    const updated = await storeEngine.getNotifications(userId)
    setNotifications(updated)
  }

  // Admin Check
  const isAdmin = true // In local/demo mode, enable admin control room

  if (isAdminView) {
    return <AdminDashboard onExitAdmin={() => setIsAdminView(false)} />
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Header (Mobile-first, sticky with search, orders, notifications, cart) */}
      <Header
        cartCount={cartTotalCount}
        unreadCount={unreadNotificationsCount}
        ordersCount={ordersCount}
        vaultCount={vaultCount}
        notifications={notifications}
        isAdmin={isAdmin}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      {/* 2. Main Content View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-4 pb-24 md:pb-12">
        {activeSection === 'cards' && (
          <CatalogPage
            products={products}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            onQuickBuy={handleQuickBuy}
            onOpenSupport={() => setActiveSection('chat')}
            initialSearchQuery={searchQuery}
          />
        )}

        {activeSection === 'video' && <VideoSection />}

        {activeSection === 'chat' && (
          <ChatSection userId={userId} userEmail={userEmail} />
        )}

        {activeSection === 'wallet' && <WalletSection userId={userId} />}

        {activeSection === 'settings' && (
          <SettingsSection
            isAdmin={isAdmin}
            onToggleAdmin={() => setIsAdminView(true)}
          />
        )}
      </main>

      {/* 3. Navigation Controls */}
      {/* Mobile Fixed Bottom Bar (safe-area optimized) */}
      <Navigation
        activeSection={activeSection}
        onChange={setActiveSection}
        variant="mobile"
        unreadChatCount={0}
      />

      {/* Desktop Sticky Header Nav (shown inside header container on wide screens) */}
      <div className="hidden md:flex justify-center pb-4">
        <Navigation
          activeSection={activeSection}
          onChange={setActiveSection}
          variant="desktop"
        />
      </div>

      {/* 4. Modals and Drawers */}
      {/* Product Details Dialog */}
      <ProductDetailsDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onQuickBuy={handleQuickBuy}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        products={products}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        products={products}
        userId={userId}
        userEmail={userEmail}
        onOrderSuccess={() => {
          setIsOrdersOpen(true)
        }}
        onClearCart={handleClearCart}
      />

      {/* My Orders Modal */}
      <MyOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        userId={userId}
        onOpenVault={() => setIsVaultOpen(true)}
      />

      {/* Digital Vault Modal */}
      <DigitalVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        userId={userId}
      />
    </div>
  )
}

export default App

