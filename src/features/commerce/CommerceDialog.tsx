import { Icon } from '../../components/Icon'
import { ProductArtwork } from '../../components/ProductArtwork'
import { StatePanel } from '../../components/StatePanel'
import { formatPrice, type CartItems } from '../../lib/commerce'
import { trapDialogTab } from '../../lib/dialog'
import type { Product } from '../../types/product'

export type CommercePanel = 'cart' | 'wishlist'

type CommerceDialogProps = {
  panel: CommercePanel
  products: Product[]
  cartItems: CartItems
  unavailableSelectionCount: number
  onClose: () => void
  onProductSelect: (product: Product) => void
  onCartQuantityChange: (productId: string, quantity: number) => void
  onWishlistRemove: (productId: string) => void
}

export function CommerceDialog({
  panel,
  products,
  cartItems,
  unavailableSelectionCount,
  onClose,
  onProductSelect,
  onCartQuantityChange,
  onWishlistRemove,
}: CommerceDialogProps) {
  const isCart = panel === 'cart'
  const title = isCart ? 'Your bag' : 'Saved for later'
  const count = products.reduce(
    (total, product) => total + (isCart ? cartItems[product.id] ?? 0 : 1),
    unavailableSelectionCount,
  )
  const hasUnavailableSelections = unavailableSelectionCount > 0
  const subtotalsByCurrency = products.reduce((totals, product) => {
    totals.set(
      product.currency,
      (totals.get(product.currency) ?? 0) +
        product.priceMinor * (cartItems[product.id] ?? 0),
    )
    return totals
  }, new Map<string, number>())

  return (
    <div
      className="dialog-backdrop commerce-backdrop"
      role="presentation"
      onKeyDown={trapDialogTab}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="commerce-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="commerce-dialog-title"
      >
        <header className="commerce-dialog-header">
          <div>
            <p className="eyebrow">
              {isCart ? 'SHOPPING BAG' : 'SAVED ITEMS'}
            </p>
            <h2 id="commerce-dialog-title">{title}</h2>
            <p>{count} {count === 1 ? 'item' : 'items'} · saved on this device and synced when available</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={`Close ${title}`}
            onClick={onClose}
            autoFocus
          >
            <Icon name="x" size={19} />
          </button>
        </header>

        {hasUnavailableSelections && products.length > 0 && (
          <p className="commerce-unavailable-note" role="status">
            {unavailableSelectionCount} saved {unavailableSelectionCount === 1 ? 'selection is' : 'selections are'} unavailable until the catalogue reconnects. Your selections are preserved.
          </p>
        )}

        {products.length === 0 ? (
          <StatePanel
            kind={hasUnavailableSelections ? 'error' : 'empty'}
            title={hasUnavailableSelections
              ? 'Saved item details are unavailable'
              : isCart ? 'Your bag is empty' : 'Nothing saved just yet'}
            description={hasUnavailableSelections
              ? 'Your saved selections are preserved on this device, but product details cannot be shown until the catalogue reconnects.'
              : isCart
                ? 'Explore the collection and add a product to keep a selection.'
                : 'Save a product with the heart button to keep it here.'}
          />
        ) : (
          <div className="commerce-items">
            {products.map((product) => (
              <article className="commerce-item" key={product.id}>
                <button
                  type="button"
                  className="commerce-item-art"
                  aria-label={`View ${product.name}`}
                  onClick={() => onProductSelect(product)}
                >
                  <ProductArtwork product={product} />
                </button>
                <div className="commerce-item-copy">
                  <span className="category-label">{product.categoryLabel}</span>
                  <h3>{product.name}</h3>
                  <strong>{formatPrice(product.priceMinor, product.currency)}</strong>
                  {isCart ? (
                    <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                      <button
                        type="button"
                        aria-label={`Remove one ${product.name}`}
                        onClick={() =>
                          onCartQuantityChange(product.id, cartItems[product.id] - 1)
                        }
                      >
                        <Icon name="minus" size={14} />
                      </button>
                      <span aria-live="polite">{cartItems[product.id]}</span>
                      <button
                        type="button"
                        aria-label={`Add one ${product.name}`}
                        disabled={cartItems[product.id] >= 99}
                        onClick={() =>
                          onCartQuantityChange(product.id, cartItems[product.id] + 1)
                        }
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="remove-saved-button"
                      onClick={() => onWishlistRemove(product.id)}
                    >
                      Remove from saved
                    </button>
                  )}
                </div>
                {isCart && (
                  <button
                    type="button"
                    className="remove-cart-button"
                    aria-label={`Remove ${product.name} from bag`}
                    onClick={() => onCartQuantityChange(product.id, 0)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}

        {isCart && products.length > 0 && (
          <div className="commerce-summary">
            <div>
              <span>Subtotal</span>
              <div className="commerce-subtotals">
                {[...subtotalsByCurrency].map(([currency, subtotal]) => (
                  <strong key={currency}>{formatPrice(subtotal, currency)}</strong>
                ))}
              </div>
            </div>
            <p>
              {hasUnavailableSelections
                ? 'This subtotal includes only the items shown. No order or payment will be submitted.'
                : 'Prices are not locked for checkout. No order or payment will be submitted.'}
            </p>
            <button type="button" className="checkout-button" disabled>
              Checkout not connected
              <Icon name="lock-keyhole" size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
