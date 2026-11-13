import { LiquidNavbar, type LiquidNavItem } from '@/components/ui/liquid-glass-navbar'

export type AppSection = 'cards' | 'video' | 'chat' | 'wallet' | 'settings'

export type NavigationProps = {
  activeSection: AppSection
  onChange: (section: AppSection) => void
  variant?: 'mobile' | 'desktop'
  unreadChatCount?: number
  className?: string
}

const SECTIONS: AppSection[] = ['cards', 'video', 'chat', 'wallet', 'settings']

export function Navigation({
  activeSection,
  onChange,
  variant,
  unreadChatCount = 0,
  className = '',
}: NavigationProps) {
  const activeIndex = Math.max(0, SECTIONS.indexOf(activeSection))

  const handleIndexChange = (index: number) => {
    const nextSection = SECTIONS[index]
    if (nextSection && nextSection !== activeSection) {
      onChange(nextSection)
    }
  }

  // Strictly the 5 requested navigation items with luxury icons and micro-fx
  const items: LiquidNavItem[] = [
    {
      label: 'CARDS',
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="10" y2="15" />
        </svg>
      ),
      fx: 'spin',
    },
    {
      label: 'VIDEO',
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="6 4 20 12 6 20 6 4" />
        </svg>
      ),
      fx: 'pop',
    },
    {
      label: 'CHAT',
      icon: (
        <span className="relative inline-flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unreadChatCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.9)] animate-pulse"
              aria-label={`${unreadChatCount} unread message${unreadChatCount > 1 ? 's' : ''}`}
            />
          )}
        </span>
      ),
      fx: 'drop',
    },
    {
      label: 'WALLET',
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
          <path d="M16 12a2 2 0 1 0 0 4h4v-4Z" />
          <path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
        </svg>
      ),
      fx: 'glow',
    },
    {
      label: 'SETTINGS',
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      fx: 'spin',
    },
  ]

  // Desktop Header variant (compact inline liquid-glass pill)
  if (variant === 'desktop') {
    return (
      <div className={`hidden md:inline-flex items-center justify-center ${className}`}>
        <LiquidNavbar
          items={items}
          active={activeIndex}
          onChange={handleIndexChange}
          tone="dark"
          sound={false}
          className="shadow-lg shadow-black/40"
        />
      </div>
    )
  }

  // Mobile Bottom Floating variant (safe-area compliant, centered, touch-friendly)
  if (variant === 'mobile') {
    return (
      <nav
        aria-label="Mobile Bottom Navigation"
        className={`md:hidden fixed bottom-3 inset-x-0 z-50 flex justify-center pointer-events-none px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] ${className}`}
      >
        <div className="pointer-events-auto filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]">
          <LiquidNavbar
            items={items}
            active={activeIndex}
            onChange={handleIndexChange}
            tone="dark"
            sound={false}
          />
        </div>
      </nav>
    )
  }

  // Default adaptive variant (renders inline on desktop and floating at bottom on mobile)
  return (
    <>
      <div className={`hidden md:inline-flex items-center justify-center ${className}`}>
        <LiquidNavbar
          items={items}
          active={activeIndex}
          onChange={handleIndexChange}
          tone="dark"
          sound={false}
          className="shadow-lg shadow-black/40"
        />
      </div>
      <nav
        aria-label="Mobile Bottom Navigation"
        className={`md:hidden fixed bottom-3 inset-x-0 z-50 flex justify-center pointer-events-none px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] ${className}`}
      >
        <div className="pointer-events-auto filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]">
          <LiquidNavbar
            items={items}
            active={activeIndex}
            onChange={handleIndexChange}
            tone="dark"
            sound={false}
          />
        </div>
      </nav>
    </>
  )
}

export default Navigation
