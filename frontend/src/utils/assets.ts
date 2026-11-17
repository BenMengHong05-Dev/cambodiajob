/**
 * Backend Asset & Media URL Resolver Utility
 *
 * Dynamically resolves asset, logo, avatar, banner, and resume file paths
 * returned by the Django backend to their full URL based on the environment:
 * - On Localhost: uses VITE_ASSET_BASE_URL (defaults to http://127.0.0.1:8000)
 * - On Production: uses your configured production domain (e.g. https://api.yourdomain.com)
 */

/**
 * Determine the asset base URL from environment variables.
 */
export const getAssetBaseUrl = (): string => {
  // 1. Explicit asset/media base URL (e.g., "http://127.0.0.1:8000" or "https://api.yourdomain.com")
  const envAssetBase = import.meta.env.VITE_ASSET_BASE_URL
  if (typeof envAssetBase === 'string' && envAssetBase.trim()) {
    return envAssetBase.trim().replace(/\/+$/, '')
  }

  // 2. Extract origin from VITE_API_BASE_URL if it's an absolute URL
  const envApiBase = import.meta.env.VITE_API_BASE_URL
  if (typeof envApiBase === 'string' && envApiBase.startsWith('http')) {
    try {
      const parsed = new URL(envApiBase)
      return `${parsed.protocol}//${parsed.host}`
    } catch {
      // ignore parse error
    }
  }

  // 3. In Vite development mode, fallback to standard Django backend port
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000'
  }

  // 4. In production mode without explicit asset URL, default to current window origin or empty
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return ''
}

export const ASSET_BASE_URL = getAssetBaseUrl()

/**
 * Resolves any backend relative asset path or external URL to an absolute URL.
 *
 * @param path The file path or URL (e.g. "/media/companies/logo.png", "https://...", "data:...")
 * @param fallback Optional fallback image if path is missing or empty
 * @returns Fully qualified asset URL suitable for `<img src={...} />` or `<a href={...} />`
 *
 * @example
 * getAssetUrl('/media/companies/logo.png')
 * // Localhost: "http://127.0.0.1:8000/media/companies/logo.png"
 * // Production: "https://api.yourdomain.com/media/companies/logo.png"
 *
 * getAssetUrl('https://images.unsplash.com/photo-123')
 * // Returns external URL untouched: "https://images.unsplash.com/photo-123"
 */
export const getAssetUrl = (path?: string | null, fallback: string = ''): string => {
  if (!path || typeof path !== 'string') {
    return fallback
  }

  const trimmed = path.trim()
  if (!trimmed) {
    return fallback
  }

  // 1. If already an absolute URL (http, https, //), data URI, or blob URL, return as-is
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }

  // 2. Format clean path ensuring single leading slash
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  // 3. Prepend ASSET_BASE_URL if available
  if (ASSET_BASE_URL) {
    return `${ASSET_BASE_URL}${cleanPath}`
  }

  return cleanPath
}

// Alias for semantic clarity
export const getMediaUrl = getAssetUrl

export default getAssetUrl
