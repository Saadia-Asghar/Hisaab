import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SiteFooter } from '../components/layout/SiteFooter'

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    desc: 'Small rooms & hackathon demos',
    features: ['Up to 5 members per group', 'Pool + expenses + settlement', 'Roman Urdu parse (cached + API)', 'PDF receipts'],
    cta: 'Create account',
    href: '/signup',
    featured: false,
  },
  {
    name: 'House',
    price: 'Rs 199',
    period: '/mo',
    desc: 'Heavier hostel groups (future)',
    features: ['Larger groups & history', 'Priority-friendly roadmap', 'Same core security model'],
    cta: 'Coming soon',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Campus pilot',
    price: 'Let’s talk',
    desc: 'Institutions & societies',
    features: ['Custom onboarding', 'Reporting exports', 'Dedicated support channel'],
    cta: 'Contact via club',
    href: '/faq',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <PageWrapper className="flex min-h-dvh flex-col">
      <div className="flex-1 pb-8 pt-8 lg:pt-12">
        <div className="mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Pricing</p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Simple today. Room to grow.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
              Positioned as accessible household fintech—not enterprise banking. Free tier for demos; paid tiers are
              placeholders until real payment rails and compliance scope are defined.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className={`relative flex flex-col rounded-2xl border p-6 lg:p-7 ${
                  tier.featured
                    ? 'border-[var(--border-accent)] bg-[var(--bg-card)] shadow-[var(--shadow-elev-2)] ring-1 ring-[var(--accent)]/15'
                    : 'border-[var(--border)] bg-[var(--bg-card)]'
                }`}
              >
                {tier.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Highlight
                  </span>
                ) : null}
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{tier.name}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{tier.desc}</p>
                <p className="font-display mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {tier.price}
                  {tier.period ? (
                    <span className="text-lg font-semibold text-[var(--text-muted)]">{tier.period}</span>
                  ) : null}
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--text-secondary)]">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={tier.href}
                  className={`mt-8 inline-flex justify-center py-3 text-sm ${
                    tier.featured ? 'btn-primary' : 'btn-ghost border-[var(--border-strong)]'
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-[var(--text-muted)]">
            Taxes and payment rails (JazzCash / Easypaisa / Raast) are out of scope for this MVP—see FAQ.
          </p>
        </div>
      </div>
      <SiteFooter />
    </PageWrapper>
  )
}
