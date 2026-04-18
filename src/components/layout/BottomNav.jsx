import { NavLink, useLocation } from 'react-router-dom'
import { Home, Plus, Users, CheckCircle } from 'lucide-react'

const items = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/add-expense', icon: Plus, label: 'Add' },
  { to: '/pool', icon: Users, label: 'Group' },
  { to: '/settlement', icon: CheckCircle, label: 'Settle' },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-surface)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map(({ to, icon: Icon }) => {
          const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center justify-center py-2"
              aria-label={to}
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={2}
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fill: active ? 'var(--accent)' : 'none',
                  opacity: active ? 1 : 0.85,
                }}
              />
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
