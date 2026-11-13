import { RussianMarketCard, type RussianMarketCardProps } from './RussianMarketCard'
import type { Product } from '../types/product'

export type CollectibleCardVisualProps = {
  product: Product
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
  showFlipHint?: boolean
}

export function CollectibleCardVisual({
  product,
  size = 'md',
  interactive = true,
  className = '',
  showFlipHint = false,
}: CollectibleCardVisualProps) {
  const sizeClasses = {
    sm: 'max-w-[280px]',
    md: 'max-w-[340px]',
    lg: 'max-w-[380px]',
  }[size]

  return (
    <RussianMarketCard
      product={product}
      interactive={interactive}
      showFlipHint={showFlipHint}
      className={`${sizeClasses} ${className}`}
    />
  )
}

export { RussianMarketCard }
export type { RussianMarketCardProps }
