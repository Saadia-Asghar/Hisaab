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

function isAppPath(pathname) {
  return appPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const { session, loading, isSupabaseConfigured } = useAuth()

  const isMarketing = pathname === '/'
  const isAuth = pathname === '/login' || pathname === '/signup'
  const isAppRoute = isAppPath(pathname)

  if (isMarketing) {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/92 backdrop-blur-md site-header-strip">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between lg:h-14">
            <Link to="/" className="font-display text-lg font-bold tracking-tight text-[var(--accent)]">
              Hisaab
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Sign in
              </Link>
              <Link to="/signup" className="btn-primary rounded-lg px-4 py-2 text-sm">
                Create account
              </Link>
            </div>
          </div>
          <div className="hidden h-11 items-center border-t border-[var(--border)] lg:flex">
            <nav className="flex items-center gap-1 text-sm" aria-label="Landing sections">
              <a
                href="#why"
                className="rounded-md px-3 py-1.5 font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
              >
                Why Hisaab
              </a>
              <a
                href="#features"
                className="rounded-md px-3 py-1.5 font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
              >
                Features
              </a>
              <a
                href="#trust"
                className="rounded-md px-3 py-1.5 font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
              >
                Trust & Security
              </a>
            </nav>
          </div>
        </div>
      </header>
    )
  }

  if (isAuth) {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/92 backdrop-blur-md site-header-strip">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-14 lg:px-8">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-[var(--accent)]">
            Hisaab
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            ← Home
          </Link>
        </div>
      </header>
    )
  }

  if (!isAppRoute) return null

  const showFullAppNav = Boolean(session && !loading && isSupabaseConfigured)

  if (!showFullAppNav) {
    return (
      <header className="hidden lg:block sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/92 backdrop-blur-md site-header-strip">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-8">
          <Link to="/" className="font-display text-lg font-bold text-[var(--accent)]">
            Hisaab
          </Link>
          <span className="text-xs text-[var(--text-muted)]">
            {!isSupabaseConfigured ? 'Configure Supabase in .env.local' : loading ? 'Loading…' : ''}
          </span>
        </div>
      </header>
    )
  }

  return (
    <header className="hidden lg:block sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/92 backdrop-blur-md site-header-strip">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-6 lg:px-8">
        <Link to="/dashboard" className="font-display shrink-0 text-lg font-bold tracking-tight text-[var(--accent)]">
          Hisaab
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 xl:gap-1" aria-label="Main">
          {appItems.map(({ to, icon: Icon, label }) => {
            const active =
              pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--accent)]/12 text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--border-accent)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
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
