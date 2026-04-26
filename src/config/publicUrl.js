/** Canonical base URL for invites/shares. Set VITE_APP_PUBLIC_URL when you own a domain. */
export function getPublicAppUrl() {
  const fromEnv = import.meta.env.VITE_APP_PUBLIC_URL
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}
