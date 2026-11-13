import React, { useState, useRef } from 'react'
import type { Product, CollectibleCollection } from '../types/product'

type CollectibleCardVisualProps = {
  product: Product
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
}

export function CollectibleCardVisual({
  product,
  size = 'md',
  interactive = true,
  className = '',
}: CollectibleCardVisualProps) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const collectionStyles: Record<
    CollectibleCollection,
    {
      gradient: string
      accentColor: string
      chipColor: string
      borderGlow: string
      patternSvg: string
    }
  > = {
    'Midnight Edition': {
      gradient: 'linear-gradient(135deg, #05070e 0%, #0d1224 50%, #160f29 100%)',
      accentColor: '#38bdf8',
      chipColor: '#7dd3fc',
      borderGlow: 'rgba(56, 189, 248, 0.4)',
      patternSvg: 'radial-gradient(circle at 70% 30%, rgba(56, 189, 248, 0.12), transparent 60%)',
    },
    'Royal Blue Edition': {
      gradient: 'linear-gradient(135deg, #031333 0%, #0c2556 50%, #051b44 100%)',
      accentColor: '#00f0ff',
      chipColor: '#38bdf8',
      borderGlow: 'rgba(0, 240, 255, 0.5)',
      patternSvg: 'radial-gradient(circle at 30% 70%, rgba(0, 240, 255, 0.18), transparent 60%)',
    },
    'Crimson Edition': {
      gradient: 'linear-gradient(135deg, #2a050d 0%, #4c0d1c 50%, #20040a 100%)',
      accentColor: '#f43f5e',
      chipColor: '#fb7185',
      borderGlow: 'rgba(244, 63, 94, 0.45)',
      patternSvg: 'radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.2), transparent 50%)',
    },
    'Titanium Edition': {
      gradient: 'linear-gradient(135deg, #18202d 0%, #283347 50%, #131924 100%)',
      accentColor: '#cbd5e1',
      chipColor: '#e2e8f0',
      borderGlow: 'rgba(203, 213, 225, 0.4)',
      patternSvg: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15), transparent 70%)',
    },
    'Gold Edition': {
      gradient: 'linear-gradient(135deg, #2b1f06 0%, #523a0d 50%, #201705 100%)',
      accentColor: '#fbbf24',
      chipColor: '#fde047',
      borderGlow: 'rgba(251, 191, 36, 0.5)',
      patternSvg: 'radial-gradient(circle at 20% 40%, rgba(251, 191, 36, 0.2), transparent 60%)',
    },
    'Limited Edition': {
      gradient: 'linear-gradient(135deg, #1e0b36 0%, #10214a 50%, #2a0b36 100%)',
      accentColor: '#d946ef',
      chipColor: '#00f0ff',
      borderGlow: 'rgba(217, 70, 239, 0.5)',
      patternSvg: 'radial-gradient(circle at 60% 60%, rgba(217, 70, 239, 0.2), transparent 60%)',
    },
  }

  const theme = collectionStyles[product.collection] || collectionStyles['Midnight Edition']

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotX = ((y - centerY) / centerY) * -12
    const rotY = ((x - centerX) / centerX) * 12

    setRotateX(rotX)
    setRotateY(rotY)
    setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 })
  }

  const handleMouseEnter = () => {
    if (interactive) setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (!interactive) return
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  const scaleClasses = {
    sm: 'w-[260px] h-[164px] p-3 text-xs',
    md: 'w-full aspect-[1.586/1] max-w-[380px] p-4 text-sm',
    lg: 'w-full aspect-[1.586/1] max-w-[460px] p-5 text-base',
  }

  return (
    <div
      className={`perspective-1000 select-none ${className}`}
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative overflow-hidden rounded-2xl transition-transform duration-200 ease-out flex flex-col justify-between shadow-2xl ${scaleClasses[size]}`}
        style={{
          background: theme.gradient,
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          border: `1px solid ${theme.borderGlow}`,
          boxShadow: isHovered
            ? `0 20px 40px -10px rgba(0,0,0,0.8), 0 0 30px ${theme.borderGlow}`
            : '0 12px 30px -8px rgba(0,0,0,0.6)',
        }}
      >
        {/* Holographic dynamic glare overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20 mix-blend-color-dodge transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.75 : 0.15,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.7) 0%, rgba(0,240,255,0.2) 30%, rgba(217,70,239,0.1) 60%, transparent 80%)`,
          }}
        />

        {/* Intricate Sacred Geometry / Guilloche Micro-Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 z-0"
          style={{ backgroundImage: theme.patternSvg }}
        >
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none">
            <defs>
              <pattern id={`cardPattern-${product.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 40 20 L 20 40 L 0 20 Z"
                  stroke={theme.accentColor}
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.3"
                />
                <circle cx="20" cy="20" r="8" stroke={theme.accentColor} strokeWidth="0.4" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#cardPattern-${product.id})`} />
          </svg>
        </div>

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center p-0.5"
              style={{
                background: 'rgba(0, 240, 255, 0.1)',
                border: `1px solid ${theme.accentColor}`,
              }}
            >
              <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                <polygon points="20,2 38,12 38,32 20,38 2,32 2,12" stroke={theme.accentColor} strokeWidth="3" />
                <path d="M14 16 L20 22 L26 16" stroke="#ffffff" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="font-space font-bold tracking-wider text-xs text-white">
              RUSSIAN MARKET
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full font-mono-code text-[10px] uppercase font-bold tracking-wider"
              style={{
                background: 'rgba(3, 7, 18, 0.75)',
                color: theme.accentColor,
                border: `1px solid ${theme.accentColor}44`,
              }}
            >
              {product.collection}
            </span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accentColor }} />
          </div>
        </div>

        {/* Card Center Area: Metallic Security Microchip & Artwork */}
        <div className="relative z-10 my-auto flex items-center justify-between">
          {/* Decorative Security Microchip */}
          <div
            className="w-12 h-9 rounded-lg relative overflow-hidden flex flex-col justify-around p-1 shadow-md"
            style={{
              background: `linear-gradient(135deg, ${theme.chipColor} 0%, #94a3b8 50%, ${theme.chipColor} 100%)`,
              border: '1px solid rgba(255,255,255,0.5)',
            }}
          >
            <div className="w-full h-px bg-black/40" />
            <div className="w-full h-px bg-black/40" />
            <div className="w-full h-px bg-black/40" />
            <div className="absolute inset-x-3 inset-y-1 border border-black/30 rounded-sm pointer-events-none" />
            {/* Hologram Contact Microdot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-900/60 border border-cyan-300" />
          </div>

          {/* Hologram Emblem Centerpiece */}
          <div className="text-right">
            <span className="font-cinzel text-lg md:text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 block drop-shadow-md">
              {product.name}
            </span>
            <span className="font-mono-code text-[10px] text-slate-400 block tracking-wider">
              SKU: {product.sku}
            </span>
          </div>
        </div>

        {/* Bottom Metadata Row */}
        <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-2.5">
          <div>
            <span className="font-mono-code text-[9px] uppercase tracking-widest text-slate-400 block">
              EDITION ALLOCATION
            </span>
            <span className="font-space font-semibold text-xs text-white">
              #{String(product.editionNumber).padStart(3, '0')} / {product.editionTotal} MINTED
            </span>
          </div>

          <div className="text-right">
            <span className="font-mono-code text-[9px] uppercase tracking-widest text-slate-400 block">
              DIGITAL ASSET
            </span>
            <span
              className="font-mono-code text-xs font-bold"
              style={{ color: theme.accentColor }}
            >
              CRYPTOGRAPHIC VAULT
            </span>
          </div>
        </div>

        {/* Fictional Disclaimer Watermark (Compliance requirement) */}
        <div className="absolute bottom-1 inset-x-0 text-center pointer-events-none opacity-40">
          <span className="text-[7px] font-mono-code uppercase tracking-wider text-slate-500">
            DIGITAL ARTWORK COLLECTIBLE • NOT A FINANCIAL OR PAYMENT CARD
          </span>
        </div>
      </div>
    </div>
  )
}
