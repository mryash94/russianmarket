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
    brandAccent: string
  }
> = {
  VISA: {
    bgGradient: 'linear-gradient(135deg, #040c1a 0%, #071933 35%, #0b2548 70%, #08162d 100%)',
    backBgGradient: 'linear-gradient(135deg, #051020 0%, #081c38 50%, #040c18 100%)',
    rimGradient: 'linear-gradient(135deg, rgba(0,240,255,0.6) 0%, rgba(255,255,255,0.25) 45%, rgba(14,165,233,0.5) 100%)',
    foilGradient: 'linear-gradient(115deg, #38bdf8 0%, #818cf8 25%, #00f0ff 50%, #60a5fa 75%, #38bdf8 100%)',
    accentColor: '#00F0FF',
    badgeBg: 'rgba(0, 240, 255, 0.12)',
    badgeText: '#38BDF8',
    badgeBorder: 'rgba(0, 240, 255, 0.35)',
    chipGradient: 'linear-gradient(135deg, #d4af37 0%, #f3e5ab 35%, #aa7c11 70%, #d4af37 100%)',
    chipBorder: 'rgba(212, 175, 55, 0.6)',
    watermarkColor: 'rgba(0, 240, 255, 0.08)',
    brandAccent: 'text-cyan-400',
  },
  MASTERCARD: {
    bgGradient: 'linear-gradient(135deg, #0d0205 0%, #1c050b 35%, #2e0813 70%, #140307 100%)',
    backBgGradient: 'linear-gradient(135deg, #100306 0%, #22060e 50%, #0a0103 100%)',
    rimGradient: 'linear-gradient(135deg, rgba(235,0,27,0.6) 0%, rgba(255,255,255,0.25) 45%, rgba(247,158,27,0.5) 100%)',
    foilGradient: 'linear-gradient(115deg, #f87171 0%, #fb923c 25%, #f43f5e 50%, #fbbf24 75%, #f87171 100%)',
    accentColor: '#FF3344',
    badgeBg: 'rgba(235, 0, 27, 0.12)',
    badgeText: '#FB7185',
    badgeBorder: 'rgba(235, 0, 27, 0.35)',
    chipGradient: 'linear-gradient(135deg, #e5a639 0%, #ffd978 35%, #b27318 70%, #e5a639 100%)',
    chipBorder: 'rgba(229, 166, 57, 0.6)',
    watermarkColor: 'rgba(235, 0, 27, 0.08)',
    brandAccent: 'text-rose-400',
  },
  RUPAY: {
    bgGradient: 'linear-gradient(135deg, #021208 0%, #042414 35%, #083c22 70%, #031a0e 100%)',
    backBgGradient: 'linear-gradient(135deg, #03160a 0%, #062e1a 50%, #021007 100%)',
    rimGradient: 'linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(255,255,255,0.25) 45%, rgba(245,158,11,0.5) 100%)',
    foilGradient: 'linear-gradient(115deg, #34d399 0%, #6ee7b7 25%, #10b981 50%, #fcd34d 75%, #34d399 100%)',
    accentColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeText: '#34D399',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    chipGradient: 'linear-gradient(135deg, #d1a73d 0%, #fbe396 35%, #a67c17 70%, #d1a73d 100%)',
    chipBorder: 'rgba(209, 167, 61, 0.6)',
    watermarkColor: 'rgba(16, 185, 129, 0.08)',
    brandAccent: 'text-emerald-400',
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
  const holder = propHolder || `RM COLLECTOR • #${String(editionNumber).padStart(3, '0')}`

  // Derive stable fictional decorative card number
  const last4 =
    propLast4 ||
    (product?.sku ? product.sku.replace(/\D/g, '').slice(-4) : '') ||
    String(1000 + (editionNumber * 73) % 9000)

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
      // Max tilt degrees: 12
      const rotY = (px - 0.5) * 24
      const rotX = -(py - 0.5) * 16
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

  // Touch Swipe support
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
    // If swipe horizontal > 35px, trigger flip
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      setIsFlipped((prev) => !prev)
    }
    touchStartRef.current = null
  }

  return (
    <div
      className={`relative w-full select-none ${className}`}
      style={{ perspective: 1200 }}
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
        aria-label={`${category} collectible card: ${name}. Tap or click to flip.`}
        className={`relative w-full rounded-[18px] transition-transform duration-500 ease-out cursor-pointer ${
          interactive ? 'active:scale-[0.98]' : ''
        }`}
        style={{
          aspectRatio: '1.586 / 1',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${isFlipped ? 180 : 0 + tilt.y}deg) rotateX(${tilt.x}deg)`,
        }}
      >
        {/* Soft realistic drop shadow under card */}
        <div
          className="absolute -bottom-3 left-[6%] right-[6%] h-8 rounded-[50%] blur-xl pointer-events-none opacity-60"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        />

        {/* ======================================================== */}
        {/* FRONT FACE                                              */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 rounded-[18px] overflow-hidden p-3.5 sm:p-5 flex flex-col justify-between shadow-2xl border border-white/[0.12]"
          style={{
            background: catStyle.bgGradient,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Thin metallic reflective border */}
          <div
            className="absolute inset-0 rounded-[18px] pointer-events-none p-[1px] opacity-75"
            style={{
              background: catStyle.rimGradient,
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Holographic Prismatic Sheen Layer */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 mix-blend-color-dodge transition-opacity duration-300"
            style={{
              backgroundImage: catStyle.foilGradient,
              backgroundSize: '250% 250%',
              backgroundPosition: `${50 + tilt.y * 2}% ${50 + tilt.x * 2}%`,
            }}
          />

          {/* Micro-Noise Grain & Specular Guilloche */}
          <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/60" />

          {/* Center Guilloche Rosette Watermark */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none rounded-full border border-white/[0.04]"
            style={{
              background: `radial-gradient(circle, ${catStyle.watermarkColor} 0%, transparent 70%)`,
            }}
          >
            <div className="w-full h-full rounded-full border border-white/[0.03] animate-pulse" />
          </div>

          {/* FRONT TOP ROW: Russian Market Brand & Category Badge */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            {/* Russian Market Brand Wordmark & Shield (NO generic LOGO) */}
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

            {/* Category Edition Pill */}
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
            {/* Precision Metallic Chip with micro partitions */}
            <div
              className="w-9 h-7 sm:w-11 sm:h-8 rounded-[6px] relative overflow-hidden shadow-inner flex-shrink-0"
              style={{
                background: catStyle.chipGradient,
                border: `1px solid ${catStyle.chipBorder}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3)',
              }}
            >
              {/* Micro circuit pad division lines */}
              <div className="absolute inset-0 border border-black/30 pointer-events-none" />
              <div className="absolute left-[30%] right-[30%] top-0 bottom-0 border-x border-black/25" />
              <div className="absolute top-[35%] bottom-[35%] left-0 right-0 border-y border-black/25" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/20" />
            </div>

            {/* Contactless Wave Signal */}
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

          {/* FRONT DECORATIVE CARD NUMBER: Fictional & Non-functional */}
          <div className="relative z-10 my-0.5 sm:my-1">
            <div
              className="font-mono-code text-[14px] sm:text-[17px] tracking-[0.16em] sm:tracking-[0.18em] text-white/95 font-semibold tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.1)' }}
            >
              <span>4716</span>
              <span className="mx-1.5 sm:mx-2 text-white/40">••••</span>
              <span className="mx-1.5 sm:mx-2 text-white/40">••••</span>
              <span>{last4}</span>
            </div>
          </div>

          {/* FRONT BOTTOM ROW: Holder, Expiry & Category Emblem */}
          <div className="relative z-10 flex items-end justify-between gap-2 pt-1 border-t border-white/[0.08]">
            {/* Cardholder Name & Edition Allocation */}
            <div className="min-w-0 pr-1">
              <span className="block font-mono-code text-[8px] tracking-widest uppercase text-white/45">
                CARDHOLDER
              </span>
              <span className="block font-space font-bold text-[10px] sm:text-[12px] text-white uppercase tracking-tight truncate max-w-[140px] sm:max-w-[190px]">
                {holder}
              </span>
            </div>

            {/* Expiry Date */}
            <div className="text-center px-1">
              <span className="block font-mono-code text-[8px] tracking-widest uppercase text-white/45">
                EXPIRES
              </span>
              <span className="block font-mono-code font-bold text-[10px] sm:text-[12px] text-white/90">
                12/30
              </span>
            </div>

            {/* Category Brand Emblem */}
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
        {/* ======================================================== */}
        {/* BACK FACE — Luxury Digital Collectible Reverse           */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 rounded-[18px] overflow-hidden flex flex-col justify-between p-4 sm:p-5 shadow-2xl border border-white/[0.12]"
          style={{
            background: catStyle.backBgGradient,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Thin metallic reflective border */}
          <div
            className="absolute inset-0 rounded-[18px] pointer-events-none p-[1px] opacity-80"
            style={{
              background: catStyle.rimGradient,
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Subtle Guilloché Geometric Grid / Holographic Texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-screen"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, ${catStyle.accentColor} 1px, transparent 1px), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '16px 16px, 24px 24px',
            }}
          />

          {/* BACK TOP ROW: Branding & Category Indicator */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md border flex items-center justify-center shadow-sm"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-[2px]"
                  style={{ background: catStyle.accentColor }}
                />
              </div>
              <span className="font-space font-bold tracking-[0.14em] text-xs text-white uppercase">
                RUSSIAN MARKET
              </span>
            </div>

            <span
              className="px-2 py-0.5 rounded-full font-mono-code text-[9px] font-bold tracking-widest uppercase border backdrop-blur-sm"
              style={{
                background: catStyle.badgeBg,
                color: catStyle.badgeText,
                borderColor: catStyle.badgeBorder,
              }}
            >
              {category}
            </span>
          </div>

          {/* BACK CENTER: Haute Holographic Seal & Artwork Typography */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 text-center">
            {/* Holographic Medallion */}
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2px] mb-2 shadow-[0_0_20px_rgba(0,0,0,0.6)]"
              style={{
                background: catStyle.foilGradient,
                boxShadow: `0 0 24px ${catStyle.accentColor}33`,
              }}
            >
              <div className="w-full h-full rounded-full bg-[#070b14] flex items-center justify-center border border-white/20">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white/80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>

            {/* Artwork Name & Description */}
            <h4 className="font-space font-bold text-xs sm:text-sm text-white tracking-wide truncate max-w-[260px]">
              {name}
            </h4>
            <span className="font-mono-code text-[9px] sm:text-[10px] text-white/50 tracking-widest uppercase mt-0.5">
              CRYPTOGRAPHIC DIGITAL COLLECTIBLE
            </span>
          </div>

          {/* BACK BOTTOM ROW: Edition Specification & Flip Prompt */}
          <div className="relative z-10 pt-2 border-t border-white/[0.08] flex items-center justify-between text-white/60">
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-[9px] sm:text-[10px] font-semibold text-white/70">
                EDITION #{String(editionNumber).padStart(3, '0')} / {String(editionTotal).padStart(3, '0')}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="font-mono-code text-[8px] sm:text-[9px] text-white/40">
                VERIFIED SEAL
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono-code text-[9px] text-cyan-400/90 font-medium">
              <span>↻ Flip</span>
            </div>
          </div>
        </div>
      </div>

      {showFlipHint && (
        <div className="text-center mt-2">
          <span className="text-[10px] font-mono-code text-slate-400">
            ↻ 3D Interactive Card • Click or swipe to flip
          </span>
        </div>
      )}
    </div>
  )
}
