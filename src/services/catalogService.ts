import { supabase } from '../lib/supabase'
import type { Product, CardCategory } from '../types/product'

const PAGE_SIZE = 48

export type CatalogCategory = {
  id: string
  slug: string
  label: string
}

export type CatalogPage = {
  products: Product[]
  hasMore: boolean
  categoryLabelsById: ReadonlyMap<string, { slug: string; name: string }>
}

export type CatalogData = {
  categories: CatalogCategory[]
  firstPage: CatalogPage
}

type ProductRow = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  price_minor: number
  currency: string
  artwork_key: Product['artwork']
  artwork_number: number
  artwork_caption: string
  artwork_title: string
  specifications: unknown
}

type SelectionMerge = {
  cartItems: Record<string, number>
  wishlistIds: string[]
  products: Product[]
  unavailableSelections: number
}

export class CatalogServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'CatalogServiceError'
  }
}

export async function fetchCatalog(): Promise<CatalogData> {
  if (!supabase) {
    throw new CatalogServiceError('Supabase is not configured.')
  }

  const { data: categoryRows, error: categoryError } = await supabase
    .from('product_categories')
    .select('id, name, slug, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(100)

  if (categoryError) {
    throw new CatalogServiceError('Could not load product categories.', {
      cause: categoryError,
    })
  }

  const categoryLabelsById = new Map(
    (categoryRows ?? []).map(({ id, slug, name }) => [id, { slug, name }]),
  )
  const categories = (categoryRows ?? []).map(({ slug, name }) => ({
    id: slug,
    slug,
    label: name,
  }))

  const firstPage = await fetchProductPage(0, categoryLabelsById)
  return { categories, firstPage }
}

export async function fetchProductPage(
  page: number,
  categoryLabelsById: ReadonlyMap<string, { slug: string; name: string }>,
): Promise<CatalogPage> {
  if (!supabase) {
    throw new CatalogServiceError('Supabase is not configured.')
  }
  if (!Number.isSafeInteger(page) || page < 0) {
    throw new CatalogServiceError('Product page must be a non-negative integer.')
  }

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
    throw new CatalogServiceError('Product page is outside the supported range.')
  }

  const { data: rows, error } = await supabase
    .from('products')
    .select(
      'id, category_id, name, slug, description, price_minor, currency, artwork_key, artwork_number, artwork_caption, artwork_title, specifications',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new CatalogServiceError('Could not load products.', { cause: error })
  }

  const productRows = (rows ?? []) as ProductRow[]
  if (productRows.length === 0) {
    return { products: [], hasMore: false, categoryLabelsById }
  }

  const productIds = productRows.map(({ id }) => id)
  const { data: inventories, error: inventoryError } = await supabase
    .from('inventory')
    .select('product_id, available_quantity, reserved_quantity')
    .in('product_id', productIds)

  if (inventoryError) {
    throw new CatalogServiceError('Could not load product availability.', {
      cause: inventoryError,
    })
  }

  const inventoryByProduct = new Map(
    (inventories ?? []).map((inventory) => [inventory.product_id, inventory]),
  )

  return {
    products: mapProductRows(productRows, categoryLabelsById, inventoryByProduct),
    hasMore: productRows.length === PAGE_SIZE,
    categoryLabelsById,
  }
}

