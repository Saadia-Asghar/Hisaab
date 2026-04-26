import { motion } from 'framer-motion'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SiteFooter } from '../components/layout/SiteFooter'

const faqs = [
  {
    q: 'Where is my money stored?',
    a: 'Hisaab does not custody or move funds—it is not a bank or PSP. It records contributions, expenses, and debts in Firebase/Firestore as structured data. Settlement is orchestration: who should pay whom; actual transfers stay in your existing rails (bank, JazzCash, Easypaisa, cash).',
  },
  {
    q: 'Why use AI only for parsing?',
    a: 'Roman Urdu phrasing varies too much for fragile regex. Structured JSON from one LLM call keeps manual entry as fallback. Pool math, debts, and settlement stay deterministic code.',
  },
  {
    q: 'How are amounts stored?',
    a: 'All monetary fields use integer paise (1 Rs = 100 paise) to avoid floating-point errors—standard practice for financial software QA.',
  },
  {
    q: 'What about privacy?',
    a: 'Use Firebase client SDK config in the browser only—never commit service accounts or admin keys. Lock down Firestore with security rules so users only read/write what they should; treat this like any fintech-facing surface.',
  },
  {
    q: 'Does demo mode send data to a server?',
    a: 'Interactive demo keeps state in memory in your browser. No Firebase project is required to click through flows.',
  },
]

export default function Faq() {
  return (
    <PageWrapper className="flex min-h-dvh flex-col">
      <div className="flex-1 pb-8 pt-8 lg:pt-12">
        <div className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">FAQ</p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Questions judges ask
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
              Short, factual answers—aligned with engineering and QA expectations for a finance-adjacent demo.
            </p>
          </motion.div>

          <div className="mt-10 space-y-3">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 open:bg-[var(--bg-surface)] open:shadow-[var(--shadow-elev-1)]"
              >
                <summary className="cursor-pointer list-none font-display text-sm font-semibold text-[var(--text-primary)] outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {q}
                    <span className="text-[var(--text-muted)] transition-transform group-open:rotate-180">▼</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </PageWrapper>
  )
}
