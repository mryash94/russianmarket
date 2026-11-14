import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Eye, ArrowRight } from 'lucide-react'
import { CollectibleCardVisual } from './CollectibleCardVisual'
import { formatINR } from '../lib/currency'
import type { Product } from '../types/product'

type CollectibleCardCarouselProps = {
  products: Product[]
  onSelectProduct: (product: Product) => void
  onQuickBuy: (product: Product) => void
}

export function CollectibleCardCarousel({
  products,
  onSelectProduct,
  onQuickBuy,
}: CollectibleCardCarouselProps) {
  const featured = products.filter((p) => p.isFeatured || p.isPopular).slice(0, 5)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (featured.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [featured.length])

  if (featured.length === 0) return null

  const active = featured[currentIndex]

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? featured.length - 1 : prev - 1))
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length)
  }

  const priceMinor = active.salePriceMinor && active.salePriceMinor < active.priceMinor
    ? active.salePriceMinor
    : active.priceMinor

  const originalPriceMinor = active.salePriceMinor && active.salePriceMinor < active.priceMinor
    ? active.priceMinor
    : null

  const isAvailable = active.availability === 'in_stock' || active.stockCount > 0

  return (
    <section aria-label="Featured Collectibles" className="w-full">
      <div className="relative w-full rounded-2xl bg-[#0c0e13] p-5 sm:p-6 border border-white/[0.07]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          {/* Card Visual Showcase */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full max-w-[340px] sm:max-w-[380px]">
              <CollectibleCardVisual product={active} size="md" interactive={true} />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous card"
                className="p-1.5 rounded-md bg-[#181c25] hover:bg-[#202530] text-[#9499a6] hover:text-[#ededed] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {featured.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentIndex
                        ? 'w-6 bg-[#ededed]'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next card"
                className="p-1.5 rounded-md bg-[#181c25] hover:bg-[#202530] text-[#9499a6] hover:text-[#ededed] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3.5 text-left">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono-code text-[11px] font-medium bg-[#181c25] text-[#ededed] border border-white/[0.08]">
                {active.category}
              </span>

              <span className="flex items-center gap-1.5 font-mono-code text-[11px] text-[#9499a6]">
                <span className={`status-beacon ${isAvailable ? 'active' : 'idle'}`} />
                <span>{isAvailable ? 'In stock' : 'Sold out'}</span>
              </span>
            </div>

            <div>
              <h2 className="font-space text-xl sm:text-2xl font-semibold text-[#ededed] tracking-tight">
                {active.name}
              </h2>
            </div>

            {/* Price Box */}
            <div className="p-3.5 rounded-xl bg-[#12151c] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono-code text-[#9499a6] block">
                  Price
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-space text-2xl font-semibold text-[#ededed] tabular-nums">
                    {formatINR(priceMinor)}
                  </span>
                  {originalPriceMinor && (
                    <span className="text-xs font-mono-code line-through text-[#666b7a] tabular-nums">
                      {formatINR(originalPriceMinor)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono-code text-[#9499a6] block">
                  Category
                </span>
                <span className="text-xs font-mono-code font-medium text-[#ededed] block mt-0.5">
                  {active.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onSelectProduct(active)}
                className="h-10 flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[#181c25] hover:bg-[#202530] text-xs font-medium text-[#ededed] border border-white/[0.08] transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#9499a6]" />
                <span>Details</span>
              </button>

              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => onQuickBuy(active)}
                className="btn-primary h-10 flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-medium disabled:opacity-50"
              >
                <span>BUY NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