export async function mergeCustomerSelections(
  localCartItems: Record<string, number>,
  localWishlistIds: string[],
  products: Product[],
  userId: string,
): Promise<SelectionMerge> {
  if (!supabase) {
    throw new CatalogServiceError('Supabase is not configured.')
  }
  await assertAuthenticatedUser(userId)
  const localIds = [...new Set([...Object.keys(localCartItems), ...localWishlistIds])]
  const productIdByLocalId = await resolveProductIds(localIds, products)
  const translated = translateSelections(
    localCartItems,
    localWishlistIds,
    productIdByLocalId,
  )

  await assertAuthenticatedUser(userId)
  const { data: merged, error: mergeError } = await supabase.rpc(
    'merge_customer_selections',
    {
      p_cart_items: translated.cartItems,
      p_wishlist_ids: [...new Set(translated.wishlistIds)],
    },
  )
  if (mergeError) {
    throw new CatalogServiceError('Could not synchronize your saved selections.', {
      cause: mergeError,
    })
  }

  const result = parseSelectionMerge(merged)
  const mergedProductIds = [...new Set([
    ...Object.keys(result.cartItems),
    ...result.wishlistIds,
  ])]
  const { data: categoryRows, error: categoryError } = await supabase
    .from('product_categories')
    .select('id, slug, name')
    .eq('is_active', true)
    .limit(100)
  if (categoryError) {
    throw new CatalogServiceError('Could not load categories for your saved selections.', {
      cause: categoryError,
    })
  }
  const labels = new Map(
    (categoryRows ?? []).map(({ id, slug, name }) => [id, { slug, name }]),
  )
  const { data: selectionRows, error: selectionError } = mergedProductIds.length
    ? await supabase
        .from('products')
        .select(
          'id, category_id, name, slug, description, price_minor, currency, artwork_key, artwork_number, artwork_caption, artwork_title, specifications',
        )
        .in('id', mergedProductIds)
        .eq('status', 'active')
    : { data: [], error: null }
  if (selectionError) {
    throw new CatalogServiceError('Could not load products from your saved selections.', {
      cause: selectionError,
    })
  }
  const selectionProductRows = (selectionRows ?? []) as ProductRow[]
  const { data: selectionInventory, error: selectionInventoryError } =
    selectionProductRows.length
      ? await supabase
          .from('inventory')
          .select('product_id, available_quantity, reserved_quantity')
          .in('product_id', selectionProductRows.map(({ id }) => id))
      : { data: [], error: null }
  if (selectionInventoryError) {
    throw new CatalogServiceError('Could not load availability for saved products.', {
      cause: selectionInventoryError,
    })
  }
  const inventoryById = new Map(
    (selectionInventory ?? []).map((inventory) => [inventory.product_id, inventory]),
  )
  const selectionProducts = mapProductRows(selectionProductRows, labels, inventoryById)
  return {
    cartItems: result.cartItems,
    wishlistIds: result.wishlistIds,
    products: selectionProducts,
    unavailableSelections: translated.unavailableSelections,
  }
}

export async function syncCustomerSelections(
  cartItems: Record<string, number>,
  wishlistIds: string[],
  products: Product[],
  userId: string,
): Promise<void> {
  if (!supabase) {
    throw new CatalogServiceError('Supabase is not configured.')
  }
  await assertAuthenticatedUser(userId)
  const allIds = [...new Set([...Object.keys(cartItems), ...wishlistIds])]
  const productIdByLocalId = await resolveProductIds(allIds, products)
  const translated = translateSelections(
    cartItems,
    wishlistIds,
    productIdByLocalId,
    true,
  )
  await assertAuthenticatedUser(userId)
  const { error } = await supabase.rpc('sync_customer_selections', {
    p_cart_items: translated.cartItems,
    p_wishlist_ids: [...new Set(translated.wishlistIds)],
  })
  if (error) {
    throw new CatalogServiceError('Could not save your selections to your account.', {
      cause: error,
    })
  }
}

async function assertAuthenticatedUser(expectedUserId: string): Promise<void> {
  if (!supabase) {
    throw new CatalogServiceError('Supabase is not configured.')
  }
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw new CatalogServiceError('Could not confirm your account before syncing selections.', {
      cause: error,
    })
  }
  if (data.session?.user.id !== expectedUserId) {
    throw new CatalogServiceError(
      'Your account changed while selections were syncing. Please retry.',
    )
  }
}

