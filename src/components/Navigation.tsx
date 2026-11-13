import React from 'react'
import { Sparkles, Clapperboard, MessageCircle, Wallet, Settings } from 'lucide-react'

export type AppSection = 'cards' | 'video' | 'chat' | 'wallet' | 'settings'

type NavigationProps = {
  activeSection: AppSection
  onChange: (section: AppSection) => void
  variant?: 'mobile' | 'desktop'
  unreadChatCount?: number
}

const navItems: {
  id: AppSection
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'cards', label: 'CARDS', icon: Sparkles },
  { id: 'video', label: 'VIDEO', icon: Clapperboard },
  { id: 'chat', label: 'CHAT', icon: MessageCircle },
  { id: 'wallet', label: 'WALLET', icon: Wallet },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
]

export function Navigation({
  activeSection,
  onChange,
  variant = 'mobile',
  unreadChatCount = 0,
}: NavigationProps) {
  if (variant === 'desktop') {
    return (
      <nav
        aria-label="Desktop Primary Navigation"
        className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10"
      >
        {navItems.map(({ id, label, icon: IconComponent }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-space text-xs font-semibold tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{label}</span>
              {id === 'chat' && unreadChatCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          )
        })}
      </nav>
    )
  }

  // Mobile Bottom Navigation Bar (Fixed with Safe Area)
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-panel-glow border-t border-white/10 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] px-3 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
        {navItems.map(({ id, label, icon: IconComponent }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active ambient glow pill */}
              {isActive && (
                <span
                  className="absolute inset-0 bg-cyan-500/15 rounded-xl border border-cyan-400/30 -z-10 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                />
              )}

              <div className="relative">
                <IconComponent
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''
                  }`}
                />
                {id === 'chat' && unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-black" />
                )}
              </div>

              <span
                className={`font-space text-[10px] tracking-wider mt-1 font-bold ${
                  isActive ? 'text-cyan-300' : 'text-slate-400'
                }`}
              >
                {label}
              </span>

              {/* Cyan Indicator dot */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_#00f0ff]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
