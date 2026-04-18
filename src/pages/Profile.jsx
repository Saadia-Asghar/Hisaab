import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../context/ToastContext'

const COLORS = [
  '#4F6EF7', '#10B981', '#F59E0B', '#EC4899',
  '#8B5CF6', '#06B6D4', '#F97316', '#14B8A6',
]

export default function Profile() {
  const { session, user } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, setActiveGroupId, group, members, refresh } = useGroup(user?.id)

  const myProfile = members?.find((m) => m.id === user?.id)

  const [name, setName] = useState('')
  const [color, setColor] = useState('#4F6EF7')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (myProfile) {
      setName(myProfile.name)
      setColor(myProfile.avatar_color ?? '#4F6EF7')
    }
  }, [myProfile])

  if (!session) return <Navigate to="/" replace />

  function startEdit() {
    setName(myProfile?.name ?? '')
    setColor(myProfile?.avatar_color ?? '#4F6EF7')
    setEditing(true)
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim(), avatar_color: color })
      .eq('id', user.id)
    setBusy(false)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Profile update ho gaya')
      setEditing(false)
      refresh()
    }
  }

  async function leaveGroup() {
    if (!activeGroupId || !user?.id) return
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', activeGroupId)
      .eq('user_id', user.id)
    if (error) {
      showToast(error.message, 'error')
    } else {
      setActiveGroupId(null)
      showToast('Group chhor diya')
    }
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Profile</h1>
        <Link to="/dashboard" className="text-sm text-[var(--accent)]">
          Home
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-col items-center py-8"
      >
        <Avatar
          name={myProfile?.name ?? '?'}
          color={myProfile?.avatar_color ?? '#4F6EF7'}
          size="lg"
        />
        <p className="mt-3 font-display text-xl font-bold text-[var(--text-primary)]">
          {myProfile?.name ?? '...'}
        </p>
        <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
      </motion.div>

      {editing ? (
        <form onSubmit={saveProfile} className="card mt-4 space-y-4">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Profile Edit</p>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">Name</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-[var(--text-secondary)]">Avatar Color</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-9 w-9 rounded-full transition-transform"
                  style={{
                    background: c,
                    border: color === c ? '3px solid white' : '3px solid transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost flex-1"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? '...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn-ghost mt-4 w-full"
          onClick={startEdit}
        >
          Edit Profile
        </button>
      )}

      {group && (
        <div className="card mt-4">
          <p className="text-xs text-[var(--text-secondary)]">Active Group</p>
          <p className="mt-1 font-semibold">{group.name}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            className="btn-danger mt-3 w-full text-sm"
            onClick={leaveGroup}
          >
            Group chhoro
          </button>
        </div>
      )}

      <button
        type="button"
        className="btn-ghost mt-8 w-full text-[var(--text-muted)]"
        onClick={() => supabase.auth.signOut()}
      >
        Sign out
      </button>

      <BottomNav />
    </PageWrapper>
  )
}
