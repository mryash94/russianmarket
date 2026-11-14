import { useState, useRef, useCallback } from 'react'
import type { CardCategory, Product } from '../types/product'

export type RussianMarketCardProps = {
  product?: Product | null
  category?: CardCategory
  name?: string
  editionNumber?: number
  editionTotal?: number
  holder?: string
  interactive?: boolean
  className?: string
  fictionalLast4?: string
  showFlipHint?: boolean
}

// Curated fictional collector identities
const FICTIONAL_COLLECTOR_NAMES = [
  'ALEXEI V. MOROZOV',
  'ELENA M. ROSTOVA',
  'VIKTOR K. SOKOLOV',
  'DIMITRI S. VANCE',
  'SOPHIA L. CHEN',
  'MARCUS A. STERLING',
  'ISABELLA N. ROSSI',
  'NIKOLAI B. VOLKOV',
  'AARAV R. SHARMA',
  'KAVYA P. NAIR',
  'SERGEI T. IVANOV',
  'TATIANA E. BELOVA',
]

// Network emblem & subtle accent definition
const NETWORK_CONFIG: Record<
  CardCategory,
  {
    prefix: string
    accent: string
    badgeText: string
  }
> = {
  VISA: {
    prefix: '4716',
    accent: '#00f0ff',
    badgeText: '#38bdf8',
  },
  MASTERCARD: {
    prefix: '5412',
    accent: '#f87171',
    badgeText: '#fb7185',
  },
  RUPAY: {
    prefix: '6081',
    accent: '#34d399',
    badgeText: '#34d399',
  },
}

