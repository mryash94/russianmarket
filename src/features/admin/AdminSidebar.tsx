import React from 'react'
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Wallet,
  ArrowDownLeft,
  QrCode,
  ShieldCheck,
  ScanLine,
  MessageSquare,
  Bell,
  Film,
  UserCheck,
  History,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Store,
  Zap,
  Scale,
} from 'lucide-react'

export type AdminTab =
  | 'overview'
  | 'analytics'
  | 'automation'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'wallet'
  | 'deposits'
  | 'reconciliation'
  | 'upi_settings'
  | 'payment_verification'
  | 'qr_scanner'
  | 'inbox'
  | 'notifications'
  | 'content'
  | 'roles'
  | 'audit'
  | 'settings'

type NavItem = {
  id: AdminTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  badgeVariant?: 'cyan' | 'amber' | 'emerald' | 'rose'
}

type NavGroup = {
  title: string
  items: NavItem[]
}

type AdminSidebarProps = {
  activeTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onExitAdmin: () => void
  pendingOrdersCount?: number
  pendingDepositsCount?: number
  unreadChatCount?: number
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onExitAdmin,
  pendingOrdersCount = 0,
  pendingDepositsCount = 0,
  unreadChatCount = 0,
}: AdminSidebarProps) {
  const navGroups: NavGroup[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'automation', label: 'Smart Automation', icon: Zap },
        {
          id: 'inbox',
          label: 'Live Chat Inbox',
          icon: MessageSquare,
          badge: unreadChatCount > 0 ? unreadChatCount : undefined,
          badgeVariant: 'cyan',
        },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ],
    },
    {
      title: 'COMMERCE',
      items: [
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeVariant: 'amber',
        },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'inventory', label: 'Inventory & Editions', icon: Boxes },
        { id: 'customers', label: 'Customers', icon: Users },
      ],
    },
    {
      title: 'PAYMENTS & FINANCE',
      items: [
        { id: 'wallet', label: 'Wallet Ledger', icon: Wallet },
        {
          id: 'deposits',
          label: 'Add Money Requests',
          icon: ArrowDownLeft,
          badge: pendingDepositsCount > 0 ? pendingDepositsCount : undefined,
          badgeVariant: 'rose',
        },
        { id: 'reconciliation', label: 'Financial Audit', icon: Scale },
        { id: 'upi_settings', label: 'UPI Configuration', icon: QrCode },
        { id: 'payment_verification', label: 'Payment Verification', icon: ShieldCheck },
      ],
    },
    {
      title: 'SECURITY & SETTINGS',
      items: [
        { id: 'qr_scanner', label: 'QR Scanner', icon: ScanLine },
        { id: 'roles', label: 'Admin Users & Roles', icon: UserCheck },
        { id: 'content', label: 'Content Management', icon: Film },
        { id: 'audit', label: 'Audit Logs', icon: History },
        { id: 'settings', label: 'System Settings', icon: Sliders },
      ],
    },
  ]

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 bg-[#090b0f] border-r border-white/5 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-[#0c0e12]/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-extrabold text-xs shrink-0 shadow-lg shadow-cyan-500/10">
              RM
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold tracking-tight text-white uppercase truncate font-mono">
                RUSSIAN MARKET
              </h1>
              <span className="text-[10px] text-cyan-400 tracking-widest font-mono uppercase block">
                CONTROL ROOM
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-extrabold text-xs shadow-lg shadow-cyan-500/10">
            RM
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white items-center justify-center transition-colors shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-mono tracking-wider text-white/30 uppercase font-semibold block mb-1">
                {group.title}
              </span>
            )}
            {group.items.map((item) => {
              const IconComponent = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-white/15 to-white/5 text-white font-semibold shadow-inner border border-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  {/* Active Indicator Accent Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                  )}

                  <IconComponent
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-white/50 group-hover:text-white'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {/* Notification Badge */}
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                        isCollapsed ? 'absolute -top-1 -right-1 ring-2 ring-[#090b0f]' : ''
                      } ${
                        item.badgeVariant === 'rose'
                          ? 'bg-rose-500 text-white'
                          : item.badgeVariant === 'amber'
                          ? 'bg-amber-500 text-black'
                          : item.badgeVariant === 'emerald'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-cyan-400 text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer Exit Button */}
      <div className="p-3 border-t border-white/5 bg-[#0c0e12]/50">
        <button
          type="button"
          onClick={onExitAdmin}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all active:scale-98 ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Return to Customer Website"
        >
          <Store className="w-4 h-4 shrink-0 text-white/50" />
          {!isCollapsed && <span>Customer Website</span>}
        </button>
      </div>
    </aside>
  )
}
