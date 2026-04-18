import { useState } from 'react'
import { Copy, X, Share2, Check } from 'lucide-react'
import { Avatar } from './Avatar'
import { useToast } from '../../context/ToastContext'
import { formatRsLabel } from '../../utils/formatters'

export function GroupInfoModal({ group, members, currentUserId, onClose, onLeave }) {
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCopied(true)
      showToast('Invite code copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    const text = `Hisaab group mein aao!\n\nGroup: ${group.name}\nInvite code: *${group.invite_code}*\n\nApp kholo aur "Join" mein ye code daalo. — Hisaab App`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="card w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{group.name}</h3>
          <button type="button" className="btn-ghost p-2" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invite code block */}
        <div className="mt-4 rounded-xl bg-[var(--bg-surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Invite Code</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-display text-3xl font-bold tracking-[0.35em] text-[var(--accent)]">
              {group.invite_code}
            </span>
            <button
              type="button"
              className="btn-ghost flex items-center gap-1.5 py-2 text-sm"
              onClick={copyCode}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Monthly pool target: {formatRsLabel(group.monthly_target ?? 0)}
          </p>
        </div>

        <button
          type="button"
          className="btn-primary mt-3 flex w-full items-center justify-center gap-2"
          onClick={shareWhatsApp}
        >
          <Share2 className="h-4 w-4" />
          WhatsApp pe invite bhejo
        </button>

        {/* Members */}
        <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Members ({members.length})
        </h4>
        <div className="mt-3 space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar name={m.name} color={m.avatar_color} size="sm" />
              <span className="text-sm font-medium">{m.name}</span>
              {m.id === currentUserId && (
                <span className="ml-auto rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                  Aap
                </span>
              )}
            </div>
          ))}
        </div>

        {onLeave && (
          <button
            type="button"
            className="btn-danger mt-6 w-full text-sm"
            onClick={onLeave}
          >
            Group chhoro
          </button>
        )}
      </div>
    </div>
  )
}
