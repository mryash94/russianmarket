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

// Curated fictional collector names for authenticity
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

// Visual Identity Configurations for the 3 Categories
const CATEGORY_STYLES: Record<
  CardCategory,
  {
    bgGradient: string
    backBgGradient: string
    rimGradient: string
    foilGradient: string
    accentColor: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    chipGradient: string
    chipBorder: string
    watermarkColor: string
    prefix: string
  }
> = {
  VISA: {
    bgGradient: 'radial-gradient(ellipse at 80% 0%, #0d284f 0%, #061730 45%, #030c1c 100%)',
    backBgGradient: 'radial-gradient(ellipse at 20% 100%, #092040 0%, #051429 50%, #020914 100%)',
    rimGradient: 'linear-gradient(135deg, rgba(56,189,248,0.7) 0%, rgba(255,255,255,0.3) 45%, rgba(14,165,233,0.6) 100%)',
    foilGradient: 'linear-gradient(115deg, #38bdf8 0%, #818cf8 25%, #00f0ff 50%, #60a5fa 75%, #38bdf8 100%)',
    accentColor: '#00F0FF',
    badgeBg: 'rgba(0, 240, 255, 0.14)',
    badgeText: '#38BDF8',
    badgeBorder: 'rgba(0, 240, 255, 0.4)',
    chipGradient: 'linear-gradient(135deg, #e6c86e 0%, #fef3c7 35%, #b48c28 70%, #d4af37 100%)',
    chipBorder: 'rgba(230, 200, 110, 0.7)',
    watermarkColor: 'rgba(56, 189, 248, 0.08)',
    prefix: '4716',
  },
  MASTERCARD: {
    bgGradient: 'radial-gradient(ellipse at 80% 0%, #3a0d16 0%, #1f060c 45%, #0c0205 100%)',
    backBgGradient: 'radial-gradient(ellipse at 20% 100%, #2e0911 0%, #170408 50%, #0a0104 100%)',
    rimGradient: 'linear-gradient(135deg, rgba(244,63,94,0.7) 0%, rgba(255,255,255,0.3) 45%, rgba(249,115,22,0.6) 100%)',
    foilGradient: 'linear-gradient(115deg, #f87171 0%, #fb923c 25%, #f43f5e 50%, #fbbf24 75%, #f87171 100%)',
    accentColor: '#FF3344',
    badgeBg: 'rgba(244, 63, 94, 0.14)',
    badgeText: '#FB7185',
    badgeBorder: 'rgba(244, 63, 94, 0.4)',
    chipGradient: 'linear-gradient(135deg, #f59e0b 0%, #fef08a 35%, #b45309 70%, #d97706 100%)',
    chipBorder: 'rgba(245, 158, 11, 0.7)',
    watermarkColor: 'rgba(244, 63, 94, 0.08)',
    prefix: '5412',
  },
  RUPAY: {
    bgGradient: 'radial-gradient(ellipse at 80% 0%, #0d3822 0%, #072214 45%, #03120a 100%)',
    backBgGradient: 'radial-gradient(ellipse at 20% 100%, #0a2d1b 0%, #051c10 50%, #020e08 100%)',
    rimGradient: 'linear-gradient(135deg, rgba(52,211,153,0.7) 0%, rgba(255,255,255,0.3) 45%, rgba(245,158,11,0.6) 100%)',
    foilGradient: 'linear-gradient(115deg, #34d399 0%, #6ee7b7 25%, #10b981 50%, #fcd34d 75%, #34d399 100%)',
    accentColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.14)',
    badgeText: '#34D399',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
    chipGradient: 'linear-gradient(135deg, #d97706 0%, #fef08a 35%, #92400e 70%, #b45309 100%)',
    chipBorder: 'rgba(217, 119, 6, 0.7)',
    watermarkColor: 'rgba(16, 185, 129, 0.08)',
    prefix: '6081',
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
  // Determine canonical category (strictly VISA | MASTERCARD | RUPAY)
  const category: CardCategory = (
    product?.category ||
    product?.collection ||
    propCategory ||
    'VISA'
  ) as CardCategory

  const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.VISA

  const name = product?.name || propName || 'Collectible Sovereign'
  const editionNumber = product?.editionNumber ?? propEditionNumber ?? 1
  const editionTotal = product?.editionTotal ?? propEditionTotal ?? 50

  // Derive stable fictional collector name
  const nameIndex =
    Math.abs(
      (product?.id || name || 'default')
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) + editionNumber,
    ) % FICTIONAL_COLLECTOR_NAMES.length

  const holder = propHolder || FICTIONAL_COLLECTOR_NAMES[nameIndex]

  // Stable fictional decorative card number for front
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
      if (!interactive || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const rotY = (px - 0.5) * 16
      const rotX = -(py - 0.5) * 12
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

  // Non-blocking mobile touch handling (respects vertical scroll)
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
    // Only trigger flip on clear horizontal swipe; vertical motion scrolls page naturally
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
        className={`relative w-full rounded-[20px] transition-transform duration-500 ease-out cursor-pointer shadow-xl ${
          interactive ? 'active:scale-[0.98]' : ''
        }`}
        style={{
          aspectRatio: '1.586 / 1',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${isFlipped ? 180 : 0 + tilt.y}deg) rotateX(${tilt.x}deg)`,
          touchAction: 'pan-y',
        }}
      >
        {/* Soft shadow */}
        <div
          className="absolute -bottom-3 left-[6%] right-[6%] h-8 rounded-[50%] blur-xl pointer-events-none opacity-60"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        />

        {/* ======================================================== */}
        {/* FRONT FACE                                              */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 rounded-[20px] overflow-hidden p-3.5 sm:p-5 flex flex-col justify-between border border-white/[0.12]"
          style={{
            background: catStyle.bgGradient,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Metallic rim reflection */}
          <div
            className="absolute inset-0 rounded-[20px] pointer-events-none p-[1px] opacity-75"
            style={{
              background: catStyle.rimGradient,
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Prismatic Sheen Layer */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 mix-blend-color-dodge transition-opacity duration-300"
            style={{
              backgroundImage: catStyle.foilGradient,
              backgroundSize: '220% 220%',
              backgroundPosition: `${50 + tilt.y * 2}% ${50 + tilt.x * 2}%`,
            }}
          />

          {/* Micro Guilloché Watermark */}
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 w-44 h-44 pointer-events-none rounded-full"
            style={{
              background: `radial-gradient(circle, ${catStyle.watermarkColor} 0%, transparent 68%)`,
            }}
          >
            <div className="w-full h-full rounded-full border border-white/[0.04]" />
          </div>

          {/* FRONT TOP ROW: Russian Market Brand & Category Badge */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-[6px] bg-gradient-to-br from-white/20 to-white/5 border border-white/25 flex items-center justify-center shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-current"
                  aria-hidden="true"
                >
                  <path d="M12 2L3 7V12C3 17.5 7 21.5 12 22C17 21.5 21 17.5 21 12V7L12 2Z" />
                </svg>
              </div>
              <span className="font-space font-extrabold text-[11px] sm:text-[13px] tracking-[0.14em] text-white uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                RUSSIAN MARKET
              </span>
            </div>

            <div
              className="px-2 sm:px-2.5 py-0.5 rounded-full font-mono-code text-[9px] sm:text-[10px] font-bold tracking-widest uppercase border backdrop-blur-sm"
              style={{
                background: catStyle.badgeBg,
                color: catStyle.badgeText,
                borderColor: catStyle.badgeBorder,
              }}
            >
              {category}
            </div>
          </div>

          {/* FRONT MIDDLE ROW: Realistic EMV Metallic Chip & Contactless Wave */}
          <div className="relative z-10 flex items-center justify-between my-auto pt-1 sm:pt-2">
            <div
              className="w-9 h-7 sm:w-11 sm:h-8 rounded-[6px] relative overflow-hidden shadow-inner flex-shrink-0"
              style={{
                background: catStyle.chipGradient,
                border: `1px solid ${catStyle.chipBorder}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3)',
              }}
            >
              <div className="absolute inset-0 border border-black/30 pointer-events-none" />
              <div className="absolute left-[30%] right-[30%] top-0 bottom-0 border-x border-black/25" />
              <div className="absolute top-[35%] bottom-[35%] left-0 right-0 border-y border-black/25" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/20" />
            </div>

            <svg
              className="w-5 h-5 text-white/50"
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
            <div
              className="font-mono-code text-[14px] sm:text-[17px] tracking-[0.16em] sm:tracking-[0.18em] text-white/95 font-semibold tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            >
              <span>{catStyle.prefix}</span>
              <span className="mx-1 sm:mx-2 text-white/40">••••</span>
              <span className="mx-1 sm:mx-2 text-white/40">••••</span>
              <span>{last4}</span>
            </div>
          </div>

          {/* FRONT BOTTOM ROW: Holder, Expiry & Category Emblem */}
          <div className="relative z-10 flex items-end justify-between gap-2 pt-1 border-t border-white/[0.08]">
            <div className="min-w-0 pr-1">
              <span className="block font-mono-code text-[8px] tracking-widest uppercase text-white/45">
                CARDHOLDER
              </span>
              <span className="block font-space font-bold text-[10px] sm:text-[12px] text-white uppercase tracking-tight truncate max-w-[140px] sm:max-w-[190px]">
                {holder}
              </span>
            </div>

            <div className="text-center px-1">
              <span className="block font-mono-code text-[8px] tracking-widest uppercase text-white/45">
                EXPIRES
              </span>
              <span className="block font-mono-code font-bold text-[10px] sm:text-[12px] text-white/90">
                12/30
              </span>
            </div>

            <div className="flex-shrink-0 flex items-center justify-end pl-1">
              {category === 'VISA' && (
                <span className="font-sans font-black italic tracking-tighter text-lg sm:text-2xl text-white drop-shadow-[0_2px_8px_rgba(0,240,255,0.6)]">
                  VISA
                </span>
              )}

              {category === 'MASTERCARD' && (
                <div className="flex items-center" aria-hidden="true">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#EB001B] shadow-[0_0_10px_rgba(235,0,27,0.5)]" />
                  <span className="-ml-2.5 sm:-ml-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F79E1B] mix-blend-screen shadow-[0_0_10px_rgba(247,158,27,0.5)]" />
                </div>
              )}

              {category === 'RUPAY' && (
                <div className="flex items-center gap-0.5 sm:gap-1" aria-hidden="true">
                  <span className="font-space font-extrabold tracking-tight text-xs sm:text-base text-white drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">
                    RuPay
                  </span>
                  <div className="flex flex-col -space-y-0.5">
                    <span className="w-2 h-0.5 sm:w-2.5 sm:h-1 bg-[#F97316] rounded-[1px] transform skew-x-[-20deg]" />
                    <span className="w-2 h-0.5 sm:w-2.5 sm:h-1 bg-[#10B981] rounded-[1px] transform skew-x-[-20deg]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BACK FACE — Minimal Premium Collectible Design          */}
        {/* Strictly: Russian Market Identity, Collector Name,       */}
        {/* Edition Number, Small Pattern, Digital Collectible Label */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 rounded-[20px] overflow-hidden flex flex-col justify-between p-4 sm:p-5 shadow-xl border border-white/[0.12]"
          style={{
            background: catStyle.backBgGradient,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Metallic rim reflection */}
          <div
            className="absolute inset-0 rounded-[20px] pointer-events-none p-[1px] opacity-75"
            style={{
              background: catStyle.rimGradient,
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Small subtle decorative guilloché rosette */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
            <svg viewBox="0 0 100 100" className="w-36 h-36 text-white stroke-current fill-none stroke-[0.5]">
              <circle cx="50" cy="50" r="45" />
              <circle cx="50" cy="50" r="35" />
              <circle cx="50" cy="50" r="25" />
              <polygon points="50,5 90,75 10,75" />
              <polygon points="50,95 90,25 10,25" />
            </svg>
          </div>

          {/* BACK TOP ROW: Russian Market Brand & Category */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-5 h-5 rounded-[5px] bg-white/10 border border-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current" aria-hidden="true">
                  <path d="M12 2L3 7V12C3 17.5 7 21.5 12 22C17 21.5 21 17.5 21 12V7L12 2Z" />
                </svg>
              </div>
              <span className="font-space font-bold text-[11px] sm:text-xs tracking-[0.14em] text-white uppercase">
                RUSSIAN MARKET
              </span>
            </div>

            <div
              className="px-2 py-0.5 rounded-full font-mono-code text-[9px] font-bold tracking-widest uppercase border"
              style={{
                background: catStyle.badgeBg,
                color: catStyle.badgeText,
                borderColor: catStyle.badgeBorder,
              }}
            >
              {category}
            </div>
          </div>

          {/* BACK CENTER: Fictional Collector Name & Clean Collectible Label */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 text-center">
            <span className="font-mono-code text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1">
              COLLECTOR
            </span>
            <h4 className="font-space font-bold text-sm sm:text-base text-white tracking-wide truncate max-w-[240px]">
              {holder}
            </h4>
            <div className="mt-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <span className="font-mono-code text-[8px] sm:text-[9px] tracking-widest uppercase text-cyan-400 font-medium">
                AUTHENTIC DIGITAL COLLECTIBLE
              </span>
            </div>
          </div>

          {/* BACK BOTTOM ROW: Edition Specification & Flip Prompt */}
          <div className="relative z-10 pt-2 border-t border-white/[0.08] flex items-center justify-between text-white/60">
            <span className="font-mono-code text-[9px] sm:text-[10px] font-semibold text-white/80">
              EDITION #{String(editionNumber).padStart(3, '0')} / {String(editionTotal).padStart(3, '0')}
            </span>

            <div className="flex items-center gap-1 font-mono-code text-[9px] text-cyan-400 hover:text-cyan-300 font-medium">
              <span>↻ Flip</span>
            </div>
          </div>
        </div>
      </div>

      {showFlipHint && (
        <div className="text-center mt-2">
          <span className="text-[10px] font-mono-code text-slate-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
            ↻ 3D Collectible • Tap to inspect reverse
          </span>
        </div>
      )}
    </div>
  )
}

export default RussianMarketCard
