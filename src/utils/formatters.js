export function paiseToRupees(paise) {
  if (paise == null || Number.isNaN(paise)) return 0
  return Math.round(paise) / 100
}

export function rupeesToPaise(rupees) {
  if (rupees == null || Number.isNaN(rupees)) return 0
  return Math.round(Number(rupees) * 100)
}

export function formatRs(paise) {
  const n = paiseToRupees(paise)
  return n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatRsLabel(paise) {
  return `Rs ${formatRs(paise)}`
}

export function relativeTime(iso) {
  if (!iso) return ''
  try {
    const then = new Date(iso).getTime()
    const sec = Math.floor((Date.now() - then) / 1000)
    if (sec < 60) return 'just now'
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
    return new Date(iso).toLocaleDateString('en-PK')
  } catch {
    return ''
  }
}

export function daysLeftInMonth(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const last = new Date(y, m + 1, 0)
  const today = date.getDate()
  return Math.max(0, last.getDate() - today)
}

export function currentMonthKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
