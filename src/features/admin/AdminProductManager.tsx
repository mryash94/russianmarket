import { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit2,
  X,
  Smartphone,
  Monitor,
  Sparkles,
} from 'lucide-react'
import type { Product, CardCategory } from '../../types/product'
import { formatINR } from '../../lib/currency'
import { storeEngine } from '../../services/storeEngine'

type AdminProductManagerProps = {
  products: Product[]
  onReload: () => Promise<void>
  onNotify?: (msg: string) => void
}

type ProductFormData = {
  name: string
  category: CardCategory
  priceINR: number
  editionTotal: number
  stockCount: number
  artwork: Product['artwork']
  artworkTitle: string
  artworkCaption: string
  imageUrl: string
  description: string
  status: 'active' | 'draft' | 'archived'
}

const DEFAULT_FORM: ProductFormData = {
  name: '',
  category: 'VISA',
  priceINR: 399,
  editionTotal: 100,
  stockCount: 100,
  artwork: 'hologram',
  artworkTitle: 'Elite Specimen',
  artworkCaption: 'Cryptographic verified edition',
  imageUrl: '',
  description: '',
  status: 'active',
}

const ARTWORK_OPTIONS: Product['artwork'][] = [
  'northstar',
  'pixel-plus',
  'studio-select',
  'hologram',
  'cyber-foil',
  'open-road',
]

