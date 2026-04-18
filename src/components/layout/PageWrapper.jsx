export function PageWrapper({ children, className = '' }) {
  return (
    <div
      className={`mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6 safe-pt safe-pb ${className}`}
      style={{ background: 'var(--bg-base)' }}
    >
      {children}
    </div>
  )
}
