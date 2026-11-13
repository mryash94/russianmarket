type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

export function RussianMarketLogo({
  size = 'md',
  showWordmark = true,
  className = '',
}: LogoProps) {
  const dimensions = {
    sm: { box: 28, text: 'text-xs' },
    md: { box: 34, text: 'text-sm sm:text-base' },
    lg: { box: 44, text: 'text-lg sm:text-xl' },
  }

  const { box, text } = dimensions[size]

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Refined Geometric Shield Emblem */}
      <div
        className="relative flex items-center justify-center rounded-xl transition-transform hover:scale-102 flex-shrink-0"
        style={{
          width: box,
          height: box,
          background: 'linear-gradient(145deg, #121620 0%, #0a0d14 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rmMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#00f0ff" />
            </linearGradient>
          </defs>

          {/* Hexagonal Faceted Shield */}
          <polygon
            points="50,6 88,27 88,73 50,94 12,73 12,27"
            stroke="url(#rmMetallic)"
            strokeWidth="4"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Minimal RM Monogram */}
          {/* 'R' */}
          <path
            d="M36 38 V70 M36 38 H48 C54 38 56 43 54 47 C52 51 46 52 42 52 M42 52 L54 70"
            stroke="#ffffff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 'M' */}
          <path
            d="M52 70 V46 L62 59 L72 46 V70"
            stroke="#00f0ff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-space font-extrabold tracking-wider text-white ${text}`}
          >
            RUSSIAN
          </span>
          <span
            className={`font-space font-extrabold tracking-wider text-cyan-400 ${text}`}
          >
            MARKET
          </span>
        </div>
      )}
    </div>
  )
}
