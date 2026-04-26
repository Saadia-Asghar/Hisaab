import { motion } from 'framer-motion'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SiteFooter } from '../components/layout/SiteFooter'

export default function Privacy() {
  return (
    <PageWrapper className="flex min-h-dvh flex-col">
      <div className="flex-1 pb-8 pt-8 lg:pt-12">
        <article className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Legal</p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Privacy overview
            </h1>
            <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated April 2026 · Micathon submission build</p>
          </motion.div>

          <div className="mt-10 max-w-none space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
            <section>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">What we collect</h2>
              <p className="mt-2">
                Account email (via Firebase Authentication), display name, optional phone, group membership, transaction and
                pool records you create inside the app. No deliberate collection of contacts or location for this MVP.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">How authentication works</h2>
              <p className="mt-2">
                Passwords are handled by Firebase Authentication using industry-standard hashing. The Hisaab client never
                stores raw passwords in Firestore documents.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">AI parsing</h2>
              <p className="mt-2">
                Expense text may be sent to DeepSeek (or optional Gemini fallback) solely to produce structured JSON.
                Prompts should avoid sensitive unrelated personal data—users should enter expense lines only.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Demo mode</h2>
              <p className="mt-2">
                Interactive demo stores sample data in browser memory only and does not sync to Firebase unless you switch
                to a configured project.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Contact</h2>
              <p className="mt-2">For this hackathon build, inquiries go through your team channel or club contact.</p>
            </section>
          </div>
        </article>
      </div>
      <SiteFooter />
    </PageWrapper>
  )
}
