import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { Header } from '../components/Header'
import { Navigation, type AppSection } from '../components/Navigation'
import { CatalogPage } from '../features/catalog/CatalogPage'
import { ProductDetailsDialog } from '../features/catalog/ProductDetailsDialog'
import { CheckoutModal } from '../features/commerce/CheckoutModal'
import { MyOrdersModal } from '../features/orders/MyOrdersModal'
import { DigitalVaultModal } from '../features/vault/DigitalVaultModal'
import { VideoSection } from '../features/video/VideoSection'
import { ChatSection } from '../features/chat/ChatSection'
import { WalletSection } from '../features/wallet/WalletSection'
import { SettingsSection } from '../features/settings/SettingsSection'
import { AdminLoginGateway } from '../features/admin/AdminLoginGateway'
import { AuthModal } from '../features/auth/AuthModal'
import { storeEngine, type NotificationItem } from '../services/storeEngine'
import { useAuth } from '../features/auth/authContext'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/product'

const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'))

const CART_STORAGE_KEY = 'rm_cart_items_v2'

export function App() {
  const {
    user,
    isAdmin,
    loading: authLoading,
    setPendingCheckoutProduct,
    getPendingCheckoutProduct,
    clearPendingCheckoutProduct,
  } = useAuth()

  const userId = user?.id || 'demo_collector_user'
  const userEmail = user?.email || 'collector@russianmarket.store'

  // Application Routing State
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  })

  // Popstate Listener for Browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToAdmin = useCallback(() => {
    window.history.pushState({}, '', '/admin')
    setIsAdminRoute(true)
  }, [])

  const navigateToStore = useCallback(() => {
    window.history.pushState({}, '', '/')
    setIsAdminRoute(false)
  }, [])

  // Application Navigation & Data
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [isVaultOpen, setIsVaultOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Realtime Badges & Data
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [ordersCount, setOrdersCount] = useState(0)
  const [vaultCount, setVaultCount] = useState(0)
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  // Load Initial Store Data
  const refreshStoreData = useCallback(async () => {
    try {
      const [pList, nList, oList, vList, chatCount] = await Promise.all([
        storeEngine.getProducts(),
        storeEngine.getNotifications(userId),
        storeEngine.getOrders(userId),
        storeEngine.getCustomerEntitlements(userId),
        storeEngine.getUnreadChatCount(userId),
      ])
      setProducts(pList)
      setNotifications(nList)
      setOrdersCount(oList.length)
      setVaultCount(vList.length)
      setUnreadChatCount(chatCount)
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

  // Realtime Subscriptions for live updates
  useEffect(() => {
    if (!supabase || !user) return

    const channel = supabase
      .channel(`user-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshStoreData()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_requests', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshStoreData()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshStoreData()
        },
      )
      .subscribe()

    return () => {
      if (supabase) {
        void supabase.removeChannel(channel)
      }
    }
  }, [user, refreshStoreData])

  // Save Cart Changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  // Resume Pending Checkout or Admin Route after Login
  useEffect(() => {
    if (user) {
      const returnUrl = sessionStorage.getItem('rm_auth_return_url')
      if (returnUrl) {
        sessionStorage.removeItem('rm_auth_return_url')
        if (returnUrl.startsWith('/admin')) {
          navigateToAdmin()
        }
      }

      if (products.length > 0) {
        const pendingProductId = getPendingCheckoutProduct()
        if (pendingProductId) {
          clearPendingCheckoutProduct()
          const targetProduct = products.find((p) => p.id === pendingProductId)
          if (targetProduct) {
            setCartItems({ [pendingProductId]: 1 })
            setIsAuthModalOpen(false)
            setIsCheckoutOpen(true)
          }
        }
      }
    }
  }, [user, products, getPendingCheckoutProduct, clearPendingCheckoutProduct, navigateToAdmin])

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.readAt).length
  }, [notifications])

  // Canonical Single-Purchase BUY NOW Flow with Guest Auth Intercept
  const handleQuickBuy = (product: Product) => {
    if (!user) {
      // Guest: Store pending checkout product and prompt login
      setPendingCheckoutProduct(product.id)
      setIsAuthModalOpen(true)
      return
    }

    setCartItems({ [product.id]: 1 })
    setIsCheckoutOpen(true)
  }

  const handleClearCart = () => {
    setCartItems({})
  }

  const handleMarkNotificationRead = async (id: string) => {
    await storeEngine.markNotificationRead(id)
    const updated = await storeEngine.getNotifications(userId)
    setNotifications(updated)
  }

  // ========================================================
  // ROUTE 1: ADMIN CONTROL ROOM (/admin)
  // ========================================================
  if (isAdminRoute) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs text-white/60 font-mono tracking-widest uppercase">
            Verifying Sovereign Admin Session…
          </span>
        </div>
      )
    }

    // Server-Verified Admin Gate: only users with admin role can access
    if (!user || !isAdmin) {
      return (
        <AdminLoginGateway
          onSuccess={() => setIsAdminRoute(true)}
          onReturnToStore={navigateToStore}
        />
      )
    }

    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#060709] flex items-center justify-center text-white font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Initializing Enterprise Command Center...</span>
            </div>
          </div>
        }
      >
        <AdminDashboard onExitAdmin={navigateToStore} />
      </Suspense>
    )
  }

  // ========================================================
  // ROUTE 2: CUSTOMER STOREFRONT (/)
  // ========================================================
  return (
    <div className="min-h-screen bg-[#060709] text-[#ededed] flex flex-col font-sans overflow-x-hidden selection:bg-white selection:text-black">
      {/* 1. Header (Mobile-first, sticky with search, orders, notifications, cart, and desktop nav) */}
      <Header
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        unreadCount={unreadNotificationsCount}
        unreadChatCount={unreadChatCount}
        ordersCount={ordersCount}
        vaultCount={vaultCount}
        notifications={notifications}
        isAdmin={isAdmin}
        isAdminView={false}
        onToggleAdminView={navigateToAdmin}
        onOpenOrders={() => {
          if (!user) setIsAuthModalOpen(true)
          else setIsOrdersOpen(true)
        }}
        onOpenVault={() => {
          if (!user) setIsAuthModalOpen(true)
          else setIsVaultOpen(true)
        }}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        onMarkNotificationRead={handleMarkNotificationRead}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 2. Main Content View Area with ample safe bottom clearance */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 ${
        activeSection === 'chat'
          ? 'pt-2 sm:pt-4 pb-2 md:pb-6'
          : 'pt-3 sm:pt-4 pb-[calc(11rem+env(safe-area-inset-bottom,0px))] md:pb-20'
      }`}>
        {activeSection === 'cards' && (
          <CatalogPage
            products={products}
            onSelectProduct={setSelectedProduct}
            onQuickBuy={handleQuickBuy}
            initialSearchQuery={searchQuery}
          />
        )}

        {activeSection === 'video' && <VideoSection />}

        {activeSection === 'chat' && (
          <ChatSection userId={userId} userEmail={userEmail} />
        )}

        {activeSection === 'wallet' && (
          <WalletSection userId={userId} userEmail={userEmail} />
        )}

        {activeSection === 'settings' && (
          <SettingsSection
            isAdmin={isAdmin}
            onToggleAdmin={navigateToAdmin}
          />
        )}
      </main>

      {/* Subtle Mobile Bottom Ambient Fade */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 h-16 pointer-events-none bg-gradient-to-t from-[#060709] to-transparent z-40"
        aria-hidden="true"
      />

      {/* 3. Navigation Controls */}
      <Navigation
        activeSection={activeSection}
        onChange={setActiveSection}
        variant="mobile"
        unreadChatCount={unreadChatCount}
      />

      {/* 4. Modals and Drawers */}
      {/* Product Details Dialog */}
      <ProductDetailsDialog
        key={selectedProduct?.id ?? 'none'}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onQuickBuy={handleQuickBuy}
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

      {/* Sovereign Auth Modal (Prompted on BUY NOW for Guests) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Sign In to Complete Acquisition"
        subtitle="Authenticate via Google or email to complete your collectible purchase and access your private vault."
      />
    </div>
  )
}

export default App
