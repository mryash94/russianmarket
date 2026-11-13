export type CardCategory = 'VISA' | 'MASTERCARD' | 'RUPAY'

export type CollectibleCollection = CardCategory

export type ProductCategory = CardCategory

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
  collection: CardCategory
  category: CardCategory
  categoryLabel: string
  priceMinor: number // in INR integer paise (e.g. 39900 = ₹399)
  salePriceMinor?: number | null
  discountPercent?: number
  currency: 'INR'
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
