import { useState, useEffect } from 'react'
import {
  Search,
  Bell,
  FileCheck,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { RussianMarketLogo } from './RussianMarketLogo'
import { Navigation, type AppSection } from './Navigation'
import { storeEngine, type NotificationItem } from '../services/storeEngine'

type HeaderProps = {
  activeSection: AppSection
  onSectionChange: (section: AppSection) => void
  cartCount?: number
  unreadCount: number
  unreadChatCount?: number
  ordersCount: number
  notifications: NotificationItem[]
  isAdmin: boolean
  isAdminView: boolean
  onToggleAdminView: () => void
  onOpenCart?: () => void
  onOpenOrders: () => void
  onSearchChange: (query: string) => void
  searchQuery: string
  onMarkNotificationRead: (id: string) => void
  user?: { email?: string | null } | null
  onOpenAuth?: () => void
}

export function Header({
  activeSection,
  onSectionChange,
  unreadCount,
  unreadChatCount = 0,
  ordersCount,
  notifications,
  isAdmin,
  isAdminView,
  onToggleAdminView,
  onOpenOrders,
  onSearchChange,
  searchQuery,
  onMarkNotificationRead,
  user,
  onOpenAuth,
}: HeaderProps) {
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [connStatus, setConnStatus] = useState(storeEngine.getConnectionStatus())

  useEffect(() => {
    const unsub = storeEngine.subscribe((event, payload) => {
      if (event === 'connection_status_changed') {
        setConnStatus(payload as 'connected' | 'connecting' | 'offline')
      }
    })
    return () => unsub()
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full bg-[#060709]/95 backdrop-blur-md border-b border-white/[0.07] px-3.5 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand Logo & Realtime Status Indicator */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <RussianMarketLogo size="md" showWordmark={true} />
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-[10px] font-mono-code text-[#9499a6]"
            title={`Supabase Realtime Status: ${connStatus}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connStatus === 'connected'
                  ? 'bg-[#34d399] animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : connStatus === 'connecting'
                  ? 'bg-[#fbbf24] animate-pulse'
                  : 'bg-[#666b7a]'
              }`}
            />
            <span className="capitalize">{connStatus === 'connected' ? 'Live Realtime' : connStatus}</span>
          </div>
        </div>

        {/* Center: Desktop Primary Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-xl mx-2">
          <Navigation
            activeSection={activeSection}
            onChange={onSectionChange}
            variant="desktop"
            unreadChatCount={unreadChatCount}
          />
        </div>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Desktop Search Bar */}
          <div className="relative hidden xl:block w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search editions..."
              className="w-full h-9 bg-[#12151c] border border-white/[0.08] focus:border-white/30 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search toggle for mobile & tablet */}
          <button
            type="button"
            onClick={() => setShowSearchInput(!showSearchInput)}
            aria-label="Search"
            className="xl:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* My Orders Shortcut */}
          <button
            type="button"
            onClick={onOpenOrders}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-colors"
            title="My Orders"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-xs font-medium text-slate-300">Orders</span>
            {ordersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-white/[0.08] text-white font-mono-code text-[10px] font-medium tabular-nums">
                {ordersCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              aria-label="Notifications"
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#12151c] rounded-xl p-3 shadow-2xl z-50 border border-white/[0.1] animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono-code text-[9px] tabular-nums">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        void storeEngine.markAllNotificationsRead(user ? (user as any).id : null)
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-sans transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 font-sans">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onMarkNotificationRead(n.id)
                          setShowNotifDropdown(false)
                          if (n.notificationType === 'order' || n.title.toLowerCase().includes('order')) {
                            onOpenOrders()
                          } else if (n.notificationType === 'support' || n.title.toLowerCase().includes('concierge') || n.title.toLowerCase().includes('chat')) {
                            onSectionChange('chat')
                          } else if (n.title.toLowerCase().includes('wallet') || n.title.toLowerCase().includes('deposit') || n.title.toLowerCase().includes('fund')) {
                            onSectionChange('wallet')
                          } else {
                            onOpenOrders()
                          }
                        }}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          !n.readAt
                            ? 'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08]'
                            : 'bg-transparent opacity-60 hover:opacity-100 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-white">{n.title}</span>
                          <span className="text-[9px] font-mono-code text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Control Switch */}
          {isAdmin && (
            <button
              type="button"
              onClick={onToggleAdminView}
              title="Admin Control Room"
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                isAdminView
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white border-white/[0.08] hover:bg-white/[0.05]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">
                {isAdminView ? 'Admin Active' : 'Admin'}
              </span>
            </button>
          )}

          {/* User Profile / Sovereign Sign In */}
          {user ? (
            <button
              type="button"
              onClick={onOpenAuth}
              title={user.email || 'Collector Account'}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 border border-white/20 flex items-center justify-center font-bold text-white text-xs hover:border-cyan-400 transition-colors"
            >
              {(user.email?.[0] ?? 'C').toUpperCase()}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Row (if expanded) */}
      {showSearchInput && (
        <div className="mt-2 xl:hidden animate-in fade-in slide-in-from-top-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search collectibles..."
              autoFocus
              className="w-full h-9 bg-[#12151c] border border-white/[0.08] focus:border-white/30 rounded-lg pl-9 pr-8 text-xs text-white placeholder:text-slate-500"
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

export default Header
