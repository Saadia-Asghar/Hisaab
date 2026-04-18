export function PageWrapper({ children, className = '' }) {
  return (
    <div
      className={`mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6 safe-pt safe-pb ${className}`}
      style={{
        background:
          'radial-gradient(900px 500px at 50% -20%, rgba(79,110,247,0.18), transparent 60%), var(--bg-base)',
      }}
    >
      {children}
    </div>
  )
}
