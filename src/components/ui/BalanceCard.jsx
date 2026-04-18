import { motion } from 'framer-motion'
import { useCountUp } from '../../hooks/useCountUp'
import { daysLeftInMonth, formatRsLabel } from '../../utils/formatters'

export function BalanceCard({
  remainingPaise,
  contributedPaise,
  spentPaise,
  monthlyTargetPaise,
  loading,
}) {
  const animated = useCountUp(remainingPaise, 800)
  const pct =
    contributedPaise > 0
      ? spentPaise / contributedPaise
      : monthlyTargetPaise > 0
        ? spentPaise / monthlyTargetPaise
        : 0
  const pctClamped = Math.min(1, Math.max(0, pct))

  let barColor = 'bg-[var(--success)]'
  if (pctClamped >= 0.8) barColor = 'bg-[var(--danger)] budget-bar-pulse'
  else if (pctClamped >= 0.6) barColor = 'bg-[var(--warning)]'

  const threshold =
    pctClamped >= 1 ? 3 : pctClamped >= 0.8 ? 2 : pctClamped >= 0.6 ? 1 : 0

  const days = daysLeftInMonth()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-glow border-[var(--border-accent)]"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        Pool balance (this month)
      </p>
      {loading ? (
        <div className="skeleton mt-3 h-10 w-40" />
      ) : (
        <p className="balance-number mt-2 text-[var(--text-primary)]">
          {formatRsLabel(Math.round(animated))}
        </p>
      )}
      <p className="mt-1 text-xs text-[var(--text-muted)]">remaining</p>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pctClamped * 100}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Rs {(spentPaise / 100).toLocaleString('en-PK')} spent · Rs {(remainingPaise / 100).toLocaleString('en-PK')}{' '}
        remaining · {days} days left in month
      </p>

      {threshold === 1 ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Heads up — you’ve spent 60% of the pool.
        </div>
      ) : null}
      {threshold === 2 ? (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          ⚠️ 80% spent — {days} days left. Spend carefully.
        </div>
      ) : null}
      {threshold === 3 ? (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
          Pool is empty for this month.
        </div>
      ) : null}
    </motion.div>
  )
}
