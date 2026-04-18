import { Avatar } from './Avatar'
import { CategoryPill } from './CategoryPill'
import { formatRsLabel, relativeTime } from '../../utils/formatters'

export function TransactionItem({ transaction, payerProfile, currentUserId }) {
  const isPayer = currentUserId && payerProfile && transaction.paid_by === currentUserId
  const shareLabel = isPayer ? 'You paid' : `Your share: ${formatRsLabel(transaction.share_paise)}`

  return (
    <div className="card flex gap-3 transition-colors hover:border-[var(--border-accent)]">
      <Avatar name={payerProfile?.name ?? '?'} color={payerProfile?.avatar_color} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--text-primary)]">
          <span className="font-medium">{isPayer ? 'You' : payerProfile?.name ?? 'Someone'}</span>
          <span className="text-[var(--text-secondary)]"> paid </span>
          <span className="font-semibold">{formatRsLabel(transaction.amount_paise)}</span>
          <span className="text-[var(--text-secondary)]"> — </span>
          <span>{transaction.description}</span>
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {shareLabel} · split {transaction.split_count} · {relativeTime(transaction.created_at)}
        </p>
        <div className="mt-1.5">
          <CategoryPill category={transaction.category} />
        </div>
      </div>
    </div>
  )
}
