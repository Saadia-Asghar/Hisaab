import { NavLink, useLocation } from 'react-router-dom'
import { Home, Plus, Users, CheckCircle, UserCircle } from 'lucide-react'

const items = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/add-expense', icon: Plus, label: 'Add' },
  { to: '/pool', icon: Users, label: 'Pool' },
  { to: '/settlement', icon: CheckCircle, label: 'Settle' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-surface)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {items.map(({ to, icon: Icon, label }) => {
          const active =
            pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              aria-label={label}
            >
              <Icon
                className="h-5 w-5 transition-colors"
                strokeWidth={active ? 2.5 : 2}
                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              />
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
