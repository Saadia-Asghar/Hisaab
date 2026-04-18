const MAP = {
  utilities: 'pill pill-utilities',
  food: 'pill pill-food',
  transport: 'pill pill-transport',
  groceries: 'pill pill-groceries',
  entertainment: 'pill pill-entertainment',
  other: 'pill pill-other',
}

export function CategoryPill({ category }) {
  const c = category || 'other'
  const cls = MAP[c] || MAP.other
  const label = c.charAt(0).toUpperCase() + c.slice(1)
  return <span className={cls}>{label}</span>
}
