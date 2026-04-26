const LS_KEY = 'hisaab_demo_mode'

/** Client-only: full app demo without Firebase (in-memory store). */
export function isDemoMode() {
  if (typeof window === 'undefined') return false
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true
  return window.localStorage.getItem(LS_KEY) === '1'
}

export function enableDemoMode() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LS_KEY, '1')
}

/** Turn on demo mode and reload so auth + store pick it up. */
export function enableDemoModeAndEnter() {
  enableDemoMode()
  if (typeof window !== 'undefined') window.location.assign('/dashboard')
}

export function disableDemoMode() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LS_KEY)
}

export function exitDemoAndReload() {
  disableDemoMode()
  window.location.href = '/'
}
