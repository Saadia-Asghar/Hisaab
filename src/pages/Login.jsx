import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PageWrapper } from '../components/layout/PageWrapper'

export default function Login() {
  const { session, loading } = useAuth()
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
      setError('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
      return
    }
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (err) setError(err.message)
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? '...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          New here?{' '}
          <Link className="text-[var(--accent)] hover:underline" to="/signup">
            Create an account →
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          <Link className="hover:underline" to="/">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </PageWrapper>
  )
}
