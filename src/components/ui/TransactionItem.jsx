import { Avatar } from './Avatar'
import { CategoryPill } from './CategoryPill'
import { formatRsLabel, relativeTime } from '../../utils/formatters'

export function TransactionItem({ transaction, payerProfile, currentUserId }) {
  const youShare =
    currentUserId && payerProfile
      ? transaction.share_paise
      : transaction.share_paise

  return (
    <div className="card flex gap-3">
      <Avatar name={payerProfile?.name ?? '?'} color={payerProfile?.avatar_color} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--text-primary)]">
          <span className="font-medium">{payerProfile?.name ?? 'Someone'}</span>
          <span className="text-[var(--text-secondary)]"> added </span>
          <span>{transaction.description}</span>
          <span className="text-[var(--text-secondary)]"> — </span>
          <span className="font-display font-semibold">{formatRsLabel(transaction.amount_paise)}</span>
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Your share: {formatRsLabel(youShare)} · {relativeTime(transaction.created_at)}
        </p>
        <div className="mt-2">
          <CategoryPill category={transaction.category} />
        </div>
      </div>
    </div>
  )
}
