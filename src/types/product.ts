export type CollectibleCollection =
  | 'Midnight Edition'
  | 'Royal Blue Edition'
  | 'Crimson Edition'
  | 'Titanium Edition'
  | 'Gold Edition'
  | 'Limited Edition'

export type ProductCategory = CollectibleCollection | string

export type DigitalAssetInfo = {
  filename: string
  sizeBytes: number
  format: string
  version?: string
}

export type Product = {
  id: string
  sku: string
  slug: string
  name: string
  description: string
  collection: CollectibleCollection
  category: ProductCategory
  categoryLabel: string
  priceMinor: number
  salePriceMinor?: number | null
  discountPercent?: number
  currency: string
  stockCount: number
  stockLabel: string
  availability: 'in_stock' | 'low_stock' | 'sold_out'
  editionNumber: number
  editionTotal: number
  artwork: 'northstar' | 'open-road' | 'pixel-plus' | 'studio-select' | 'hologram' | 'cyber-foil'
  artworkNumber: number
  artworkCaption: string
  artworkTitle: string
  images: string[]
  digitalAsset: DigitalAssetInfo
  specifications: { label: string; value: string }[]
  status: 'draft' | 'active' | 'archived'
  isFeatured?: boolean
  isPopular?: boolean
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}
