import { Link } from 'react-router-dom'

const product = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/faq', label: 'FAQ' },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-lg font-bold tracking-tight text-[var(--accent)]">Hisaab</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
              Household fintech for shared cash flows: committee-style pool, Roman Urdu capture, and auditable
              settlement—not a generic trip splitter.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {product.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/login" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Trust</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
                  Privacy
                </Link>
              </li>
              <li>
                <a href="/#trust" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
                  Security overview
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Build</p>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Micathon &apos;26 · Microsoft Club GIKI
              <br />
              Theme: Money Moves
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border)] pt-8 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Hisaab. Built for demonstration and judging.</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="hover:text-[var(--text-secondary)]">
              Privacy
            </Link>
            <span className="hidden sm:inline">·</span>
            <span>Amounts stored as integer paise — no floating-point money.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
