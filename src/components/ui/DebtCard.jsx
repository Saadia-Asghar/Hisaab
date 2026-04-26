import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Avatar } from './Avatar'
import { formatRsLabel } from '../../utils/formatters'

export function DebtCard({
  debt,
  counterparty,
  mode: _mode,
  onSettle,
  onRemind,
  settled,
}) {
  const days = Math.floor((Date.now() - new Date(debt.created_at)) / 86400000)
  const stale = days > 7 && !settled

  return (
    <motion.div
      layout
      className={`card ${settled ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={counterparty?.name} color={counterparty?.avatar_color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-[var(--text-primary)]">{counterparty?.name}</p>
            {stale ? (
              <span className="pill bg-red-100 text-xs font-medium text-red-800">&gt;7d</span>
            ) : null}
          </div>
          <p className="balance-number mt-1 text-[var(--text-primary)]">{formatRsLabel(debt.amount_paise)}</p>
          {debt.description ? (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{debt.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--text-muted)]">{days} days</p>
        </div>
      </div>
      {!settled ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost flex-1 py-2 text-sm" onClick={() => onRemind?.(debt)}>
            <MessageCircle className="h-4 w-4" />
            Remind
          </button>
          <button type="button" className="btn-primary flex-1 py-2 text-sm" onClick={() => onSettle?.(debt)}>
            Mark Settled
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-emerald-400">Settled ✓</p>
      )}
    </motion.div>
  )
}
