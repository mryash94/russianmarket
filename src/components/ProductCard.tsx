import { useState } from 'react'
import { Icon } from './Icon'
import { formatPrice } from '../lib/commerce'
import { ProductArtwork } from './ProductArtwork'
import type { Product } from '../types/product'

type ProductCardProps = {
  product: Product
  index: number
  isWishlisted: boolean
  onSelect: (product: Product) => void
  onToggleWishlist: (productId: string) => void
}

export function ProductCard({
  product,
  index,
  isWishlisted,
  onSelect,
  onToggleWishlist,
}: ProductCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const isAvailable = /^\d+ available$/.test(product.stockLabel)

  return (
    <article
      className={`product-card${isFlipped ? ' is-flipped' : ''}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="product-card-visual">
        <div className="product-card-visual-inner">
          <div className="product-card-face product-card-face--front">
            <button
              type="button"
              className="product-card-art-button"
              aria-label={`View details for ${product.name}`}
              onClick={() => onSelect(product)}
              tabIndex={isFlipped ? -1 : 0}
            >
              <ProductArtwork product={product} />
            </button>
            <button
              type="button"
              className="product-card-flip"
              aria-label={`Flip ${product.name} to see details`}
              aria-pressed={isFlipped}
              onClick={() => setIsFlipped(true)}
              tabIndex={isFlipped ? -1 : 0}
            >
              <Icon name="rotate-cw" size={15} aria-hidden="true" />
              <span>Flip for details</span>
            </button>
          </div>
          <div className="product-card-face product-card-face--back" aria-hidden={!isFlipped}>
            <div className="product-card-back-copy">
              <span className="section-kicker">PRODUCT DETAILS</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <dl>
                {product.specifications.slice(0, 3).map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <button
              type="button"
              className="product-card-flip product-card-flip--back"
              aria-label={`Show artwork for ${product.name}`}
              aria-pressed={isFlipped}
              onClick={() => setIsFlipped(false)}
              tabIndex={isFlipped ? 0 : -1}
            >
              <Icon name="rotate-cw" size={15} aria-hidden="true" />
              <span>Show artwork</span>
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        className={`wishlist-toggle${isWishlisted ? ' is-selected' : ''}`}
        aria-label={`${isWishlisted ? 'Remove' : 'Add'} ${product.name} ${isWishlisted ? 'from' : 'to'} wishlist`}
        aria-pressed={isWishlisted}
        onClick={() => onToggleWishlist(product.id)}
      >
        <Icon name="heart" size={17} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <div className="product-card-content">
        <div className="product-card-topline">
          <span className="category-label">{product.categoryLabel}</span>
        </div>
        <div className="product-title-row">
          <div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </div>
          <span className="product-price">
            {formatPrice(product.priceMinor, product.currency)}
          </span>
        </div>
        <div className="product-card-footer">
          <span className={`stock-label${isAvailable ? ' is-available' : ' is-unavailable'}`}>
            <Icon
              name={isAvailable ? 'circle-check' : 'alert-circle'}
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {product.stockLabel}
          </span>
          <button
            type="button"
            className="details-link"
            onClick={() => onSelect(product)}
          >
            Explore <Icon name="arrow-up-right" size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </article>
  )
}
