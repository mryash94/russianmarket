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
    sm: { box: 26, text: 'text-xs' },
    md: { box: 32, text: 'text-sm' },
    lg: { box: 40, text: 'text-base' },
  }

  const { box, text } = dimensions[size]

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Graphite Emblem */}
      <div
        className="flex items-center justify-center rounded-lg border border-white/[0.12] bg-[#12151c] flex-shrink-0"
        style={{
          width: box,
          height: box,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-3/5 h-3/5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal Shield */}
          <polygon
            points="50,8 86,28 86,72 50,92 14,72 14,28"
            stroke="#ededed"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Minimal RM Monogram */}
          <path
            d="M36 38 V66 M36 38 H48 C53 38 55 42 53 46 C51 50 45 51 42 51 M42 51 L53 66"
            stroke="#ededed"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M54 66 V45 L62 57 L70 45 V66"
            stroke="#9499a6"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Solid Brand Wordmark - Quiet, Architectural */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-space font-semibold tracking-wider text-[#ededed] ${text}`}
          >
            RUSSIAN
          </span>
          <span
            className={`font-space font-semibold tracking-wider text-[#9499a6] ${text}`}
          >
            MARKET
          </span>
        </div>
      )}
    </div>
  )
}

export default RussianMarketLogo
