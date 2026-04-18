import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../context/ToastContext'

const COLORS = ['#4F6EF7', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']

export default function Profile() {
  const { session, user } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarColor, setAvatarColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (cancelled) return
      if (data) {
        setName(data.name ?? '')
        setPhone(data.phone ?? '')
        setAvatarColor(data.avatar_color ?? COLORS[0])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  if (!session) return <Navigate to="/" replace />

  async function save(e) {
    e.preventDefault()
    if (!user?.id) return
    const trimmed = name.trim()
    if (!trimmed) {
      showToast('Please enter your name.', 'error')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: trimmed,
        phone: phone.trim() || null,
        avatar_color: avatarColor,
      })
      .eq('id', user.id)
    setSaving(false)
    if (error) showToast(error.message, 'error')
    else showToast('Profile saved successfully.')
  }

  return (
    <PageWrapper showBottomNav>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-lg font-semibold">Profile</h1>
        <Link to="/dashboard" className="text-sm text-[var(--accent)]">
          Home
        </Link>
      </div>

      {loading ? (
        <div className="skeleton h-48 w-full" />
      ) : (
        <form onSubmit={save} className="card space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar name={name || '?'} color={avatarColor} size="lg" />
            <p className="text-xs text-[var(--text-muted)] break-all">{user.email}</p>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)]">Name</label>
            <input
              className="input-field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)]">Phone (optional)</label>
            <input
              className="input-field mt-1"
              inputMode="tel"
              placeholder="+92..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Avatar color</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-9 w-9 rounded-full border-2 transition-colors ${
                    avatarColor === c ? 'border-[var(--text-primary)]' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                  onClick={() => setAvatarColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? '...' : 'Save'}
          </button>
        </form>
      )}

      <button
        type="button"
        className="btn-ghost mt-6 flex w-full items-center justify-center gap-2 py-3 text-[var(--text-muted)]"
        onClick={() => supabase.auth.signOut()}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>

    </PageWrapper>
  )
}
