/**
 * Computes the canonical OAuth & Auth redirect URL.
 * Dynamically resolves to the current browser origin (window.location.origin),
 * or falls back to production https://market-zeta.vercel.app.
 * Never hardcodes localhost:3000.
 */
export function getAuthRedirectOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.trim().replace(/\/+$/, '')
    if (origin && !origin.includes('localhost:3000')) {
      return origin
    }
  }

  const envUrl = import.meta.env.VITE_SITE_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }

  return 'https://market-zeta.vercel.app'
}

export function getAuthRedirectUrl(path: string = '/'): string {
  const origin = getAuthRedirectOrigin()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${cleanPath}`
}
