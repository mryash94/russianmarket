import { useState, useMemo } from 'react'
import {
  Search,
  ArrowRight,
} from 'lucide-react'
import { CollectibleCardVisual } from '../../components/CollectibleCardVisual'
import { CollectibleCardCarousel } from '../../components/CollectibleCardCarousel'
import { formatINR } from '../../lib/currency'
import type { Product, CardCategory } from '../../types/product'

type CatalogPageProps = {
  products: Product[]
  onSelectProduct: (product: Product) => void
  onQuickBuy: (product: Product) => void
  initialSearchQuery?: string
}

// Exactly 3 Categories as mandated
const CATEGORIES: { id: CardCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Cards' },
  { id: 'VISA', label: 'VISA' },
  { id: 'MASTERCARD', label: 'MASTERCARD' },
  { id: 'RUPAY', label: 'RUPAY' },
]

export function CatalogPage({
  products,
  onSelectProduct,
  onQuickBuy,
  initialSearchQuery = '',
}: CatalogPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest')
  const [priceRange, setPriceRange] = useState<'all' | 'under_1000' | '1000_1500' | 'above_1500'>('all')

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    }

    if (priceRange === 'under_1000') {
      list = list.filter((p) => (p.salePriceMinor ?? p.priceMinor) < 100000)
    } else if (priceRange === '1000_1500') {
      list = list.filter((p) => {
        const pVal = p.salePriceMinor ?? p.priceMinor
        return pVal >= 100000 && pVal <= 150000
      })
    } else if (priceRange === 'above_1500') {
      list = list.filter((p) => (p.salePriceMinor ?? p.priceMinor) > 150000)
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.salePriceMinor ?? a.priceMinor) - (b.salePriceMinor ?? b.priceMinor))
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.salePriceMinor ?? b.priceMinor) - (a.salePriceMinor ?? a.priceMinor))
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    }

    return list
  }, [products, selectedCategory, searchQuery, sortBy, priceRange])

  return (
    <div className="space-y-6 pb-12">
      {/* Featured Carousel */}
      <CollectibleCardCarousel
        products={products}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
      />

      {/* Product Discovery & Category Filters */}
      <div id="catalogue-section" className="space-y-4 pt-1">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-space text-xl sm:text-2xl font-bold text-white tracking-tight">
            Collectible Catalogue
          </h2>

          <span className="font-mono-code text-xs text-slate-400">
            Showing <strong className="text-cyan-400">{filteredProducts.length}</strong> Editions
          </span>
        </div>

        {/* 3 Categories Filter Tabs (VISA | MASTERCARD | RUPAY) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-mono-code text-xs font-bold uppercase tracking-wider transition-all border ${
                  isSelected
                    ? cat.id === 'VISA'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                      : cat.id === 'MASTERCARD'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      : cat.id === 'RUPAY'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : 'bg-white/10 text-white border-white/30 shadow-md'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Filter Toolbar (Search, Price & Sorting) */}
        <div className="p-3 rounded-2xl glass-panel border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name..."
              className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Price Filter (INR) */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="glass-input px-2.5 py-1.5 rounded-xl text-xs bg-slate-950 text-slate-300 border-white/[0.08] flex-1 sm:flex-none"
            >
              <option value="all">All Prices</option>
              <option value="under_1000">Under ₹1,000</option>
              <option value="1000_1500">₹1,000 – ₹1,500</option>
              <option value="above_1500">Above ₹1,500</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input px-2.5 py-1.5 rounded-xl text-xs bg-slate-950 text-slate-300 border-white/[0.08] flex-1 sm:flex-none"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Cards Grid: Universal Card Design */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-white/[0.08] my-6">
          <p className="text-sm text-slate-300 font-medium mb-1">No cards found</p>
          <p className="text-xs text-slate-500 mb-4 font-sans">
            Try adjusting your search query or category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all')
              setSearchQuery('')
              setPriceRange('all')
            }}
            className="px-4 py-2 rounded-xl btn-primary text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const priceMinor =
              product.salePriceMinor && product.salePriceMinor < product.priceMinor
                ? product.salePriceMinor
                : product.priceMinor

            const originalPriceMinor =
              product.salePriceMinor && product.salePriceMinor < product.priceMinor
                ? product.priceMinor
                : null

            const isAvailable = product.availability === 'in_stock' || product.stockCount > 0

            return (
              <div
                key={product.id}
                className="group rounded-3xl glass-panel hover:glass-panel-elevated border border-white/[0.08] hover:border-white/[0.18] p-4 transition-all duration-200 flex flex-col justify-between"
              >
                {/* 1. Universal Interactive 3D Collectible Card Visual */}
                <div
                  className="mb-3.5 cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <CollectibleCardVisual product={product} size="md" interactive={true} />
                </div>

                {/* 2. Compact Product Information (Strictly: Name, Category, Price, Original Price, Availability, BUY NOW) */}
                <div className="space-y-3">
                  {/* Category & Availability Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono-code text-[9px] font-bold tracking-widest uppercase border ${
                        product.category === 'VISA'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40'
                          : product.category === 'MASTERCARD'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-400/40'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                      }`}
                    >
                      {product.category}
                    </span>

                    <span className="flex items-center gap-1 font-mono-code text-[10px] text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {isAvailable ? 'In Stock' : 'Sold Out'}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="font-space text-base font-bold text-white group-hover:text-cyan-400 transition-colors cursor-pointer truncate"
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {/* Price & Action Row */}
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-space font-extrabold text-lg text-white">
                          {formatINR(priceMinor)}
                        </span>
                        {originalPriceMinor && (
                          <span className="font-mono-code text-[11px] line-through text-slate-500">
                            {formatINR(originalPriceMinor)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onQuickBuy(product)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-xs font-bold active:scale-95 disabled:opacity-50 transition-all shadow-md"
                      >
                        <span>BUY NOW</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
