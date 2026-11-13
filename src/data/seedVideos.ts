export type VideoItem = {
  id: string
  title: string
  description: string
  collection: string
  duration: string
  views: number
  date: string
  thumbnailUrl: string
  videoUrl: string
  badge: string
}

export const SEED_VIDEOS: VideoItem[] = [
  {
    id: 'rm-vid-01',
    title: 'The Anatomy of a Haute Digital Collectible',
    description: 'An executive deep-dive into the procedural guilloche micro-structures, specular micro-reflections, and cryptographic microchip contact plates embedded into every Russian Market card.',
    collection: 'Master Class',
    duration: '4:18',
    views: 12480,
    date: 'Oct 28, 2026',
    thumbnailUrl: '/assets/cards/midnight-cipher.webp',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    badge: 'CURATOR PICK',
  },
  {
    id: 'rm-vid-02',
    title: 'Russian Market Genesis Artifact #001 Showcase',
    description: 'Full 4K macro inspection of the Genesis #001 supreme artifact. Demonstrating chromatic diffraction dispersion and multi-spectrum holographic reaction.',
    collection: 'Limited Edition',
    duration: '6:02',
    views: 28910,
    date: 'Nov 02, 2026',
    thumbnailUrl: '/assets/cards/genesis-card.webp',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    badge: 'EXCLUSIVE',
  },
  {
    id: 'rm-vid-03',
    title: 'Private Vault Cryptography & Secure Digital Delivery',
    description: 'Step-by-step tutorial explaining how Russian Market signs your purchase entitlements using asymmetric cryptographic signatures and enables instant short-lived signed asset downloads.',
    collection: 'Tutorial',
    duration: '3:45',
    views: 8940,
    date: 'Nov 05, 2026',
    thumbnailUrl: '/assets/cards/royal-sapphire.webp',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    badge: 'GUIDE',
  },
  {
    id: 'rm-vid-04',
    title: 'The Six Imperial Editions: Heritage & Metallurgy',
    description: 'Explore the aesthetic philosophy behind the Midnight Obsidian, Royal Blue Cobalt, Crimson Ruby, Titanium Grade-5, Imperial 24K Gold, and Limited Edition collections.',
    collection: 'Documentary',
    duration: '8:30',
    views: 19450,
    date: 'Nov 08, 2026',
    thumbnailUrl: '/assets/cards/gold-autocrat.webp',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    badge: 'SERIES',
  },
]
