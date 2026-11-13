import { ShieldCheck, Download, KeyRound, MessageCircle } from 'lucide-react'

type HowToBannersProps = {
  onOpenSupport: () => void
  onExploreCards: () => void
}

export function HowToBanners({ onOpenSupport }: HowToBannersProps) {
  const highlights = [
    {
      title: 'Original Editions',
      subtitle: 'Numbered collectible artwork',
      icon: ShieldCheck,
    },
    {
      title: 'Vault Delivery',
      subtitle: 'Encrypted master archive files',
      icon: Download,
    },
    {
      title: 'Verified Settlement',
      subtitle: 'Cryptographic order records',
      icon: KeyRound,
    },
    {
      title: '24/7 Concierge',
      subtitle: 'Direct curator support',
      icon: MessageCircle,
      action: onOpenSupport,
    },
  ]

  return (
    <section aria-label="Store Guarantees" className="my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {highlights.map((h, i) => {
          const Icon = h.icon
          const isInteractive = Boolean(h.action)

          return (
            <div
              key={i}
              onClick={h.action}
              className={`p-3 rounded-xl glass-panel border border-white/[0.06] flex items-center gap-3 transition-colors ${
                isInteractive
                  ? 'cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.12]'
                  : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-cyan-400">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-space text-xs font-semibold text-white block truncate">
                  {h.title}
                </span>
                <span className="text-[10px] text-slate-400 font-sans block truncate">
                  {h.subtitle}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
