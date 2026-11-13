import { Icon } from './Icon'
import { formatPrice } from '../lib/commerce'
import type { Product } from '../types/product'

type ProductArtworkProps = {
  product: Product
  variant?: 'card' | 'detail'
}

export function ProductArtwork({
  product,
  variant = 'card',
}: ProductArtworkProps) {
  return (
    <div
      className={`product-artwork product-artwork--${product.artwork} product-artwork--${variant}`}
      role="img"
      aria-label={`${product.name} artwork`}
    >
      <div className="artwork-grain" aria-hidden="true" />
      <div className="artwork-orbit artwork-orbit--one" aria-hidden="true" />
      <div className="artwork-orbit artwork-orbit--two" aria-hidden="true" />
      <div className="artwork-header">
        <span className="artwork-mark">BX<span>®</span></span>
        <span className="artwork-edition">DIGITAL EDITION <span>·</span> 00{product.artworkNumber}</span>
      </div>
      <div className="artwork-copy">
        <span>{product.artworkCaption}</span>
        <strong>{product.artworkTitle}</strong>
      </div>
      <div className="artwork-footer">
        <span>BLACK X <i>/</i> DIGITAL GOODS</span>
        <span className="artwork-value">
          {formatPrice(product.priceMinor, product.currency)}
        </span>
      </div>
      {variant === 'card' && (
        <span className="artwork-open" aria-hidden="true">
          <Icon name="arrow-up-right" size={16} strokeWidth={1.8} />
        </span>
      )}
    </div>
  )
}
