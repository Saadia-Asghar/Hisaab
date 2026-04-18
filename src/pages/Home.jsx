import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Sparkles, Users, Wallet } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'

export default function Home() {
  return (
    <PageWrapper className="flex min-h-dvh flex-col justify-between">
      <div className="pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-lg"
        >
          <div className="text-center">
            <h1 className="font-display text-4xl font-extrabold text-[var(--accent)]">
              Hisaab
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Group money OS for hostel life. No awkward conversations—just settled.
            </p>
          </div>

          <div className="card mt-8">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="font-display font-semibold text-[var(--text-primary)]">
                  Type expenses naturally
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Example: <span className="font-medium text-[var(--text-secondary)]">bijli 3800 split 5</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg-surface)] p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--accent)]" />
                  <p className="text-sm font-medium">Debts</p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Auto-splits and tracks who owes whom.
                </p>
              </div>
              <div className="rounded-xl bg-[var(--bg-surface)] p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                  <p className="text-sm font-medium">Settlement</p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Minimum transfers to settle the month.
                </p>
              </div>
              <div className="rounded-xl bg-[var(--bg-surface)] p-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[var(--warning)]" />
                  <p className="text-sm font-medium">Pool</p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Track contributions and download receipts.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to="/signup" className="btn-primary flex items-center justify-center gap-2">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-ghost flex items-center justify-center gap-2">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
            AI is used only for parsing text → JSON. Everything else is deterministic.
          </p>
        </motion.div>
      </div>

      <div className="pb-8 pt-10 text-center text-xs text-[var(--text-muted)]">
        Built for Micathon ’26
      </div>
    </PageWrapper>
  )
}

