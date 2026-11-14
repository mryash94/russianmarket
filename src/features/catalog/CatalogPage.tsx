import { useState, useMemo } from 'react'
import {
  Search,
  ArrowRight,
  ChevronDown,
  X,
  Eye,
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

// Exactly 3 Categories as mandated (plus All cards)
const CATEGORIES: { id: CardCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All cards' },
  { id: 'VISA', label: 'Visa' },
  { id: 'MASTERCARD', label: 'Mastercard' },
  { id: 'RUPAY', label: 'RuPay' },
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
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
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
    <div className="space-y-5 sm:space-y-6">
      {/* Featured 3D Showcase Carousel (Desktop and Wide Displays) */}
      <div className="hidden lg:block">
        <CollectibleCardCarousel
          products={products}
          onSelectProduct={onSelectProduct}
          onQuickBuy={onQuickBuy}
        />
      </div>

      {/* Product Discovery & Category Filters (Mobile Starts Directly Below Header) */}
      <div id="catalogue-section" className="space-y-3 pt-1">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-space text-lg sm:text-xl font-semibold text-[#ededed] tracking-tight">
              Collectible Catalogue
            </h2>
            <p className="text-[11px] sm:text-xs text-[#9499a6] font-sans mt-0.5">
              Curated cryptographic digital editions • Sovereign vault settlement
            </p>
          </div>

          <span className="font-mono-code text-[11px] sm:text-xs text-[#9499a6] bg-[#12151c] px-2.5 py-1 rounded-md border border-white/[0.08] whitespace-nowrap tabular-nums">
            Showing <strong className="text-white font-medium">{filteredProducts.length}</strong> editions
          </span>
        </div>

        {/* 3 Categories Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3.5 sm:px-4 py-2 rounded-lg font-space text-xs font-medium tracking-wide transition-colors border whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#181c25] text-white border-white/20'
                    : 'bg-transparent text-[#9499a6] hover:text-white border-white/[0.06] hover:bg-white/[0.03]'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Filter Toolbar (Search, Price & Sorting with guaranteed screen fit) */}
        <div className="p-3 sm:p-4 rounded-xl bg-[#0c0e13] border border-white/[0.07] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Quick Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name..."
              className="w-full h-10 bg-[#181c25] border border-white/[0.08] focus:border-white/30 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                aria-label="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Responsive 2-Column Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2.5">
            {/* Price Filter (INR) */}
            <div className="relative min-w-0 w-full sm:w-36">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as any)}
                aria-label="Filter by price range"
                className="w-full h-10 appearance-none bg-[#181c25] border border-white/[0.08] focus:border-white/30 pl-3 pr-8 py-2 rounded-lg text-xs text-[#ededed] font-medium truncate cursor-pointer transition-colors"
              >
                <option value="all">All prices</option>
                <option value="under_1000">Under ₹1,000</option>
                <option value="1000_1500">₹1,000 – ₹1,500</option>
                <option value="above_1500">Above ₹1,500</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Order */}
            <div className="relative min-w-0 w-full sm:w-40">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort editions"
                className="w-full h-10 appearance-none bg-[#181c25] border border-white/[0.08] focus:border-white/30 pl-3 pr-8 py-2 rounded-lg text-xs text-[#ededed] font-medium truncate cursor-pointer transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price_asc">Price: Low to high</option>
                <option value="price_desc">Price: High to low</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-10 text-center bg-[#0c0e13] rounded-xl border border-white/[0.07] my-6">
          <p className="text-sm text-[#ededed] font-medium mb-1">No collectible editions found</p>
          <p className="text-xs text-[#9499a6] mb-4 font-sans">
            Try adjusting your search query, price filter, or category selection.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all')
              setSearchQuery('')
              setPriceRange('all')
            }}
            className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold"
          >
            Reset filters
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
                className="group rounded-2xl bg-[#0c0e13] border border-white/[0.07] hover:border-white/[0.14] p-4 sm:p-5 transition-colors duration-150 flex flex-col justify-between scroll-mt-24"
              >
                {/* 1. Universal Interactive 3D Collectible Card Visual */}
                <div
                  className="mb-3.5 flex justify-center cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <CollectibleCardVisual product={product} size="md" interactive={true} />
                </div>

                {/* 2. Compact Product Information */}
                <div className="space-y-3 pt-1">
                  {/* Category & Availability Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono-code text-[10px] font-medium tracking-wide uppercase bg-white/[0.05] text-[#ededed] border border-white/[0.08]">
                      {product.category}
                    </span>

                    <span className="flex items-center gap-1.5 font-mono-code text-[11px] text-[#9499a6]">
                      <span className={`status-beacon ${isAvailable ? 'active' : 'idle'}`} />
                      {isAvailable ? 'In stock' : 'Sold out'}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="font-space text-base font-semibold text-[#ededed] group-hover:text-white transition-colors cursor-pointer truncate"
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {/* Price & Action Row */}
                  <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-space font-bold text-lg text-[#ededed] tabular-nums">
                          {formatINR(priceMinor)}
                        </span>
                        {originalPriceMinor && (
                          <span className="font-mono-code text-[11px] line-through text-[#666b7a] tabular-nums">
                            {formatINR(originalPriceMinor)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="h-10 px-3 rounded-lg btn-ghost text-xs font-medium flex items-center gap-1 text-[#9499a6] hover:text-white transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline sm:inline">Details</span>
                      </button>

                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onQuickBuy(product)}
                        className="h-10 px-4 rounded-lg btn-primary text-xs font-semibold flex items-center gap-1.5 active:scale-98 disabled:opacity-40 transition-all"
                      >
                        <span>BUY NOW</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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

export default CatalogPage
