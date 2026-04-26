import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calculator,
  Keyboard,
  Landmark,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SiteFooter } from '../components/layout/SiteFooter'

const blocks = [
  {
    icon: Landmark,
    title: 'Committee pool wallet',
    body: 'Shared monthly pool with contributions, receipts, and spend tracked against your group target.',
  },
  {
    icon: Keyboard,
    title: 'Roman Urdu expense parsing',
    body: 'One AI touchpoint—natural lines like “bijli 3800 split 5” become structured splits. Everything else is deterministic.',
  },
  {
    icon: Calculator,
    title: 'Debt & settlement engine',
    body: 'Peer debts and greedy minimum-transfer settlement—auditable math, not guesses.',
  },
  {
    icon: Receipt,
    title: 'PDF receipts',
    body: 'Contribution receipts generated client-side with jsPDF—no server round-trip.',
  },
  {
    icon: ShieldCheck,
    title: 'Firebase & Firestore',
    body: 'Auth plus rules-backed storage—group data scoped to membership, suitable for a finance-adjacent client.',
  },
  {
    icon: Users,
    title: 'Differentiated focus',
    body: 'Built for recurring household liquidity (hostels, flats, families)—not travel bill apps or one-off dinners.',
  },
]

export default function Features() {
  return (
    <PageWrapper className="flex min-h-dvh flex-col">
      <div className="flex-1 pb-8 pt-8 lg:pt-12">
        <div className="mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Product</p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Shared-money OS, not “another Splitwise”
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
              Pool visibility, conversational capture, and settlement math in one stack—positioned as lightweight
              household fintech: transparency and coordination before money moves in banking or mobile wallets.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blocks.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="card group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/[0.08] text-[var(--accent)] ring-1 ring-[var(--border-accent)] transition-transform group-hover:scale-[1.02]">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h2 className="font-display mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/[0.06] to-transparent px-6 py-8 sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                <div>
                  <p className="font-display font-semibold text-[var(--text-primary)]">See it without signing up</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Load the full interactive demo with sample group data—runs entirely in your browser.
                  </p>
                </div>
              </div>
              <Link to="/" className="btn-primary inline-flex shrink-0 justify-center px-6 py-3 text-sm sm:self-center">
                Try demo from home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </PageWrapper>
  )
}
