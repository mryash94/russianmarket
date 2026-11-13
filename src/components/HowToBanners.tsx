import { Sparkles, Shield, KeyRound, Download, ArrowRight, MessageCircle } from 'lucide-react'

type HowToBannersProps = {
  onOpenSupport: () => void
  onExploreCards: () => void
}

export function HowToBanners({ onOpenSupport, onExploreCards }: HowToBannersProps) {
  const steps = [
    {
      num: '01',
      title: 'Select Collectible',
      desc: 'Browse verified editions (Midnight, Royal Blue, Crimson, Titanium, Gold, Limited).',
      icon: Sparkles,
      color: 'text-cyan-400',
    },
    {
      num: '02',
      title: 'Initiate Order',
      desc: 'Review immutable pricing snapshots with zero duplicate submission risk.',
      icon: Shield,
      color: 'text-blue-400',
    },
    {
      num: '03',
      title: 'Verified Settlement',
      desc: 'Modular gateway processing ensures zero fake credentials or payment leaks.',
      icon: KeyRound,
      color: 'text-violet-400',
    },
    {
      num: '04',
      title: 'Private Vault Delivery',
      desc: 'Instant entitlement created. Generate short-lived signed tokens for private master files.',
      icon: Download,
      color: 'text-emerald-400',
    },
  ]

  return (
    <div className="space-y-6 my-8">
      {/* How to Buy Guide */}
      <div className="glass-panel-glow rounded-3xl p-5 md:p-8 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              COLLECTOR PROTOCOL
            </span>
            <h3 className="font-cinzel text-xl md:text-2xl font-bold text-white">
              How To Acquire Haute Digital Collectibles
            </h3>
          </div>
          <button
            type="button"
            onClick={onExploreCards}
            className="flex items-center gap-1.5 text-xs font-mono-code font-bold text-cyan-400 hover:text-cyan-300 transition-colors self-start md:self-auto"
          >
            <span>DISCOVER EDITIONS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.num}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-code text-xl font-black text-white/20 group-hover:text-cyan-400/40 transition-colors">
                    {s.num}
                  </span>
                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <h4 className="font-space text-sm font-bold text-white mb-1">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* How to Download & Vault Security Banner + Support Concierge Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vault Banner */}
        <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-violet-400" />
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-violet-400">
                SECURE DIGITAL VAULT
              </span>
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white mb-2">
              How To Download Your Master Files
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
              Upon verified payment confirmation, access keys are linked to your authenticated customer profile.
              Each download request issues a short-lived signed cryptographic token valid for 15 minutes.
              Unpaid users are mathematically excluded from asset payloads.
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
            <span>ECDSA-256 ENCRYPTED TOKENS</span>
            <span className="text-cyan-400 font-bold">100% AIR-GAPPED VAULT</span>
          </div>
        </div>

        {/* 24/7 Concierge Support Banner */}
        <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                RUSSIAN MARKET CONCIERGE
              </span>
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white mb-2">
              Private Curatorial Support & Inquiries
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
              Have questions regarding edition allocations, physical counterpart commissions, or payment settlement?
              Our private concierge is connected 24/7 via the real-time Support Chat tab.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSupport}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl btn-violet text-xs font-semibold active:scale-95 transition-all self-start"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Open Private Concierge Chat</span>
          </button>
        </div>
      </div>
    </div>
  )
}
