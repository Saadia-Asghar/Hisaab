import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Keyboard, Play, Users, Wallet } from 'lucide-react'
import { enableDemoModeAndEnter } from '../lib/demoMode'
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
                Shared finance · auditable by design
              </p>
              <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Transparency for{' '}
                <span className="text-[var(--accent)]">group money</span>, not just bill-splitting.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base text-[var(--text-secondary)] lg:mx-0 mx-auto">
                Hisaab is household-focused fintech: a pooled liquidity view, a full ledger of who owes whom, and
                settlement math—so cash flows stay clear before money moves in the real world (bank, wallet, cash).
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
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
                <button
                  type="button"
                  onClick={() => enableDemoModeAndEnter()}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-emerald-500/35 bg-emerald-500/10 px-8 py-3.5 text-base font-medium text-emerald-100 transition-colors hover:bg-emerald-500/15"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Try full demo
                </button>
              </div>

              <p id="trust" className="mt-6 text-xs text-[var(--text-muted)] lg:text-left">
                AI is used in one place—turning natural-language expense lines into structured entries. Balances and
                settlements are deterministic code plus your database—appropriate for finance-adjacent demos.
              </p>
            </div>

            <div id="features" className="card mt-10 lg:mt-0">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display font-semibold text-[var(--text-primary)]">Conversational capture</p>
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
                    <p className="text-sm font-semibold">Receivables & payables</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    A receivables-style ledger—not a one-off bill reminder.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    <p className="text-sm font-semibold">Settlement rails</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    Fewest transfers to square the group—coordination for real payouts.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[var(--warning)]" />
                    <p className="text-sm font-semibold">Pool & runway</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    Contributions vs spend vs target—how much headroom the group has.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pb-8 pt-12 text-center text-xs text-[var(--text-muted)] lg:text-left">
        Built for Micathon &apos;26 · Money Moves
      </div>
    </PageWrapper>
  )
}
