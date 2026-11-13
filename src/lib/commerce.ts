export type CartItems = Record<string, number>

export function formatPrice(priceMinor: number, currency = 'INR'): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  })
  return formatter.format(
    priceMinor / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readCartItems(
  serialized: string | null,
): CartItems {
  if (!serialized) return {}

  const parsed: unknown = JSON.parse(serialized)
  if (!isRecord(parsed)) throw new Error('Saved cart data is not an object.')
  if (Object.keys(parsed).length > 100) {
    throw new Error('Saved cart contains more than 100 products.')
  }

  const items: CartItems = {}

  for (const [id, quantity] of Object.entries(parsed)) {
    if (!id || !Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 99) {
      throw new Error(`Saved cart quantity for "${id}" is invalid.`)
    }
    items[id] = Number(quantity)
  }

  return items
}

export function readWishlistIds(
  serialized: string | null,
): string[] {
  if (!serialized) return []

  const parsed: unknown = JSON.parse(serialized)
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
    throw new Error('Saved wishlist data is invalid.')
  }
  if (parsed.length > 100) {
    throw new Error('Saved wishlist contains more than 100 products.')
  }

  return [...new Set(parsed.filter((id) => id.length > 0))]
}
