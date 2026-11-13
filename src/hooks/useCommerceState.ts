import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  readCartItems,
  readWishlistIds,
  type CartItems,
} from '../lib/commerce'
import { supabase } from '../lib/supabase'
import {
  CatalogServiceError,
  mergeCustomerSelections,
  syncCustomerSelections,
} from '../services/catalogService'
import type { Product } from '../types/product'

const CART_STORAGE_KEY = 'black-x-cart-v1'
const WISHLIST_STORAGE_KEY = 'black-x-wishlist-v1'
const SYNC_DEBOUNCE_MS = 400

type CommerceSnapshot = {
  cartItems: CartItems
  wishlistIds: string[]
  storageError: string | null
}

function scopedKey(key: string, userId: string | null): string {
  return userId ? `${key}-user-${userId}` : key
}

function readSelections(userId: string | null): CommerceSnapshot {
  const errors: string[] = []
  let cartItems: CartItems = {}
  let wishlistIds: string[] = []

  try {
    cartItems = readCartItems(
      window.localStorage.getItem(scopedKey(CART_STORAGE_KEY, userId)),
    )
  } catch (error) {
    console.error('BLACK X could not read the saved cart.', error)
    errors.push('Saved cart data is unavailable')
  }

  try {
    wishlistIds = readWishlistIds(
      window.localStorage.getItem(scopedKey(WISHLIST_STORAGE_KEY, userId)),
    )
  } catch (error) {
    console.error('BLACK X could not read the saved wishlist.', error)
    errors.push('Saved wishlist data is unavailable')
  }

  return {
    cartItems,
    wishlistIds,
    storageError: errors.length ? errors.join('; ') : null,
  }
}

function persistSelections(
  cartItems: CartItems,
  wishlistIds: string[],
  userId: string | null,
): string | null {
  const errors: string[] = []

  try {
    window.localStorage.setItem(
      scopedKey(CART_STORAGE_KEY, userId),
      JSON.stringify(cartItems),
    )
  } catch (error) {
    console.error('BLACK X could not save the cart in local storage.', error)
    errors.push('Cart changes may not persist')
  }

  try {
    window.localStorage.setItem(
      scopedKey(WISHLIST_STORAGE_KEY, userId),
      JSON.stringify(wishlistIds),
    )
  } catch (error) {
    console.error('BLACK X could not save the wishlist in local storage.', error)
    errors.push('Wishlist changes may not persist')
  }

  return errors.length ? errors.join('; ') : null
}

function mergeLocalSelections(
  guest: CommerceSnapshot,
  account: CommerceSnapshot,
): CommerceSnapshot {
  const cartItems = { ...guest.cartItems }
  for (const [productId, quantity] of Object.entries(account.cartItems)) {
    cartItems[productId] = Math.max(cartItems[productId] ?? 0, quantity)
  }
  return {
    cartItems,
    wishlistIds: [...new Set([...guest.wishlistIds, ...account.wishlistIds])],
    storageError: [guest.storageError, account.storageError].filter(Boolean).join('; ') || null,
  }
}

function selectionSignature(snapshot: CommerceSnapshot): string {
  return JSON.stringify({
    cartItems: Object.fromEntries(
      Object.entries(snapshot.cartItems).sort(([a], [b]) => a.localeCompare(b)),
    ),
    wishlistIds: [...snapshot.wishlistIds].sort(),
  })
}

