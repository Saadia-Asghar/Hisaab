import { NavLink, useLocation } from 'react-router-dom'
import { Home, Plus, Users, CheckCircle, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useGroup } from '../../hooks/useGroup'
import { useDebts } from '../../hooks/useDebts'

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/add-expense', icon: Plus, label: 'Add' },
  { to: '/debts', icon: Wallet, label: 'Debts' },
  { to: '/pool', icon: Users, label: 'Pool' },
  { to: '/settlement', icon: CheckCircle, label: 'Settle' },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { activeGroupId } = useGroup(user?.id)
  const { unsettledCount } = useDebts(activeGroupId, user?.id)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-surface)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
          const showBadge = to === '/debts' && unsettledCount > 0
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              aria-label={label}
            >
              <div className="relative">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 2}
                  style={{
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[9px] font-bold text-white">
                    {unsettledCount > 9 ? '9+' : unsettledCount}
                  </span>
                )}
              </div>
              <span
                className="text-[10px]"
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
