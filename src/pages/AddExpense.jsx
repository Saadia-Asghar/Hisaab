import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parseExpenseText } from '../lib/deepseek'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { PageWrapper } from '../components/layout/PageWrapper'
import { CategoryPill } from '../components/ui/CategoryPill'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../context/ToastContext'
import { rupeesToPaise } from '../utils/formatters'

export default function AddExpense() {
  const { session, user } = useAuth()
  const nav = useNavigate()
  const { showToast } = useToast()
  const { activeGroupId, members } = useGroup(user?.id)

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [manual, setManual] = useState(false)
  const [mAmount, setMAmount] = useState('')
  const [mSplit, setMSplit] = useState('2')
  const [mDesc, setMDesc] = useState('')
  const [mCat, setMCat] = useState('other')

  const nonPayerMembers = (members ?? []).filter((m) => m.id !== user?.id)
  const [selectedDebtors, setSelectedDebtors] = useState(null)
  const [showSplitPicker, setShowSplitPicker] = useState(false)

  if (!session) return <Navigate to="/" replace />

  function toggleDebtor(id) {
    setSelectedDebtors((prev) => {
      const current = prev ?? nonPayerMembers.map((m) => m.id)
      return current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    })
  }

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
      showToast('Could not parse input. Switching to manual entry.', 'error')
      return
    }
    const auto = nonPayerMembers.slice(0, Math.max(0, (res.split_count ?? 2) - 1)).map((m) => m.id)
    setSelectedDebtors(auto)
    setParsed(res)
    setManual(false)
  }

  async function confirm(parsedRow) {
    if (!activeGroupId) {
      showToast('Please create or join a group first.', 'error')
      return
    }
    const amountRupees = parsedRow.amount_rupees
    const split = parsedRow.split_count
    const share = parsedRow.share_rupees

    const { error: txErr } = await supabase.from('transactions').insert({
      group_id: activeGroupId,
      paid_by: user.id,
      amount_paise: rupeesToPaise(amountRupees),
      description: parsedRow.description,
      category: parsedRow.category,
      split_count: split,
      share_paise: rupeesToPaise(share),
      raw_input: text || null,
      created_at: new Date().toISOString(),
    })

    if (txErr) {
      showToast(txErr.message, 'error')
      return
    }

    const debtors =
      selectedDebtors ?? nonPayerMembers.slice(0, Math.max(0, split - 1)).map((m) => m.id)
    const sharePaise = rupeesToPaise(share)

    if (debtors.length > 0) {
      const debtRows = debtors.map((memberId) => ({
        group_id: activeGroupId,
        ower_id: memberId,
        owed_to_id: user.id,
        amount_paise: sharePaise,
        description: parsedRow.description,
        settled: false,
        created_at: new Date().toISOString(),
      }))

      const { error: debtErr } = await supabase.from('debts').insert(debtRows)
      if (debtErr) {
        showToast('Expense saved, but debts could not be auto-created.', 'error')
      } else {
        showToast(`Expense saved. ${debtors.length} members now owe this share.`)
      }
    } else {
      showToast('Expense saved successfully.')
    }

    nav('/dashboard')
  }

  async function confirmManual() {
    const amountRupees = Number(mAmount)
    const split = Math.max(1, Number(mSplit) || 2)
    if (!amountRupees || amountRupees <= 0) {
      showToast('Please enter a valid amount.', 'error')
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

  const debtorIds =
    selectedDebtors ??
    nonPayerMembers.slice(0, parsed ? Math.max(0, (parsed.split_count ?? 2) - 1) : 0).map((m) => m.id)
  const debtorNames = debtorIds.map((id) => nonPayerMembers.find((m) => m.id === id)?.name).filter(Boolean)

  return (
    <PageWrapper showBottomNav>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/dashboard" className="btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Add Expense</h1>
      </div>

      <div className="relative">
        <textarea
          className="input-field min-h-[120px] resize-none font-sans"
          placeholder="Example: Electricity 3800 split 5, or Groceries 1200 shared by 4..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-[var(--bg-surface)]/80">
            <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
              <Sparkles className="h-4 w-4 animate-spin" />
              Parsing your entry...
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {['electricity 3800 split 5', 'pizza 1800 split 4', 'uber 650 split 3'].map((ex) => (
          <button
            key={ex}
            type="button"
            className="pill cursor-pointer bg-[var(--bg-surface)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            onClick={() => setText(ex)}
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn-primary mt-4 w-full"
        onClick={onParse}
        disabled={loading || !text.trim()}
      >
        <Sparkles className="h-4 w-4" />
        {loading ? 'Parsing...' : 'Parse & Split →'}
      </button>

      <button
        type="button"
        className="btn-ghost mt-3 w-full text-sm"
        onClick={() => {
          setSelectedDebtors(null)
          setManual(true)
        }}
      >
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
            <CategoryPill category={parsed.category} />
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{parsed.description}</p>
            <p className="balance-number mt-2">Rs {parsed.amount_rupees?.toLocaleString?.('en-PK')}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              ÷ {parsed.split_count} people ={' '}
              <span className="font-semibold text-[var(--text-primary)]">Rs {parsed.share_rupees}</span> per head
            </p>

            {nonPayerMembers.length > 0 ? (
              <div className="mt-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2"
                  onClick={() => setShowSplitPicker((p) => !p)}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {debtorIds.length > 0
                        ? `${debtorNames.join(', ')} owe you`
                        : 'No debt entries will be created'}
                    </span>
                  </div>
                  {showSplitPicker ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </button>

                <AnimatePresence>
                  {showSplitPicker ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2 rounded-lg bg-[var(--bg-surface)] p-3">
                        {nonPayerMembers.map((m) => {
                          const isSelected = debtorIds.includes(m.id)
                          return (
                            <button
                              key={m.id}
                              type="button"
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isSelected ? 'bg-[var(--accent)]/20' : 'hover:bg-[var(--bg-card)]'}`}
                              onClick={() => toggleDebtor(m.id)}
                            >
                              <Avatar name={m.name} color={m.avatar_color} size="sm" />
                              <span className="flex-1 text-left text-sm">{m.name}</span>
                              <div
                                className={`h-4 w-4 rounded-full border-2 transition-colors ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)]'}`}
                              />
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  setParsed(null)
                  setSelectedDebtors(null)
                  setManual(true)
                }}
              >
                Edit manually
              </button>
              <button type="button" className="btn-primary flex-1" onClick={() => confirm(parsed)}>
                Confirm & Save ✓
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {manual && !parsed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mt-6 space-y-3"
          >
            <p className="text-sm font-medium text-[var(--text-secondary)]">Manual entry</p>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Amount (Rs)</label>
              <input
                className="input-field"
                placeholder="3800"
                inputMode="decimal"
                value={mAmount}
                onChange={(e) => setMAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Split among how many people?</label>
              <input
                className="input-field"
                placeholder="5"
                inputMode="numeric"
                value={mSplit}
                onChange={(e) => setMSplit(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Description</label>
              <input
                className="input-field"
                placeholder="Electricity bill"
                value={mDesc}
                onChange={(e) => setMDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Category</label>
              <select className="input-field" value={mCat} onChange={(e) => setMCat(e.target.value)}>
                {['utilities', 'food', 'transport', 'groceries', 'entertainment', 'other'].map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn-primary w-full" onClick={confirmManual}>
              Confirm & Save ✓
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </PageWrapper>
  )
}
