import { useState } from 'react'
import {
  Search,
  Bell,
  FileCheck,
  X,
  SlidersHorizontal,
  Archive,
} from 'lucide-react'
import { RussianMarketLogo } from './RussianMarketLogo'
import { Navigation, type AppSection } from './Navigation'
import type { NotificationItem } from '../services/storeEngine'

type HeaderProps = {
  activeSection: AppSection
  onSectionChange: (section: AppSection) => void
  cartCount?: number
  unreadCount: number
  ordersCount: number
  vaultCount?: number
  notifications: NotificationItem[]
  isAdmin: boolean
  isAdminView: boolean
  onToggleAdminView: () => void
  onOpenCart?: () => void
  onOpenOrders: () => void
  onOpenVault?: () => void
  onSearchChange: (query: string) => void
  searchQuery: string
  onMarkNotificationRead: (id: string) => void
}

export function Header({
  activeSection,
  onSectionChange,
  unreadCount,
  ordersCount,
  vaultCount = 0,
  notifications,
  isAdmin,
  isAdminView,
  onToggleAdminView,
  onOpenOrders,
  onOpenVault,
  onSearchChange,
  searchQuery,
  onMarkNotificationRead,
}: HeaderProps) {
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/[0.08] px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <RussianMarketLogo size="md" showWordmark={true} />
        </div>

        {/* Center: Desktop Primary Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-xl mx-2">
          <Navigation
            activeSection={activeSection}
            onChange={onSectionChange}
            variant="desktop"
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
              className="w-full glass-input pl-8 pr-7 py-1.5 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400"
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
            className="xl:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Digital Vault Shortcut */}
          {onOpenVault && (
            <button
              type="button"
              onClick={onOpenVault}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-white/[0.05] border border-white/[0.08] transition-colors"
              title="Digital Vault"
            >
              <Archive className="w-4 h-4 text-slate-300 hover:text-cyan-400" />
              <span className="hidden sm:inline text-xs font-medium">Vault</span>
              {vaultCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 font-mono-code text-[10px] font-bold">
                  {vaultCount}
                </span>
              )}
            </button>
          )}

          {/* My Orders Shortcut */}
          <button
            type="button"
            onClick={onOpenOrders}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-colors"
            title="My Orders"
          >
            <FileCheck className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline text-xs font-medium">Orders</span>
            {ordersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono-code text-[10px] font-bold">
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
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 glass-panel-elevated rounded-2xl p-3 shadow-2xl z-50 border border-white/[0.12] animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    {unreadCount} unread
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 font-sans">
                      No notifications.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-2 rounded-xl cursor-pointer transition-colors ${
                          !n.readAt
                            ? 'bg-white/[0.06] border border-white/[0.08]'
                            : 'bg-transparent opacity-60 hover:opacity-100'
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
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                isAdminView
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'text-slate-400 hover:text-white border-white/[0.08] hover:bg-white/[0.05]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">
                {isAdminView ? 'Admin View' : 'Admin'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Row (if expanded) */}
      {showSearchInput && (
        <div className="mt-2.5 xl:hidden animate-in fade-in slide-in-from-top-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search collectibles..."
              autoFocus
              className="w-full glass-input pl-9 pr-8 py-2 rounded-xl text-xs placeholder:text-slate-500"
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