export function RussianMarketCard({
  product,
  category: propCategory,
  name: propName,
  editionNumber: propEditionNumber,
  editionTotal: propEditionTotal,
  holder: propHolder,
  interactive = true,
  className = '',
  fictionalLast4: propLast4,
  showFlipHint = false,
}: RussianMarketCardProps) {
  const category: CardCategory = (
    product?.category ||
    product?.collection ||
    propCategory ||
    'VISA'
  ) as CardCategory

  const config = NETWORK_CONFIG[category] || NETWORK_CONFIG.VISA

  const name = product?.name || propName || 'Collectible Sovereign'
  const editionNumber = product?.editionNumber ?? propEditionNumber ?? 1
  const editionTotal = product?.editionTotal ?? propEditionTotal ?? 50

  const nameIndex =
    Math.abs(
      (product?.id || name || 'default')
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) + editionNumber,
    ) % FICTIONAL_COLLECTOR_NAMES.length

  const holder = propHolder || FICTIONAL_COLLECTOR_NAMES[nameIndex]

  const last4 =
    propLast4 ||
    (product?.sku ? product.sku.replace(/\D/g, '').slice(-4) : '') ||
    String(1000 + (editionNumber * 73) % 9000).padStart(4, '0')

  // 3D Flip state
  const [isFlipped, setIsFlipped] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore touch moves to prevent vertical scroll stutter
      if (!interactive || !cardRef.current || e.pointerType === 'touch') return
      const rect = cardRef.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const rotY = (px - 0.5) * 12
      const rotX = -(py - 0.5) * 10
      setTilt({ x: rotX, y: rotY })
    },
    [interactive],
  )

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
  }, [])

  const handleFlip = useCallback(() => {
    if (!interactive) return
    setIsFlipped((prev) => !prev)
  }, [interactive])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!interactive || !touchStartRef.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setIsFlipped((prev) => !prev)
    }
    touchStartRef.current = null
  }

  return (
    <div
      className={`relative w-full select-none ${className}`}
      style={{ perspective: 1200, touchAction: 'pan-y' }}
    >
      <div
        ref={cardRef}
        role="button"
        tabIndex={interactive ? 0 : -1}
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleFlip()
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={`${category} collectible card: ${name}. Tap to flip.`}
        className="relative w-full rounded-2xl transition-transform duration-500 ease-out cursor-pointer shadow-2xl"
        style={{
          aspectRatio: '1.586 / 1',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${isFlipped ? 180 : 0 + tilt.y}deg) rotateX(${tilt.x}deg)`,
          touchAction: 'pan-y',
        }}
      >
        {/* Soft Ground Shadow */}
        <div
          className="absolute -bottom-2.5 left-[8%] right-[8%] h-6 rounded-[50%] blur-lg pointer-events-none opacity-50"
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
        />

        {/* ======================================================== */}
        {/* FRONT FACE — Obsidian Carbon Matte Surface               */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between border border-white/[0.12]"
          style={{
            background: 'radial-gradient(130% 130% at 15% 10%, #151821 0%, #0d0f15 55%, #07080b 100%)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Subtle micro guilloché watermark texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-64 h-64 text-white stroke-current fill-none stroke-[0.5]">
              <circle cx="100" cy="100" r="90" />
              <circle cx="100" cy="100" r="70" />
              <circle cx="100" cy="100" r="50" />
              <circle cx="100" cy="100" r="30" />
              <polygon points="100,10 180,150 20,150" />
              <polygon points="100,190 180,50 20,50" />
            </svg>
          </div>

          {/* FRONT TOP ROW: Brand Emblem & Category Badge */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[5px] bg-[#1a1e27] border border-white/20 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 text-white fill-current"
                  aria-hidden="true"
                >
                  <path d="M12 2L3 7V12C3 17.5 7 21.5 12 22C17 21.5 21 17.5 21 12V7L12 2Z" />
                </svg>
              </div>
              <span className="font-space font-semibold text-[11px] sm:text-[12px] tracking-[0.14em] text-[#ededed] uppercase">
                RUSSIAN MARKET
              </span>
            </div>

            <div className="px-2 py-0.5 rounded-md font-mono-code text-[9px] sm:text-[10px] font-medium tracking-wider uppercase bg-white/[0.06] text-[#ededed] border border-white/[0.1]">
              {category}
            </div>
          </div>

          {/* FRONT MIDDLE ROW: Brushed Metallic Chip & Contactless Glyph */}
          <div className="relative z-10 flex items-center justify-between my-auto pt-1 sm:pt-2">
            {/* Precision Metallic Chip */}
            <div
              className="w-9 h-7 sm:w-11 sm:h-8 rounded-[5px] relative overflow-hidden flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #d8bc74 0%, #fef3c7 35%, #a88220 70%, #caa43a 100%)',
                border: '1px solid rgba(216, 188, 116, 0.7)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3)',
              }}
            >
              <div className="absolute inset-0 border border-black/30 pointer-events-none" />
              <div className="absolute left-[30%] right-[30%] top-0 bottom-0 border-x border-black/25" />
              <div className="absolute top-[35%] bottom-[35%] left-0 right-0 border-y border-black/25" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/20" />
            </div>

            {/* Contactless Wave */}
            <svg
              className="w-5 h-5 text-white/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M15.5 2.5a13 13 0 0 1 0 19" />
            </svg>
          </div>

          {/* FRONT DECORATIVE CARD NUMBER */}
          <div className="relative z-10 my-0.5 sm:my-1">
            <div className="font-mono-code text-[14px] sm:text-[16px] tracking-[0.16em] sm:tracking-[0.18em] text-[#ededed] font-medium tabular-nums">
              <span>{config.prefix}</span>
              <span className="mx-1 sm:mx-1.5 text-white/35">••••</span>
              <span className="mx-1 sm:mx-1.5 text-white/35">••••</span>
              <span>{last4}</span>
            </div>
          </div>

          {/* FRONT BOTTOM ROW: Holder, Expiry & Category Network Mark */}
          <div className="relative z-10 flex items-end justify-between gap-2 pt-1 border-t border-white/[0.07]">
            <div className="min-w-0 pr-1">
              <span className="block font-mono-code text-[8px] tracking-widest uppercase text-white/40">
                CARDHOLDER
              </span>
              <span className="block font-space font-medium text-[10px] sm:text-[11px] text-[#ededed] uppercase tracking-tight truncate max-w-[140px] sm:max-w-[190px]">
                {holder}
              </span>
            </div>

            <div className="text-center px-1">
              <span className="block font-mono-code text-[8px] tracking-widest uppercase text-white/40">
                EXPIRES
              </span>
              <span className="block font-mono-code font-medium text-[10px] sm:text-[11px] text-white/80 tabular-nums">
                12/30
              </span>
            </div>

            <div className="flex-shrink-0 flex items-center justify-end pl-1">
              {category === 'VISA' && (
                <span className="font-sans font-bold italic tracking-tighter text-base sm:text-xl text-white/95">
                  VISA
                </span>
              )}

              {category === 'MASTERCARD' && (
                <div className="flex items-center" aria-hidden="true">
                  <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-[#EB001B]" />
                  <span className="-ml-2.5 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-[#F79E1B] mix-blend-screen" />
                </div>
              )}

              {category === 'RUPAY' && (
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span className="font-space font-bold tracking-tight text-xs sm:text-sm text-white">
                    RuPay
                  </span>
                  <div className="flex flex-col -space-y-0.5">
                    <span className="w-2 h-0.5 bg-[#F97316] rounded-[1px] transform skew-x-[-20deg]" />
                    <span className="w-2 h-0.5 bg-[#10B981] rounded-[1px] transform skew-x-[-20deg]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BACK FACE — Minimal Sovereign Vault Design               */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 border border-white/[0.12]"
          style={{
            background: 'radial-gradient(130% 130% at 20% 90%, #151821 0%, #0d0f15 55%, #07080b 100%)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Matte Black Magnetic Strip */}
          <div className="absolute top-4 inset-x-0 h-8 sm:h-9 bg-[#040507] border-y border-white/[0.05]" />

          {/* BACK CONTENT (Below Magnetic Strip) */}
          <div className="relative z-10 pt-10 sm:pt-11 flex flex-col justify-between flex-1">
            {/* Signature & Security Panel */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-7 sm:h-8 bg-[#181c25] rounded border border-white/[0.08] flex items-center px-2.5">
                <span className="font-mono-code text-[9px] sm:text-[10px] text-white/70 italic truncate">
                  {holder}
                </span>
              </div>
              <div className="w-12 h-7 sm:h-8 bg-[#12151c] rounded border border-white/[0.1] flex items-center justify-center font-mono-code text-[10px] font-bold text-white/90">
                002
              </div>
            </div>

            {/* Middle: Sovereign Specifications */}
            <div className="my-auto py-1">
              <div className="flex items-center justify-between text-[10px] font-mono-code text-white/50">
                <span>SECURITY LEVEL: APEX SOVEREIGN</span>
                <span>SETTLEMENT: INSTANT</span>
              </div>
              <p className="text-[9px] text-white/35 font-mono-code mt-0.5">
                Authentic cryptographic digital collectible. Fictional credential architecture.
              </p>
            </div>

            {/* BACK BOTTOM ROW: Edition Specification & Flip Action */}
            <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between">
              <span className="font-mono-code text-[9px] sm:text-[10px] font-medium text-white/80 tabular-nums">
                EDITION #{String(editionNumber).padStart(3, '0')} / {String(editionTotal).padStart(3, '0')}
              </span>

              <div className="flex items-center gap-1 font-mono-code text-[9px] text-slate-300 hover:text-white font-medium">
                <span>↻ Flip card</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFlipHint && (
        <div className="text-center mt-2">
          <span className="text-[10px] font-mono-code text-slate-400 bg-white/[0.04] px-3 py-1 rounded-md border border-white/[0.06]">
            ↻ 3D Collectible • Tap to inspect reverse
          </span>
        </div>
      )}
    </div>
  )
}

export default RussianMarketCard
