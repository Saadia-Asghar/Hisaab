import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PageWrapper } from '../components/layout/PageWrapper'

const COLORS = ['#4F6EF7', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']

export default function Signup() {
  const { session, loading } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <PageWrapper>
        <div className="skeleton mt-20 h-40 w-full" />
      </PageWrapper>
    )
  }

  if (session) return <Navigate to="/dashboard" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Configure .env.local with Supabase keys.')
      return
    }
    setBusy(true)
    const { data, error: signErr } = await supabase.auth.signUp({ email, password })
    if (signErr) {
      setError(signErr.message)
      setBusy(false)
      return
    }

    const user = data.user ?? data.session?.user
    if (!user) {
      setError('Check email to confirm account, then sign in.')
      setBusy(false)
      return
    }

    const avatar_color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const { error: pe } = await supabase.from('profiles').insert({
      id: user.id,
      name,
      avatar_color,
    })
    if (pe) {
      setError(pe.message)
      setBusy(false)
      return
    }

    setBusy(false)
    nav('/dashboard', { replace: true })
  }

  return (
    <PageWrapper className="flex min-h-dvh flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card mx-auto w-full max-w-[400px]"
      >
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-[var(--accent)]">Hisaab</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">حساب</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">Email</label>
            <input
              className="input-field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">Password</label>
            <input
              className="input-field"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? '...' : 'Account Banao'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Pehle se account?{' '}
          <Link className="text-[var(--accent)] hover:underline" to="/">
            Dakhil ho →
          </Link>
        </p>
      </motion.div>
    </PageWrapper>
  )
}
