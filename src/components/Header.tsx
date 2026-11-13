import { useState } from 'react'
import {
  Search,
  Bell,
  ShoppingBag,
  FileCheck,
  ShieldAlert,
  X,
} from 'lucide-react'
import { RussianMarketLogo } from './RussianMarketLogo'
import type { NotificationItem } from '../services/storeEngine'

type HeaderProps = {
  cartCount: number
  unreadCount: number
  ordersCount: number
  vaultCount: number
  notifications: NotificationItem[]
  isAdmin: boolean
  isAdminView: boolean
  onToggleAdminView: () => void
  onOpenCart: () => void
  onOpenOrders: () => void
  onOpenVault: () => void
  onSearchChange: (query: string) => void
  searchQuery: string
  onMarkNotificationRead: (id: string) => void
}

export function Header({
  cartCount,
  unreadCount,
  ordersCount,
  vaultCount,
  notifications,
  isAdmin,
  isAdminView,
  onToggleAdminView,
  onOpenCart,
  onOpenOrders,
  onOpenVault,
  onSearchChange,
  searchQuery,
  onMarkNotificationRead,
}: HeaderProps) {
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full glass-panel-glow border-b border-white/10 px-3.5 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <RussianMarketLogo size="md" showWordmark={true} showSubtitle={false} />
          {isAdmin && (
            <button
              type="button"
              onClick={onToggleAdminView}
              className={`px-2 py-0.5 rounded-full font-mono-code text-[10px] font-bold tracking-wider transition-all border ${
                isAdminView
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              {isAdminView ? 'ADMIN CONTROL' : 'ADMIN AVAILABLE'}
            </button>
          )}
        </div>

        {/* Search Bar - Expandable on mobile, always visible on desktop */}
        <div className="flex-1 max-w-md hidden md:block mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by SKU, Collection, Title..."
              className="w-full glass-input pl-9 pr-4 py-1.5 rounded-full text-xs placeholder:text-slate-500 focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Mobile search toggle button */}
          <button
            type="button"
            onClick={() => setShowSearchInput(!showSearchInput)}
            aria-label="Toggle search"
            className="md:hidden p-2 rounded-xl bg-white/5 text-slate-300 hover:text-cyan-400 active:scale-95 transition-all"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* My Orders Shortcut */}
          <button
            type="button"
            onClick={onOpenOrders}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all active:scale-95"
            title="My Orders"
          >
            <FileCheck className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Orders</span>
            {ordersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono-code text-[10px] font-bold border border-cyan-500/30">
                {ordersCount}
              </span>
            )}
          </button>

          {/* Digital Vault Shortcut */}
          <button
            type="button"
            onClick={onOpenVault}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all active:scale-95"
            title="Encrypted Digital Vault"
          >
            <ShieldAlert className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">Vault</span>
            {vaultCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 font-mono-code text-[10px] font-bold border border-violet-500/30">
                {vaultCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              aria-label="Notifications"
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white active:scale-95 border border-white/10 transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black font-mono-code text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 glass-panel-glow rounded-2xl p-3 shadow-2xl z-50 border border-cyan-500/20 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="font-space font-bold text-xs text-white">NOTIFICATIONS</span>
                  <span className="text-[10px] font-mono-code text-cyan-400">{unreadCount} UNREAD</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                          !n.readAt
                            ? 'bg-cyan-500/10 border border-cyan-500/30'
                            : 'bg-white/5 border border-white/5 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{n.title}</span>
                          <span className="text-[9px] font-mono-code text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Bag Button */}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Shopping Bag"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-cyan text-xs font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="font-mono-code font-bold">{cartCount}</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Row (if toggled) */}
      {showSearchInput && (
        <div className="mt-2.5 md:hidden animate-in fade-in slide-in-from-top-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search collectibles by SKU, Edition..."
              autoFocus
              className="w-full glass-input pl-9 pr-8 py-2 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
