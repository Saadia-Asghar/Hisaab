import { rupeesToPaise, currentMonthKey } from './formatters'

/**
 * Seeds demo transactions, contributions, and debts for the current group month.
 * Maps members by profile name when possible (PRD demo names).
 */
export async function seedDemoData(supabase, groupId, profilesInGroup) {
  const month = currentMonthKey()
  const byName = Object.fromEntries((profilesInGroup ?? []).map((p) => [p.name, p]))

  const ali = byName['Ali']
  const hassan = byName['Hassan']
  const bilal = byName['Bilal']
  const omar = byName['Omar']
  const kamran = byName['Kamran']

  const txs = [
    { paid: ali, desc: 'Electricity bill', amount: 3800, split: 5, cat: 'utilities' },
    { paid: hassan, desc: 'Monthly groceries', amount: 2400, split: 5, cat: 'groceries' },
    { paid: bilal, desc: 'Pizza delivery', amount: 1800, split: 4, cat: 'food' },
    { paid: omar, desc: 'Uber to city', amount: 650, split: 3, cat: 'transport' },
    { paid: ali, desc: 'Internet bill', amount: 1200, split: 5, cat: 'utilities' },
  ]

  const txRows = []
  for (const t of txs) {
    if (!t.paid) continue
    const amountPaise = rupeesToPaise(t.amount)
    const share = Math.round(amountPaise / t.split)
    txRows.push({
      group_id: groupId,
      paid_by: t.paid.id,
      amount_paise: amountPaise,
      description: t.desc,
      category: t.cat,
      split_count: t.split,
      share_paise: share,
      raw_input: null,
      created_at: new Date().toISOString(),
    })
  }

  if (txRows.length) {
    const { error: txErr } = await supabase.from('transactions').insert(txRows)
    if (txErr) throw txErr
  }

  const contributors = [ali, hassan, bilal, omar, kamran].filter(Boolean)
  const poolRows = contributors.map((p) => ({
    group_id: groupId,
    user_id: p.id,
    amount_paise: rupeesToPaise(3000),
    month,
    note: 'Demo seed',
    created_at: new Date().toISOString(),
  }))

  if (poolRows.length) {
    const { error: poolErr } = await supabase.from('pool_contributions').insert(poolRows)
    if (poolErr) throw poolErr
  }

  const debtSpecs = [
    { ower: hassan, owed: ali, amount: 760, desc: 'Electricity share' },
    { ower: omar, owed: ali, amount: 760, desc: 'Electricity share' },
    { ower: kamran, owed: hassan, amount: 480, desc: 'Grocery share' },
    { ower: bilal, owed: omar, amount: 217, desc: 'Uber share' },
  ]

  const debtRows = []
  for (const d of debtSpecs) {
    if (!d.ower || !d.owed) continue
    debtRows.push({
      group_id: groupId,
      ower_id: d.ower.id,
      owed_to_id: d.owed.id,
      amount_paise: rupeesToPaise(d.amount),
      description: d.desc,
      settled: false,
      created_at: new Date().toISOString(),
    })
  }

  if (debtRows.length) {
    const { error: debtErr } = await supabase.from('debts').insert(debtRows)
    if (debtErr) throw debtErr
  }

  return { transactions: txRows.length, contributions: poolRows.length, debts: debtRows.length }
}