export function useCommerceState(products: Product[], userId: string | null) {
  const [snapshot, setSnapshot] = useState(() => readSelections(null))
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)
  const [syncRevision, setSyncRevision] = useState(0)
  const [syncedProducts, setSyncedProducts] = useState<Product[]>([])
  const snapshotRef = useRef(snapshot)
  const activeUserRef = useRef<string | null>(null)
  const initializedAuthRef = useRef(false)
  const hydratedUserRef = useRef<string | null>(null)
  const lastSyncedSignatureRef = useRef<string | null>(null)
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve())
  const hydrationRequestRef = useRef(0)

  const saveSnapshot = useCallback((next: CommerceSnapshot) => {
    const saved = {
      ...next,
      storageError: persistSelections(
        next.cartItems,
        next.wishlistIds,
        activeUserRef.current,
      ),
    }
    snapshotRef.current = saved
    setSnapshot(saved)
    setSyncNotice(null)
  }, [])

  useEffect(() => {
    const userChanged = activeUserRef.current !== userId
    if (!userChanged && initializedAuthRef.current) {
      if (!userId || hydratedUserRef.current === userId) return
    }
    initializedAuthRef.current = true
    if (userChanged) {
      activeUserRef.current = userId
      hydratedUserRef.current = null
      lastSyncedSignatureRef.current = null
      setSyncError(null)
      setSyncNotice(null)
      setSyncedProducts([])
    }

    if (!userId || !supabase) {
      saveSnapshot(readSelections(null))
      return
    }

    const requestId = ++hydrationRequestRef.current
    const localSelections = mergeLocalSelections(
      readSelections(null),
      readSelections(userId),
    )
    saveSnapshot(localSelections)

    void mergeCustomerSelections(
      localSelections.cartItems,
      localSelections.wishlistIds,
      products,
      userId,
    ).then((merged) => {
      if (
        hydrationRequestRef.current !== requestId ||
        activeUserRef.current !== userId
      ) return
      const hydrated = {
        cartItems: merged.cartItems,
        wishlistIds: merged.wishlistIds,
        storageError: localSelections.storageError,
      }
      const saved = {
        ...hydrated,
        storageError: persistSelections(
          hydrated.cartItems,
          hydrated.wishlistIds,
          userId,
        ) ?? hydrated.storageError,
      }
      snapshotRef.current = saved
      setSyncedProducts(merged.products)
      lastSyncedSignatureRef.current = selectionSignature(saved)
      hydratedUserRef.current = userId
      setSnapshot(saved)
      setSyncError(null)
      setSyncNotice(merged.unavailableSelections
        ? `${merged.unavailableSelections} saved selection${merged.unavailableSelections === 1 ? '' : 's'} could not be matched to an active product and were not synced.`
        : null)
    }).catch((error: unknown) => {
      if (
        hydrationRequestRef.current !== requestId ||
        activeUserRef.current !== userId
      ) return
      console.error('BLACK X could not merge local and account selections.', error)
      setSyncError(error instanceof CatalogServiceError
        ? error.message
        : 'Your selections could not be synchronized. Please retry.')
    })

    return () => {
      if (hydrationRequestRef.current === requestId) {
        hydrationRequestRef.current += 1
      }
      if (
        activeUserRef.current === userId &&
        hydratedUserRef.current !== userId
      ) {
        initializedAuthRef.current = false
      }
    }
  }, [products, saveSnapshot, syncRevision, userId])

  useEffect(() => {
    if (
      !userId ||
      !supabase ||
      hydratedUserRef.current !== userId
    ) return

    const current = snapshotRef.current
    const signature = selectionSignature(current)
    if (signature === lastSyncedSignatureRef.current) return

    const timeout = window.setTimeout(() => {
      syncQueueRef.current = syncQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (activeUserRef.current !== userId) return
          const queuedSnapshot = snapshotRef.current
          await syncCustomerSelections(
            queuedSnapshot.cartItems,
            queuedSnapshot.wishlistIds,
            products,
            userId,
          )
          if (activeUserRef.current !== userId) return
          lastSyncedSignatureRef.current = selectionSignature(queuedSnapshot)
          setSyncError(null)
        })
        .catch((error: unknown) => {
          if (activeUserRef.current !== userId) return
          console.error('BLACK X account selection sync failed.', error)
          setSyncError(error instanceof CatalogServiceError
            ? error.message
            : 'Your latest selections could not be synchronized.')
        })
    }, SYNC_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [
    products,
    snapshot.cartItems,
    snapshot.wishlistIds,
    syncRevision,
    userId,
  ])

  const addToCart = useCallback((productId: string) => {
    const current = snapshotRef.current
    const currentQuantity = current.cartItems[productId] ?? 0
    if (currentQuantity >= 99) return
    if (currentQuantity === 0 && Object.keys(current.cartItems).length >= 100) return
    saveSnapshot({
      ...current,
      cartItems: { ...current.cartItems, [productId]: currentQuantity + 1 },
    })
  }, [saveSnapshot])

  const setCartQuantity = useCallback((productId: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity)) return
    const current = snapshotRef.current
    const cartItems = { ...current.cartItems }
    if (quantity < 1) {
      delete cartItems[productId]
    } else {
      cartItems[productId] = Math.min(99, Math.floor(quantity))
    }
    saveSnapshot({ ...current, cartItems })
  }, [saveSnapshot])

  const toggleWishlist = useCallback((productId: string) => {
    const current = snapshotRef.current
    const wishlistIds = current.wishlistIds.includes(productId)
      ? current.wishlistIds.filter((id) => id !== productId)
      : current.wishlistIds.length >= 100
        ? current.wishlistIds
        : [...current.wishlistIds, productId]
    saveSnapshot({ ...current, wishlistIds })
  }, [saveSnapshot])

  const retrySync = useCallback(() => {
    lastSyncedSignatureRef.current = null
    setSyncRevision((revision) => revision + 1)
  }, [])

  const cartCount = useMemo(
    () =>
      Object.values(snapshot.cartItems).reduce(
        (total, quantity) => total + quantity,
        0,
      ),
    [snapshot.cartItems],
  )

  return {
    cartItems: snapshot.cartItems,
    cartCount,
    storageError: snapshot.storageError,
    syncError,
    syncNotice,
    wishlistIds: snapshot.wishlistIds,
    syncedProducts,
    addToCart,
    setCartQuantity,
    toggleWishlist,
    retrySync,
  }
}
