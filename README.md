# Hisaab — حساب
**Micathon '26 · Money Moves**

> A shared-expense tracker built for Pakistani hostel students and flatmates who split bills, pool money, and need to settle up without spreadsheets or awkward conversations.

---

## 1. The User & The Problem

**Who:** University students living together — specifically the kind sharing a hostel room, flat, or paying-guest house in Pakistani cities like Islamabad, Lahore, or Faisalabad. They split electricity, gas, groceries, food deliveries, and monthly wifi among 3–6 people.

**The moment:** Someone pays a shared bill. Three minutes later they've forgotten who owes what, by how much, and since when.

**Why existing tools fail:**
- Splitwise is in English and requires a debit/credit card to mark payments
- WhatsApp groups work for reminders but can't track balances
- Excel sheets nobody updates after Week 1
- No tool speaks Roman Urdu — the actual language these students use when messaging each other

**Two minutes of success:** A user types *"bijli 3800 split 5"* → the app parses it, records Rs 760 per person, auto-creates debts for every other group member, shows who owes what, and lets them send a WhatsApp reminder — all without leaving the app.

---

## 2. Solution

Hisaab is a mobile-first web app with five features, each solving one concrete pain point:

| Feature | Pain point it solves |
|---|---|
| **AI expense parser** | No one wants to fill in a form — just type like you'd text a friend |
| **Auto-debt creation** | Expenses automatically generate "X owes Y" records |
| **Pool wallet** | Some groups pre-pool money monthly; Hisaab tracks contributions and burn rate |
| **Debt tracker** | See exactly who owes you (and what you owe) across the group |
| **Month-end settlement** | Minimum-transfer algorithm reduces N debts to the fewest possible payments, then share via WhatsApp |

---

## 3. Why the AI is Here

**The specific problem the AI solves:** Users are Pakistani students typing in Roman Urdu — a casual mix of Urdu written in Latin script. No rule-based parser can reliably extract amount, description, split count, and category from inputs like:

- *"Ahmed ne baaki grocery li 2400 hum 5 the"*
- *"pizza order kiya last night 1800 4 bande the"*
- *"bijli ka bill aaya tha 3800 5 logon mein split"*

**What the user loses if AI is removed:** They fall back to a manual form with 4 fields. The zero-friction "just type it" experience disappears — and with it the main reason they'd use this over a WhatsApp message.

**Cost / latency / failure modes:**
- Primary: DeepSeek Chat API (5M free token grant at time of build, ~50ms p50 response)
- Fallback: Gemini 2.0 Flash-Lite (also free tier)
- Second fallback: hardcoded cache for the 7 most common Pakistani expense phrases (works fully offline)
- If all else fails: manual entry form — user is never blocked

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fast iteration, excellent mobile perf |
| Styling | Tailwind CSS + CSS variables | Dark theme design system, no runtime overhead |
| Animations | Framer Motion | Spring animations for parse result reveal |
| Backend | Supabase (PostgreSQL + Auth + RLS) | Row-Level Security means one user can never see another group's data; no custom API server needed |
| AI parsing | DeepSeek Chat → Gemini 2.0 Flash-Lite fallback | Cost-efficient, Roman Urdu capable |
| PDF receipts | jsPDF (client-side) | Pool contributions download as PDF receipts |
| Deployment | Vercel (SPA rewrite) | Zero-config, instant deploy |

**Database design principle:** all monetary values stored as integers in paise (1 Rs = 100 paise) — no floating-point rounding errors, ever.

---

## 5. Data Handling

- **Auth:** Supabase Auth — passwords are never stored in our database (bcrypt-hashed by Supabase internally)
- **RLS:** Every table has Row-Level Security enabled. Users can only read/write data for groups they are members of. There is no shared table a user can enumerate.
- **No sensitive data collected:** No bank account numbers, no CNIC, no phone number required
- **AI inputs:** Expense text is sent to DeepSeek/Gemini API only (not logged by us). The raw input is saved in the `transactions` table as an audit trail — only group members can see it.
- **No credentials in code:** All API keys are environment variables (`VITE_DEEPSEEK_API_KEY`, `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

---

## 6. Core User Flow (demo script)

1. **Sign up** → enter name + email + password
2. **Create group** → name it, set monthly pool target → invite code appears instantly
3. **Share invite code** → WhatsApp button pre-fills the code into a message
4. **Friend joins** → enters the 6-char code, instantly in the same group
5. **Add expense** → type *"bijli 3800 split 5"* → AI parses → tap Confirm → transaction saved + 4 debt records auto-created
6. **Debts tab** → red badge shows unsettled count → see who owes you, send WhatsApp reminder
7. **Pool wallet** → contribute Rs 3000 → download PDF receipt
8. **Settlement** → app calculates minimum transfers → tap "Mark Paid" → DB updated → share summary to WhatsApp group

---

## 7. Setup

```bash
# 1. Clone and install
npm install

# 2. Copy env template
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_DEEPSEEK_API_KEY

# 3. Run Supabase schema
# Paste supabase/schema.sql into the Supabase SQL editor and run it

# 4. Start dev server
npm run dev

# 5. Build for production
npm run build
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_DEEPSEEK_API_KEY` | Optional | DeepSeek API key (AI parsing) |
| `VITE_GEMINI_API_KEY` | Optional | Gemini API key (fallback parsing) |

If neither AI key is set, the app falls back to the built-in phrase cache and manual entry — fully functional for the 7 most common expense types.

---

## 8. Financial Prospect & Sustainability

**Revenue path (post-hackathon):**
- Freemium: free for groups up to 6, paid tier for larger groups (student societies, sports teams)
- WhatsApp Business API integration for automated reminders (B2B pricing)
- Float on pool contributions if integrated with a payment gateway (regulatory-compliant escrow, not a bank)

**Why it can sustain:**
- Zero server cost until scale (Supabase free tier handles ~500 MAU)
- No custom infrastructure — Supabase handles auth, DB, real-time, storage
- Incremental mobile wrapper (Capacitor/Expo) costs nothing; same codebase
- The WhatsApp reminder loop is organic virality — every reminder sent to a non-user is an acquisition touchpoint

**Realistic scope:** This is a tooling play, not a neobank. Hisaab never touches real money — it tracks obligations and reduces friction around settlement. That keeps it out of regulatory scope while solving the same day-to-day pain.

---

*Built at Micathon '26, Microsoft Club GIKI, by team Hisaab.*
