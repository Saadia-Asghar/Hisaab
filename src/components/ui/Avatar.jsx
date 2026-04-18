export function Avatar({ name, color, size = 'md', title }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'

  return (
    <span
      title={title || name}
      className={`avatar ${sz}`}
      style={{ background: color || 'var(--accent)' }}
    >
      {initials}
    </span>
  )
}
