/**
 * Minimum transfer settlement from unsettled P2P debts (greedy).
 * @param {Array<{ ower_id: string, owed_to_id: string, amount_paise: number }>} unsettledDebts
 * @returns {Array<{ from: string, to: string, amount_paise: number }>}
 */
export function calculateSettlement(unsettledDebts) {
  const netBalance = {}

  unsettledDebts.forEach((debt) => {
    const amt = debt.amount_paise
    if (!amt || amt <= 0) return
    netBalance[debt.owed_to_id] = (netBalance[debt.owed_to_id] ?? 0) + amt
    netBalance[debt.ower_id] = (netBalance[debt.ower_id] ?? 0) - amt
  })

  const creditors = Object.entries(netBalance)
    .filter(([, v]) => v > 0)
    .map(([id, val]) => [id, val])
    .sort((a, b) => b[1] - a[1])

  const debtors = Object.entries(netBalance)
    .filter(([, v]) => v < 0)
    .map(([id, val]) => [id, val])
    .sort((a, b) => a[1] - b[1])

  const transfers = []
  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    let credit = creditors[i][1]
    let debt = debtors[j][1]
    const creditorId = creditors[i][0]
    const debtorId = debtors[j][0]

    const amount = Math.min(credit, Math.abs(debt))
    if (amount > 0) {
      transfers.push({
        from: debtorId,
        to: creditorId,
        amount_paise: Math.round(amount),
      })
    }

    creditors[i][1] -= amount
    debtors[j][1] += amount

    if (creditors[i][1] === 0) i++
    if (debtors[j][1] === 0) j++
  }

  return transfers
}

export function totalPaiseFromTransfers(transfers) {
  return transfers.reduce((s, t) => s + t.amount_paise, 0)
}
