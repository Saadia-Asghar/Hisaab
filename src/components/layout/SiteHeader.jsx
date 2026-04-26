import { NavLink, Link, useLocation } from 'react-router-dom'
import { Home, Plus, Users, CheckCircle, UserCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const appItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/add-expense', icon: Plus, label: 'Add' },
  { to: '/pool', icon: Users, label: 'Pool' },
  { to: '/settlement', icon: CheckCircle, label: 'Settle' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
]

const appPaths = ['/dashboard', '/add-expense', '/pool', '/debts', '/settlement', '/profile']

const marketingPaths = ['/', '/features', '/pricing', '/faq', '/privacy']

function isAppPath(pathname) {
  return appPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const { session, loading, appReady, demoMode } = useAuth()

  const isMarketing = marketingPaths.includes(pathname)
  const isAuth = pathname === '/login' || pathname === '/signup'
  const isAppRoute = isAppPath(pathname)

  const navMuted = 'rounded-md px-3 py-1.5 font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'

  if (isMarketing) {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md site-header-strip">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between lg:h-14">
            <Link to="/" className="font-display text-lg font-bold tracking-tight text-[var(--accent)]">
              Hisaab
            </Link>
            <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Product pages">
              <Link to="/features" className={navMuted}>
                Features
              </Link>
              <Link to="/pricing" className={navMuted}>
                Pricing
              </Link>
              <Link to="/faq" className={navMuted}>
                FAQ
              </Link>
              <Link to="/privacy" className={navMuted}>
                Privacy
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Sign in
              </Link>
              <Link to="/signup" className="btn-primary rounded-lg px-4 py-2 text-sm shadow-none">
                Create account
              </Link>
            </div>
          </div>
          <div className="hidden h-11 items-center border-t border-[var(--border)] lg:flex">
            <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Sections">
              <Link to={pathname === '/' ? '#why' : '/#why'} className={navMuted}>
                Fintech angle
              </Link>
              <Link to={pathname === '/' ? '#features' : '/#features'} className={navMuted}>
                Highlights
              </Link>
              <Link to={pathname === '/' ? '#trust' : '/#trust'} className={navMuted}>
                Trust
              </Link>
              <Link to="/features" className={navMuted}>
                Full feature list →
              </Link>
            </nav>
          </div>
        </div>
      </header>
    )
  }

  if (isAuth) {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md site-header-strip">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-14 lg:px-8">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-[var(--accent)]">
            Hisaab
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/features" className="hidden text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] sm:inline">
              Features
            </Link>
            <Link
              to="/"
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>
    )
  }

  if (!isAppRoute) return null

  const showFullAppNav = Boolean(session && !loading && appReady)

  if (!showFullAppNav) {
    return (
      <header className="sticky top-0 z-50 hidden border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md site-header-strip lg:block">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-8">
          <Link to="/" className="font-display text-lg font-bold text-[var(--accent)]">
            Hisaab
          </Link>
          <span className="text-xs text-[var(--text-muted)]">
            {!appReady ? 'Add Firebase keys or enable demo mode from the home page' : loading ? 'Loading…' : ''}
          </span>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 hidden border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md site-header-strip lg:block">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-3">
          <Link to="/dashboard" className="font-display text-lg font-bold tracking-tight text-[var(--accent)]">
            Hisaab
          </Link>
          {demoMode ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Demo
            </span>
          ) : null}
        </div>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 xl:gap-1" aria-label="Main">
          {appItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--border-accent)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                {label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