async function resolveProductIds(
  localIds: string[],
  products: Product[],
): Promise<Map<string, string>> {
  if (!supabase) {
    throw new CatalogServiceError('Supabase is not configured.')
  }
  const knownProducts = products.filter((product) => localIds.includes(product.id))
  const unresolved = localIds.filter((id) => !knownProducts.some(
    (product) => product.id === id || product.slug === id,
  ))
  const slugs = [...new Set([
    ...knownProducts.map((product) => product.slug),
    ...unresolved,
  ])]
  const idCandidates = [...new Set([
    ...localIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)),
    ...knownProducts.map((product) => product.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id)),
  ])]
  const [bySlug, byId] = await Promise.all([
    slugs.length
      ? supabase.from('products').select('id, slug').eq('status', 'active').in('slug', slugs)
      : Promise.resolve({ data: [], error: null }),
    idCandidates.length
      ? supabase.from('products').select('id, slug').eq('status', 'active').in('id', idCandidates)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (bySlug.error || byId.error) {
    throw new CatalogServiceError('Could not match saved selections to the active catalogue.', {
      cause: bySlug.error ?? byId.error,
    })
  }
  const productIdByLocalId = new Map<string, string>()
  for (const row of [...(bySlug.data ?? []), ...(byId.data ?? [])]) {
    productIdByLocalId.set(row.slug, row.id)
    productIdByLocalId.set(row.id, row.id)
  }
  for (const product of knownProducts) {
    const productId = productIdByLocalId.get(product.slug)
    if (productId) productIdByLocalId.set(product.id, productId)
  }
  return productIdByLocalId
}

function translateSelections(
  cartItems: Record<string, number>,
  wishlistIds: string[],
  productIdByLocalId: ReadonlyMap<string, string>,
  requireAll = false,
) {
  const translatedCart = Object.entries(cartItems).flatMap(([id, quantity]) => {
    const product_id = productIdByLocalId.get(id)
    return product_id ? [{ product_id, quantity }] : []
  })
  const translatedWishlist = wishlistIds.flatMap((id) => {
    const product_id = productIdByLocalId.get(id)
    return product_id ? [product_id] : []
  })
  const unavailableSelections =
    Object.keys(cartItems).length + wishlistIds.length -
    translatedCart.length - translatedWishlist.length
  if (requireAll && unavailableSelections > 0) {
    throw new CatalogServiceError(
      'Some saved selections are no longer available and were not synchronized.',
    )
  }
  return { cartItems: translatedCart, wishlistIds: translatedWishlist, unavailableSelections }
}

function parseSelectionMerge(value: unknown): {
  cartItems: Record<string, number>
  wishlistIds: string[]
} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CatalogServiceError('The selection sync response was invalid.')
  }
  const response = value as Record<string, unknown>
  const rawCart = response.cart_items
  const rawWishlist = response.wishlist_ids
  if (
    typeof rawCart !== 'object' ||
    rawCart === null ||
    Array.isArray(rawCart) ||
    !Array.isArray(rawWishlist)
  ) {
    throw new CatalogServiceError('The selection sync response was invalid.')
  }
  const cartItems: Record<string, number> = {}
  for (const [id, quantity] of Object.entries(rawCart)) {
    if (!Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 99) {
      throw new CatalogServiceError('The selection sync response contained an invalid quantity.')
    }
    cartItems[id] = Number(quantity)
  }
  if (!rawWishlist.every((id) => typeof id === 'string')) {
    throw new CatalogServiceError('The selection sync response contained invalid wishlist items.')
  }
  return { cartItems, wishlistIds: rawWishlist }
}

function mapProductRows(
  rows: ProductRow[],
  categoryLabelsById: ReadonlyMap<string, { slug: string; name: string }>,
  inventoryByProduct: ReadonlyMap<
    string,
    { product_id: string; available_quantity: number; reserved_quantity: number }
  >,
): Product[] {
  return rows.map((row) => {
    const inventory = inventoryByProduct.get(row.id)
    const available = inventory
      ? Math.max(0, inventory.available_quantity - inventory.reserved_quantity)
      : 0
    const rawCategory = categoryLabelsById.get(row.category_id)?.name ?? row.category_id ?? 'VISA'
    let cardCat: CardCategory = 'MASTERCARD'
    const upper = String(rawCategory).toUpperCase()
    if (
      upper.includes('VISA') ||
      upper.includes('ROYAL') ||
      upper.includes('AZURE') ||
      upper.includes('TITANIUM') ||
      upper.includes('PLATINUM')
    ) {
      cardCat = 'VISA'
    } else if (
      upper.includes('RUPAY') ||
      upper.includes('EMERALD') ||
      upper.includes('JADE') ||
      upper.includes('GOLD')
    ) {
      cardCat = 'RUPAY'
    }
    return {
      id: row.id,
      sku: `RM-${row.artwork_number.toString().padStart(3, '0')}`,
      slug: row.slug,
      name: row.name,
      description: row.description ?? '',
      collection: cardCat,
      category: cardCat,
      categoryLabel: cardCat,
      priceMinor: row.price_minor,
      currency: 'INR',
      stockCount: available,
      stockLabel: inventory
        ? available > 0
          ? `${available} available`
          : 'Out of stock'
        : 'Available in Vault',
      availability: available > 0 ? 'in_stock' : 'sold_out',
      editionNumber: row.artwork_number,
      editionTotal: 100,
      artwork: row.artwork_key,
      artworkNumber: row.artwork_number,
      artworkCaption: row.artwork_caption,
      artworkTitle: row.artwork_title,
      images: ['/assets/cards/midnight-cipher.webp'],
      digitalAsset: {
        filename: `${row.slug}-vault-master.zip`,
        sizeBytes: 52428800,
        format: 'Master Cryptographic Asset',
      },
      status: 'active',
      specifications: Array.isArray(row.specifications)
        ? row.specifications.flatMap((specification) => {
            if (
              typeof specification === 'object' &&
              specification !== null &&
              'label' in specification &&
              'value' in specification &&
              typeof specification.label === 'string' &&
              typeof specification.value === 'string'
            ) {
              return [{ label: specification.label, value: specification.value }]
            }
            return []
          })
        : [],
    }
  })
}
