import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Zap,
} from 'lucide-react'
import { CollectibleCardVisual } from '../../components/CollectibleCardVisual'
import { CollectibleCardCarousel } from '../../components/CollectibleCardCarousel'
import { HowToBanners } from '../../components/HowToBanners'
import type { Product, CollectibleCollection } from '../../types/product'

type CatalogPageProps = {
  products: Product[]
  onSelectProduct: (product: Product) => void
  onAddToCart: (product: Product) => void
  onQuickBuy: (product: Product) => void
  onOpenSupport: () => void
  initialSearchQuery?: string
}

const COLLECTIONS: { id: CollectibleCollection | 'all'; label: string }[] = [
  { id: 'all', label: 'All Collections' },
  { id: 'Midnight Edition', label: 'Midnight Edition' },
  { id: 'Royal Blue Edition', label: 'Royal Blue Edition' },
  { id: 'Crimson Edition', label: 'Crimson Edition' },
  { id: 'Titanium Edition', label: 'Titanium Edition' },
  { id: 'Gold Edition', label: 'Gold Edition' },
  { id: 'Limited Edition', label: 'Limited Edition' },
]

export function CatalogPage({
  products,
  onSelectProduct,
  onAddToCart,
  onQuickBuy,
  onOpenSupport,
  initialSearchQuery = '',
}: CatalogPageProps) {
  const [selectedCollection, setSelectedCollection] = useState<CollectibleCollection | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest')
  const [priceRange, setPriceRange] = useState<'all' | 'under_400' | '400_600' | 'above_600'>('all')

  const filteredProducts = useMemo(() => {
    let list = [...products]

    // Collection filter
    if (selectedCollection !== 'all') {
      list = list.filter((p) => p.collection === selectedCollection)
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q),
      )
    }

    // Price range
    if (priceRange === 'under_400') {
      list = list.filter((p) => (p.salePriceMinor ?? p.priceMinor) < 40000)
    } else if (priceRange === '400_600') {
      list = list.filter((p) => {
        const pVal = p.salePriceMinor ?? p.priceMinor
        return pVal >= 40000 && pVal <= 60000
      })
    } else if (priceRange === 'above_600') {
      list = list.filter((p) => (p.salePriceMinor ?? p.priceMinor) > 60000)
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.salePriceMinor ?? a.priceMinor) - (b.salePriceMinor ?? b.priceMinor))
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.salePriceMinor ?? b.priceMinor) - (a.salePriceMinor ?? a.priceMinor))
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
    } else {
      // Newest
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    }

    return list
  }, [products, selectedCollection, searchQuery, sortBy, priceRange])

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Ultra-Premium Featured Carousel */}
      <CollectibleCardCarousel
        products={products}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
      />

      {/* 2. Collection Filters & Discovery Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
              ORIGINAL DIGITAL ARTIFACTS
            </span>
            <h2 className="font-cinzel text-xl md:text-2xl font-bold text-white">
              Haute Collectible Catalogue
            </h2>
          </div>

          <span className="font-mono-code text-xs text-slate-400">
            SHOWING <strong className="text-cyan-400">{filteredProducts.length}</strong> VERIFIED EDITIONS
          </span>
        </div>

        {/* Collection Filter Pills (Horizontal Scrolling on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pr-4">
          {COLLECTIONS.map((c) => {
            const isSelected = selectedCollection === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCollection(c.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-space text-xs font-semibold tracking-wider transition-all duration-200 border ${
                  isSelected
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'bg-white/5 text-slate-400 hover:text-white border-white/5 hover:border-white/10'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Filter Bar: Search, Price Filter, Sort dropdown */}
        <div className="p-3 rounded-2xl glass-panel border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Quick Search */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, Collection, Name..."
              className="w-full glass-input pl-9 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
            />
          </div>

          {/* Price Range Filter */}
          <div className="sm:col-span-4 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="w-full glass-input px-3 py-1.5 rounded-xl text-xs bg-slate-900 text-slate-200 border-white/10"
            >
              <option value="all">All Prices</option>
              <option value="under_400">Under $400</option>
              <option value="400_600">$400 – $600</option>
              <option value="above_600">$600+</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="sm:col-span-3 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full glass-input px-3 py-1.5 rounded-xl text-xs bg-slate-900 text-slate-200 border-white/10"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Rare / Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Product Cards Grid (Mobile 1 col, Tablet 2 col, Desktop 3 col) */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-white/10 my-8">
          <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-60" />
          <h3 className="font-cinzel text-lg font-bold text-white mb-1">No Collectibles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 font-sans">
            No items matched your current filter criteria. Try adjusting your search query or collection selector.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCollection('all')
              setSearchQuery('')
              setPriceRange('all')
            }}
            className="px-4 py-2 rounded-xl btn-cyan text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const formattedPrice = `$${(product.priceMinor / 100).toFixed(2)}`
            const formattedSale = product.salePriceMinor
              ? `$${(product.salePriceMinor / 100).toFixed(2)}`
              : null

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-3xl glass-panel hover:glass-panel-glow border border-white/10 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30"
              >
                {/* Visual Collectible Card Artwork */}
                <div
                  className="cursor-pointer mb-4"
                  onClick={() => onSelectProduct(product)}
                >
                  <CollectibleCardVisual product={product} size="md" interactive={true} />
                </div>

                {/* Info & Lore */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[10px] text-slate-400">
                      SKU: <strong className="text-cyan-300">{product.sku}</strong>
                    </span>
                    {product.discountPercent && product.discountPercent > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono-code text-[10px] font-bold border border-rose-500/30">
                        -{product.discountPercent}% OFF
                      </span>
                    ) : (
                      <span className="font-mono-code text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {product.stockLabel}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="font-cinzel text-base font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-1"
                  >
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 font-sans leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price & Action Buttons */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-mono-code uppercase tracking-widest text-slate-400 block">
                      PRICE
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-space font-bold text-base text-white">
                        {formattedSale || formattedPrice}
                      </span>
                      {formattedSale && (
                        <span className="font-mono-code text-[10px] line-through text-slate-500">
                          {formattedPrice}
                        </span>
                      )}
                      <span className="text-[9px] font-mono-code text-cyan-400">USD</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className="p-2 rounded-xl glass-input text-slate-300 hover:text-white hover:border-cyan-400 active:scale-95 transition-all"
                      title="Add to Shopping Bag"
                      aria-label="Add to Bag"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onQuickBuy(product)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl btn-cyan text-xs font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>BUY NOW</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Protocol Banners (How to Buy & How to Download) */}
      <HowToBanners
        onOpenSupport={onOpenSupport}
        onExploreCards={() => {
          window.scrollTo({ top: 300, behavior: 'smooth' })
        }}
      />
    </div>
  )
}
