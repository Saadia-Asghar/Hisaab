import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function Toast({ message, variant = 'success' }) {
  const Icon = variant === 'error' ? AlertCircle : CheckCircle2
  const bg =
    variant === 'error' ? 'bg-red-500/20 border-red-500/40' : 'bg-emerald-500/15 border-emerald-500/30'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className={`fixed bottom-24 left-1/2 z-[100] flex max-w-[min(90vw,360px)] -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 text-sm text-[var(--text-primary)] shadow-xl ${bg}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <Icon className="h-5 w-5 shrink-0 text-[var(--text-secondary)]" />
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  )
}
