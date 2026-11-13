import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigError } from '../lib/supabase'
import {
  CatalogServiceError,
  fetchCatalog,
  fetchProductPage,
  type CatalogCategory,
} from '../services/catalogService'
import type { Product } from '../types/product'

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(supabase ? null : supabaseConfigError)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const categoryLabelsById = useRef<ReadonlyMap<string, { slug: string; name: string }>>(
    new Map(),
  )
  const pageRef = useRef(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!supabase) return

    const requestId = ++requestIdRef.current
    void fetchCatalog().then(({ categories: loadedCategories, firstPage }) => {
      if (requestIdRef.current !== requestId) return
      setCategories(loadedCategories)
      setProducts(firstPage.products)
      setHasMore(firstPage.hasMore)
      categoryLabelsById.current = firstPage.categoryLabelsById
      pageRef.current = 0
    }).catch((loadError: unknown) => {
      if (requestIdRef.current !== requestId) return
      console.error('BLACK X catalog loading failed.', loadError)
      setError(loadError instanceof CatalogServiceError
        ? loadError.message
        : 'The catalogue could not be loaded. Please try again.')
      setProducts([])
      setCategories([])
    }).finally(() => {
      if (requestIdRef.current === requestId) setLoading(false)
    })

    return () => {
      if (requestIdRef.current === requestId) requestIdRef.current += 1
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!supabase || loadingMore || !hasMore) return
    setLoadingMore(true)
    setMoreError(null)
    try {
      const nextPage = pageRef.current + 1
      const result = await fetchProductPage(nextPage, categoryLabelsById.current)
      setProducts((current) => {
        const existingIds = new Set(current.map(({ id }) => id))
        return [...current, ...result.products.filter(({ id }) => !existingIds.has(id))]
      })
      pageRef.current = nextPage
      setHasMore(result.hasMore)
    } catch (loadError) {
      console.error('BLACK X could not load another product page.', loadError)
      setMoreError(loadError instanceof CatalogServiceError
        ? loadError.message
        : 'More products could not be loaded. Please try again.')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore])

  return {
    products,
    categories,
    loading,
    error,
    hasMore,
    loadingMore,
    moreError,
    loadMore,
  }
}
