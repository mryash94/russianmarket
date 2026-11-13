type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  showSubtitle?: boolean
  className?: string
}

export function RussianMarketLogo({
  size = 'md',
  showWordmark = true,
  showSubtitle = true,
  className = '',
}: LogoProps) {
  const iconSizes = {
    sm: { w: 28, h: 28, scale: 0.7 },
    md: { w: 38, h: 38, scale: 0.95 },
    lg: { w: 54, h: 54, scale: 1.35 },
  }

  const dim = iconSizes[size]

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Heraldic Cyber-Emblem */}
      <div
        className="relative flex items-center justify-center rounded-xl p-1.5 transition-transform hover:scale-105"
        style={{
          width: dim.w,
          height: dim.h,
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(251, 191, 36, 0.1) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rmCyanGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="rmGlow" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Hexagonal Outer Shield */}
          <polygon
            points="50,6 88,27 88,73 50,94 12,73 12,27"
            stroke="url(#rmCyanGold)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            fill="rgba(3, 7, 18, 0.7)"
          />

          {/* Inner Geometric Facets */}
          <polygon
            points="50,16 78,32 78,68 50,84 22,68 22,32"
            stroke="rgba(0, 240, 255, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />

          {/* Imperial Crown Crest Nodes */}
          <path
            d="M32 30 L40 20 L50 26 L60 20 L68 30"
            stroke="url(#rmCyanGold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="18" r="2.2" fill="#fbbf24" />
          <circle cx="50" cy="24" r="2.5" fill="#00f0ff" />
          <circle cx="60" cy="18" r="2.2" fill="#fbbf24" />

          {/* Russian Market Stylized "RM" Monogram */}
          {/* 'R' */}
          <path
            d="M36 40 V72 M36 40 H49 C55 40 57 45 55 49 C53 53 47 54 42 54 M42 54 L55 72"
            stroke="url(#rmGlow)"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 'M' Intertwined */}
          <path
            d="M52 72 V48 L62 61 L72 48 V72"
            stroke="url(#rmCyanGold)"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Ambient pulse dot */}
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
      </div>

      {/* Brand Wordmark & Tagline */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-space font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 ${
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
              }`}
            >
              RUSSIAN
            </span>
            <span
              className={`font-space font-extrabold tracking-wider text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)] ${
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
              }`}
            >
              MARKET
            </span>
          </div>

          {showSubtitle && (
            <span
              className={`font-mono-code uppercase tracking-widest text-slate-400 font-semibold ${
                size === 'sm' ? 'text-[8px] mt-0.5' : size === 'lg' ? 'text-[11px] mt-1' : 'text-[9px] mt-0.5'
              }`}
            >
              HAUTE DIGITAL COLLECTIBLES
            </span>
          )}
        </div>
      )}
    </div>
  )
}
