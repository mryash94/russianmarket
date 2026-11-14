import { useState, useEffect, useRef } from 'react'
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Scale,
  Zap,
  Sliders,
  ArrowRight,
  X,
  CreditCard,
} from 'lucide-react'
import type { AdminTab } from './AdminSidebar'
import type { Order } from '../../services/storeEngine'
import type { Product } from '../../types/product'
import type { CustomerCRMRecord } from '../../lib/exportUtils'
import type { WalletTx } from '../../services/storeEngine'
import { formatINR } from '../../lib/currency'

type AdminCommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
  onSelectTab: (tab: AdminTab) => void
  onSelectOrder?: (order: Order) => void
  onSelectCustomer?: (customer: CustomerCRMRecord) => void
  products: Product[]
  orders: Order[]
  transactions: WalletTx[]
  customers: CustomerCRMRecord[]
}

const STATIC_ACTIONS: { id: AdminTab; title: string; category: string; icon: any }[] = [
  { id: 'overview', title: 'Go to Overview Dashboard', category: 'Navigation', icon: LayoutDashboard },
  { id: 'analytics', title: 'Go to Analytics & Metrics', category: 'Navigation', icon: BarChart3 },
  { id: 'automation', title: 'Go to Smart Automation Center', category: 'Navigation', icon: Zap },
  { id: 'products', title: 'Manage Collectible Products', category: 'Navigation', icon: Package },
  { id: 'orders', title: 'View Customer Orders & Deliverables', category: 'Navigation', icon: ShoppingBag },
  { id: 'customers', title: 'Explore Customer CRM & LTV', category: 'Navigation', icon: Users },
  { id: 'wallet', title: 'Inspect Wallet Ledger & Balances', category: 'Navigation', icon: Wallet },
  { id: 'reconciliation', title: 'Run Financial Reconciliation Audit', category: 'Navigation', icon: Scale },
  { id: 'settings', title: 'Configure System & UPI Settings', category: 'Navigation', icon: Sliders },
]

export function AdminCommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onSelectOrder,
  onSelectCustomer,
  products,
  orders,
  transactions,
  customers,
}: AdminCommandPaletteProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Open
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const q = query.toLowerCase().trim()

  // Filter actions
  const matchedActions = STATIC_ACTIONS.filter((a) =>
    a.title.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
  )

  // Filter products
  const matchedProducts = products
    .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .slice(0, 4)

  // Filter orders
  const matchedOrders = orders
    .filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.orderNumber?.toLowerCase().includes(q) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q))
    )
    .slice(0, 4)

  // Filter customers
  const matchedCustomers = customers
    .filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q)
    )
    .slice(0, 4)

  // Filter transactions
  const matchedTransactions = transactions
    .filter((tx) => (tx.reference && tx.reference.toLowerCase().includes(q)) || tx.id.toLowerCase().includes(q))
    .slice(0, 3)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0c0e12] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-black/40">
          <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, products, orders, customers, or UTR references... (Ctrl+K)"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs font-mono">
          {/* Matched Navigation */}
          {matchedActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider px-2 font-bold">
                Navigation & Modules
              </span>
              {matchedActions.map((act) => {
                const IconComponent = act.icon
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(act.id)
                      onClose()
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/5 transition-all text-white/80 hover:text-white group"
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="w-4 h-4 text-cyan-400" />
                      <span>{act.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-cyan-400 transition-colors" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Matched Products */}
          {matchedProducts.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider px-2 font-bold">
                Collectibles ({matchedProducts.length})
              </span>
              {matchedProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectTab('products')
                    onClose()
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/5 transition-all text-white/80 hover:text-white group"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-[10px] text-white/40 ml-2">({p.sku})</span>
                    </div>
                  </div>
                  <span className="text-cyan-400 font-bold">{formatINR(p.priceMinor)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Matched Orders */}
          {matchedOrders.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider px-2 font-bold">
                Orders ({matchedOrders.length})
              </span>
              {matchedOrders.map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    onSelectTab('orders')
                    onSelectOrder?.(ord)
                    onClose()
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/5 transition-all text-white/80 hover:text-white group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white">{ord.orderNumber || ord.id}</span>
                      <span className="text-[10px] text-white/40 ml-2">
                        {ord.customerEmail || 'Guest'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{formatINR(ord.subtotalMinor)}</span>
                    <span className="text-[10px] text-cyan-400 uppercase">{ord.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Matched Customers */}
          {matchedCustomers.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider px-2 font-bold">
                Customers ({matchedCustomers.length})
              </span>
              {matchedCustomers.map((cust) => (
                <button
                  key={cust.userId}
                  type="button"
                  onClick={() => {
                    onSelectTab('customers')
                    onSelectCustomer?.(cust)
                    onClose()
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/5 transition-all text-white/80 hover:text-white group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="font-bold text-white">{cust.email}</span>
                      <span className="text-[10px] text-white/40 ml-2">Tier: {cust.tier}</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">{formatINR(cust.totalSpentMinor)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Matched Transactions */}
          {matchedTransactions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider px-2 font-bold">
                Wallet Transactions ({matchedTransactions.length})
              </span>
              {matchedTransactions.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => {
                    onSelectTab('wallet')
                    onClose()
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/5 transition-all text-white/80 hover:text-white group"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white">{tx.reference || tx.id}</span>
                      <span className="text-[10px] text-white/40 ml-2">{tx.transactionType}</span>
                    </div>
                  </div>
                  <span className="text-white font-bold">{formatINR(tx.amountMinor)}</span>
                </button>
              ))}
            </div>
          )}

          {matchedActions.length === 0 &&
            matchedProducts.length === 0 &&
            matchedOrders.length === 0 &&
            matchedCustomers.length === 0 &&
            matchedTransactions.length === 0 && (
              <div className="py-8 text-center text-white/40 text-xs">
                No matching commands or entities found for "{query}".
              </div>
            )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/5 bg-black/60 flex items-center justify-between text-[10px] text-white/40 font-mono">
          <span>Navigate with arrows / click to open</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  )
}
