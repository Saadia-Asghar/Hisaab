import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Keyboard, Users, Wallet } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'

export default function Home() {
  return (
    <PageWrapper className="flex min-h-dvh flex-col justify-between">
      <div className="pt-6 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-7xl"
        >
          <div id="why" className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-14 xl:gap-20">
            <div className="text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Shared expenses, one place
              </p>
              <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Split bills with your{' '}
                <span className="text-[var(--accent)]">roommates</span>, stress-free.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base text-[var(--text-secondary)] lg:mx-0 mx-auto">
                Track pool money, who owes whom, and settlements—built for hostel and shared flats. Works on your phone;
                on desktop you get a full dashboard like a proper money app.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link to="/signup" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="btn-ghost inline-flex items-center justify-center gap-2 border-[var(--border-strong)] px-8 py-3.5 text-base"
                >
                  Sign in
                </Link>
              </div>

              <p id="trust" className="mt-6 text-xs text-[var(--text-muted)] lg:text-left">
                Natural-language expense lines are parsed into structured entries. Balances and settlements are computed
                in your database—transparent and auditable.
              </p>
            </div>

            <div id="features" className="card mt-10 lg:mt-0">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display font-semibold text-[var(--text-primary)]">Type expenses in plain language</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    Example:{' '}
                    <span className="font-medium text-[var(--text-secondary)]">bijli 3800 split 5</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--accent)]" />
                    <p className="text-sm font-semibold">Debts</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    Auto-splits and a clear ledger of who owes whom.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    <p className="text-sm font-semibold">Settlement</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    Suggested transfers to close the month with fewer payments.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[var(--warning)]" />
                    <p className="text-sm font-semibold">Pool</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    Contributions, spending against target, and receipts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pb-8 pt-12 text-center text-xs text-[var(--text-muted)] lg:text-left">
        Built for Micathon &apos;26
      </div>
    </PageWrapper>
  )
}