export function AdminProductManager({ products, onReload, onNotify }: AdminProductManagerProps) {
  const [categoryFilter, setCategoryFilter] = useState<CardCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Quick Card Preview State
  const [cardPreviewProduct, setCardPreviewProduct] = useState<Product | null>(null)

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setFormData(DEFAULT_FORM)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      priceINR: Math.round(product.priceMinor / 100),
      editionTotal: product.editionTotal,
      stockCount: product.stockCount,
      artwork: product.artwork,
      artworkTitle: product.artworkTitle,
      artworkCaption: product.artworkCaption,
      imageUrl: product.images[0] || '',
      description: product.description,
      status: product.status,
    })
    setIsModalOpen(true)
  }

  const handleTogglePublish = async (product: Product) => {
    try {
      const willBeActive = product.status !== 'active'
      const updated = await storeEngine.toggleProductPublishStatus(product.id, willBeActive ? 'active' : 'draft')
      if (updated) {
        onNotify?.(`Product "${product.name}" ${willBeActive ? 'published to live catalog' : 'moved to draft'}`)
        await onReload()
      }
    } catch (err: any) {
      console.error('Failed to toggle publish status:', err)
      onNotify?.(`Error: ${err.message}`)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      const priceMinor = Math.round(formData.priceINR * 100)
      const sku = editingProduct
        ? editingProduct.sku
        : `RM-${formData.category}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      if (editingProduct) {
        await storeEngine.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          category: formData.category,
          collection: formData.category,
          priceMinor,
          editionTotal: Number(formData.editionTotal),
          stockCount: Number(formData.stockCount),
          artwork: formData.artwork,
          artworkTitle: formData.artworkTitle.trim(),
          artworkCaption: formData.artworkCaption.trim(),
          images: formData.imageUrl ? [formData.imageUrl.trim()] : editingProduct.images,
          description: formData.description.trim(),
          status: formData.status,
          availability: Number(formData.stockCount) > 0 ? 'in_stock' : 'sold_out',
        })
        onNotify?.(`Product "${formData.name}" updated successfully`)
      } else {
        await storeEngine.createProduct({
          sku,
          slug,
          name: formData.name.trim(),
          description: formData.description.trim() || 'Exclusive cryptographic digital collectible asset.',
          category: formData.category,
          collection: formData.category,
          categoryLabel: `${formData.category} COLLECTIBLE`,
          priceMinor,
          currency: 'INR',
          stockCount: Number(formData.stockCount),
          stockLabel: `${formData.stockCount} AVAILABLE`,
          availability: 'in_stock',
          editionNumber: 1,
          editionTotal: Number(formData.editionTotal),
          artwork: formData.artwork,
          artworkNumber: 1,
          artworkCaption: formData.artworkCaption.trim() || 'Verified provenance specimen',
          artworkTitle: formData.artworkTitle.trim() || 'Elite Series',
          images: formData.imageUrl ? [formData.imageUrl.trim()] : ['/cards/card-preview.png'],
          digitalAsset: {
            filename: `${slug}.zip`,
            format: 'ZIP/ARCHIVE',
            sizeBytes: 1048576,
            version: '1.0',
          },
          specifications: [
            { label: 'Network', value: formData.category },
            { label: 'Edition', value: `Series ${formData.editionTotal}` },
            { label: 'Format', value: 'Lossless Digital Key' },
          ],
          status: formData.status,
          isFeatured: true,
        })
        onNotify?.(`Product "${formData.name}" added to catalog`)
      }

      await onReload()
      setIsModalOpen(false)
    } catch (err: any) {
      console.error('Save product failed:', err)
      onNotify?.(`Failed to save product: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0c0e12] border border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-white tracking-tight">Catalogue Management</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              {products.length} COLLECTIBLES
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Publish, edit pricing, manage artwork and track edition quotas with real-time customer reactivity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-black text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Add New Collectible
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-[#0c0e12] border border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-0.5 text-xs font-mono">
            {(['all', 'VISA', 'MASTERCARD', 'RUPAY'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  categoryFilter === c
                    ? 'bg-cyan-400/20 text-cyan-400 font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-0.5 text-xs font-mono">
            {(['all', 'active', 'draft', 'archived'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search SKU or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 h-9 pl-9 pr-4 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const isActive = p.status === 'active'

          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-[#0c0e12] border border-white/5 space-y-4 hover:border-white/15 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 font-bold">
                      {p.category}
                    </span>
                    <span className="text-[10px] font-mono text-white/40 font-semibold">{p.sku}</span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                      isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Card artwork banner / preview */}
                <div className="relative h-28 rounded-xl overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center p-3">
                  {p.images && p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center font-mono text-xs text-cyan-400/60">
                      <Sparkles className="w-6 h-6 mx-auto mb-1 text-cyan-400/40" />
                      {p.artwork.toUpperCase()}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setCardPreviewProduct(p)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-white font-mono font-bold transition-opacity"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Preview Card
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                  <p className="text-xs text-white/50 line-clamp-2 mt-0.5">{p.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-white/40 text-[10px] block">Price</span>
                    <span className="text-base font-bold text-white">{formatINR(p.priceMinor)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] block">Edition Quota</span>
                    <span className="text-white/80 font-bold">
                      {p.stockCount} / {p.editionTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(p)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all border ${
                    isActive
                      ? 'bg-white/5 hover:bg-rose-500/10 text-white/70 hover:text-rose-400 border-white/10'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isActive ? 'Pause / Draft' : 'Publish Live'}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
                  title="Edit Collectible"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl my-8 p-6 rounded-2xl bg-[#0c0e12] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {editingProduct ? 'Edit Collectible Specimen' : 'Create New Collectible Specimen'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Collectible Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Imperial Onyx Hologram #01"
                    className="w-full h-10 px-3.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CardCategory })}
                    className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                    <option value="RUPAY">RUPAY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.priceINR}
                    onChange={(e) => setFormData({ ...formData, priceINR: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] font-mono text-white/40 mt-1 block">
                    Persists as ₹{formData.priceINR} ({formData.priceINR * 100} integer paise)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Edition Total & Stock Quota *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Total"
                      value={formData.editionTotal}
                      onChange={(e) => setFormData({ ...formData, editionTotal: Number(e.target.value) })}
                      className="h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Available"
                      value={formData.stockCount}
                      onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                      className="h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Artwork Aesthetic
                  </label>
                  <select
                    value={formData.artwork}
                    onChange={(e) => setFormData({ ...formData, artwork: e.target.value as Product['artwork'] })}
                    className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {ARTWORK_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Artwork Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://... /cards/card.png"
                    className="w-full h-10 px-3.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provable digital asset with cryptographic signature..."
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Status:</span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingProduct ? 'Update Collectible' : 'Create Collectible'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE CARD PREVIEW MODAL (DESKTOP & MOBILE SIMULATOR) */}
      {cardPreviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#0c0e12] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Storefront Card Preview
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    previewDevice === 'desktop' ? 'bg-cyan-400/20 text-cyan-400' : 'text-white/40 hover:text-white'
                  }`}
                  title="Desktop Card View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    previewDevice === 'mobile' ? 'bg-cyan-400/20 text-cyan-400' : 'text-white/40 hover:text-white'
                  }`}
                  title="Mobile View (360px - 430px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCardPreviewProduct(null)}
                  className="p-1 rounded-lg text-white/40 hover:text-white ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulating card rendering */}
            <div
              className={`mx-auto transition-all duration-300 ${
                previewDevice === 'mobile' ? 'max-w-[340px]' : 'w-full'
              }`}
            >
              <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-400 font-bold">
                    {cardPreviewProduct.category}
                  </span>
                  <span className="text-white/40">#{cardPreviewProduct.sku}</span>
                </div>

                <div className="h-44 rounded-xl overflow-hidden bg-black/60 border border-white/5 relative">
                  {cardPreviewProduct.images[0] ? (
                    <img
                      src={cardPreviewProduct.images[0]}
                      alt={cardPreviewProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center font-mono text-xs text-cyan-400/50">
                      {cardPreviewProduct.artwork.toUpperCase()} SHADER
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-white/80">
                    EDITION {cardPreviewProduct.stockCount}/{cardPreviewProduct.editionTotal}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{cardPreviewProduct.name}</h4>
                  <p className="text-xs text-white/50 line-clamp-2 mt-1">{cardPreviewProduct.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-base font-bold font-mono text-cyan-400">
                    {formatINR(cardPreviewProduct.priceMinor)}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-xs font-mono">
                    BUY NOW
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-[10px] font-mono text-white/40">
                Simulating {previewDevice === 'mobile' ? 'Mobile Responsive Width (340px)' : 'Desktop Grid Cell'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
