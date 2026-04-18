import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parseExpenseText } from '../lib/deepseek'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { CategoryPill } from '../components/ui/CategoryPill'
import { useToast } from '../context/ToastContext'
import { rupeesToPaise } from '../utils/formatters'

export default function AddExpense() {
  const { session, user } = useAuth()
  const nav = useNavigate()
  const { showToast } = useToast()
  const { activeGroupId } = useGroup(user?.id)

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [manual, setManual] = useState(false)
  const [mAmount, setMAmount] = useState('')
  const [mSplit, setMSplit] = useState('2')
  const [mDesc, setMDesc] = useState('')
  const [mCat, setMCat] = useState('other')

  if (!session) return <Navigate to="/" replace />

  async function onParse() {
    setLoading(true)
    setParsed(null)
    const res = await parseExpenseText(text)
    setLoading(false)
    if (res?.error) {
      showToast(res.error, 'error')
      setManual(true)
      return
    }
    if (!res) {
      setManual(true)
      showToast('Manual entry', 'error')
      return
    }
    setParsed(res)
    setManual(false)
  }

  async function confirm(parsedRow) {
    if (!activeGroupId) {
      showToast('Join a group first', 'error')
      return
    }
    const amountRupees = parsedRow.amount_rupees
    const split = parsedRow.split_count
    const share = parsedRow.share_rupees
    const { error } = await supabase.from('transactions').insert({
      group_id: activeGroupId,
      paid_by: user.id,
      amount_paise: rupeesToPaise(amountRupees),
      description: parsedRow.description,
      category: parsedRow.category,
      split_count: split,
      share_paise: rupeesToPaise(share),
      raw_input: text,
      created_at: new Date().toISOString(),
    })
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Expense logged')
    nav('/dashboard')
  }

  async function confirmManual() {
    const amountRupees = Number(mAmount)
    const split = Math.max(1, Number(mSplit) || 2)
    if (!amountRupees || amountRupees <= 0) {
      showToast('Enter amount', 'error')
      return
    }
    const share = Math.round(amountRupees / split)
    await confirm({
      amount_rupees: amountRupees,
      description: mDesc || 'Expense',
      split_count: split,
      share_rupees: share,
      category: mCat,
    })
  }

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/dashboard" className="btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Kharch Add Karo</h1>
      </div>

      <textarea
        className="input-field min-h-[120px] resize-y font-sans"
        placeholder='likho: bijli 3800 split 5, ya Ahmed ne grocery li 1200 hum 4 hain...'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-2 flex flex-wrap gap-2">
        {['bijli 3800 split 5', 'pizza 1800 4 bande', 'uber 650 3 log'].map((ex) => (
          <span key={ex} className="pill bg-[var(--bg-surface)] text-[var(--text-muted)]">
            {ex}
          </span>
        ))}
      </div>

      <button type="button" className="btn-primary mt-4 w-full" onClick={onParse} disabled={loading || !text.trim()}>
        <Sparkles className="h-4 w-4" />
        {loading ? 'Parse kar rahe hain...' : 'Samjho →'}
      </button>

      <button type="button" className="btn-ghost mt-3 w-full text-sm" onClick={() => setManual(true)}>
        Manual entry
      </button>

      <AnimatePresence>
        {parsed ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="card mt-6"
          >
            <p className="text-sm text-[var(--text-secondary)]">{parsed.description}</p>
            <p className="balance-number mt-2">Rs {parsed.amount_rupees?.toLocaleString?.('en-PK')}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              ÷ {parsed.split_count} people = Rs {parsed.share_rupees} each
            </p>
            <div className="mt-3">
              <CategoryPill category={parsed.category} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setParsed(null)}>
                Edit manually
              </button>
              <button type="button" className="btn-primary flex-1" onClick={() => confirm(parsed)}>
                Confirm & Deduct
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {manual ? (
        <div className="card mt-6 space-y-3">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Manual entry</p>
          <input
            className="input-field"
            placeholder="Amount (Rs)"
            inputMode="decimal"
            value={mAmount}
            onChange={(e) => setMAmount(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Split count"
            inputMode="numeric"
            value={mSplit}
            onChange={(e) => setMSplit(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Description"
            value={mDesc}
            onChange={(e) => setMDesc(e.target.value)}
          />
          <select className="input-field" value={mCat} onChange={(e) => setMCat(e.target.value)}>
            {['utilities', 'food', 'transport', 'groceries', 'entertainment', 'other'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary w-full" onClick={confirmManual}>
            Confirm
          </button>
        </div>
      ) : null}

      <BottomNav />
    </PageWrapper>
  )
}
