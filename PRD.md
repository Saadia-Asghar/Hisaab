# HISAAB — Product Requirements Document
**Version:** 1.0 | **Hackathon:** Micathon '26 by Microsoft Club GIKI | **Theme:** Money Moves  
**App Name:** Hisaab (حساب) — meaning "the reckoning / the account" in Urdu  
**Tagline:** Group money OS for Pakistani university students. No awkward conversations. Just settled.

---

## 1. WHAT WE ARE BUILDING

Hisaab is a dark-themed mobile-first web app that solves the financial trust problem in Pakistani hostel group living. It combines three tools that currently don't exist together for Pakistani students:

1. A **digital committee (pool) wallet** — groups pre-fund a shared pool and expenses auto-deduct from it
2. A **Roman Urdu AI expense parser** — type expenses naturally ("bijli 3800 split 5") and AI structures them
3. An **automated debt tracker + settlement engine** — tracks who owes whom and settles it in minimum transfers

**The single user:** Ali, a 2nd-year GIKI student sharing a hostel room with 4 others. They pool Rs 3,000/month each for electricity, gas, groceries, and shared Ubers. Every month-end, someone owes money and nobody agrees on the number. Friendships get damaged.

**The single moment:** Ali just paid the electricity bill — Rs 3,800 — from his own pocket. He needs to recover his share from 4 people without sending 4 WhatsApp messages and starting a fight.

**Success in 2 minutes:** Ali types "bijli 3800 split 5" → AI parses it → each roommate gets notified their share is Rs 760 → pool auto-deducts → Ali's balance updates → no argument, no WhatsApp, done.

---

## 2. TECH STACK

```
Frontend:     React (Vite) — mobile-first, single page app
Styling:      Tailwind CSS + custom CSS design system
Animations:   Framer Motion
Icons:        Lucide React
Database:     Supabase (PostgreSQL with Row Level Security ON)
Auth:         Supabase Auth (email/password)
AI:           DeepSeek API (deepseek-chat / DeepSeek-V3.2) — PRIMARY
AI Backup:    Gemini 2.5 Flash-Lite (if DeepSeek unavailable)
PDF:          jsPDF (client-side, no server needed)
Routing:      React Router DOM v6
Deployment:   Vercel
```

**Why DeepSeek:** Free 5M token grant, no rate limits, OpenAI-compatible API format. Perfect for Roman Urdu NLP parsing — the one AI task in this app.

**Critical rule:** AI is used in EXACTLY ONE place — parsing Roman Urdu expense text into structured JSON. Every other feature is pure deterministic logic and database queries. No AI for analytics, no AI for recommendations, no AI anywhere else.

---

## 3. DESIGN SYSTEM

### 3.1 Philosophy
Dark-first. Premium fintech feel. Reference: Linear.app (spacing), Monzo app (clarity), Revolut (trust). NOT generic AI purple gradients. NOT Bootstrap. NOT default Tailwind.

### 3.2 Colors (CSS Variables — defined in src/styles/globals.css)
```css
--bg-base:        #0C0F1A   /* page background */
--bg-surface:     #111827   /* input backgrounds, nav */
--bg-card:        #1E2435   /* card backgrounds */
--bg-card-hover:  #252D40   /* card hover */
--accent:         #4F6EF7   /* primary blue — buttons, active states */
--accent-hover:   #3D5CE8   /* button hover */
--accent-glow:    rgba(79,110,247,0.15)  /* glow effect around cards */
--success:        #10B981   /* green — owed to you, settled */
--warning:        #F59E0B   /* amber — budget 60-80% */
--danger:         #EF4444   /* red — owes money, budget >80% */
--text-primary:   #F8FAFC   /* main text */
--text-secondary: #94A3B8   /* labels, metadata */
--text-muted:     #475569   /* placeholders, captions */
--border:         rgba(255,255,255,0.06)  /* subtle card borders */
--border-accent:  rgba(79,110,247,0.3)   /* focused input borders */
```

### 3.3 Typography
```
Display / Numbers: "Plus Jakarta Sans" — Google Fonts, weights 400,500,600,700
Body / UI:         "DM Sans" — Google Fonts, weights 400,500
NEVER use:         Inter, Roboto, Arial, system-ui for display elements
```

Usage rules:
- All rupee amounts → Plus Jakarta Sans, bold, letter-spacing: -0.5px to -1px
- All UI text, labels, descriptions → DM Sans
- Roman Urdu text (user input) → DM Sans, reads cleanly

### 3.4 Component Classes (defined in globals.css)
```
.card          → bg-card, border, border-radius 14px, padding 1.25rem
.btn-primary   → accent bg, white text, 10px radius, 12px/20px padding, glow on hover
.btn-ghost     → transparent, border, hover bg-card
.btn-danger    → danger bg, white text
.input-field   → bg-surface, border, 10px radius, accent border + glow on focus
.balance-number → Plus Jakarta Sans, 700 weight, 2rem+, letter-spacing -1px
.avatar        → colored circle with white initials, DM Sans bold
.pill          → small rounded label, various color variants
.skeleton      → CSS shimmer animation for loading states
```

### 3.5 Micro-interactions (required)
- Numbers count up on load: 0 → final value in 0.8s (CSS counter or JS)
- Expense parse result: slides up with framer-motion (y: 30→0, opacity: 0→1, 0.3s)
- Confirm button: ripple → checkmark → success state
- Settlement cards: smooth green color transition when marked paid
- Input field border glows accent blue on focus
- Budget bar pulses (CSS animation) when at 80%+
- Avatar circles show name tooltip on hover

---

## 4. DATABASE SCHEMA

All monetary values stored as INTEGER in **paise** (1 rupee = 100 paise). Never floats. Never "rupees" as decimals. This prevents floating point errors in financial calculations.

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id),
  name         TEXT NOT NULL,
  phone        TEXT,
  avatar_color TEXT DEFAULT '#4F6EF7',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (e.g. "Hostel Room 14", "Cricket Trip Group")
CREATE TABLE groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  created_by     UUID REFERENCES profiles(id),
  monthly_target INTEGER DEFAULT 0,  -- in paise
  current_month  TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Group membership
CREATE TABLE group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Monthly pool contributions
CREATE TABLE pool_contributions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES profiles(id),
  amount_paise INTEGER NOT NULL,
  month        TEXT NOT NULL,  -- format: 'YYYY-MM'
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Shared expenses / transactions
CREATE TABLE transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES groups(id) ON DELETE CASCADE,
  paid_by      UUID REFERENCES profiles(id),
  amount_paise INTEGER NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT DEFAULT 'other',  -- utilities|food|transport|groceries|entertainment|other
  split_count  INTEGER DEFAULT 1,
  share_paise  INTEGER NOT NULL,  -- amount_paise / split_count (rounded)
  raw_input    TEXT,  -- original Roman Urdu text the user typed
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Peer-to-peer debts
CREATE TABLE debts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  ower_id     UUID REFERENCES profiles(id),
  owed_to_id  UUID REFERENCES profiles(id),
  amount_paise INTEGER NOT NULL,
  description TEXT,
  settled     BOOLEAN DEFAULT FALSE,
  settled_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security Policies (ALL tables must have RLS enabled)
```sql
-- Users can only see data from groups they are members of
CREATE POLICY "group_members_only" ON transactions
  FOR ALL USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );
-- Apply same pattern to: pool_contributions, debts, groups, group_members
```

---

## 5. FILE STRUCTURE

```
hisaab/
├── .env.local                      ← API keys (NEVER commit)
│   ├── VITE_SUPABASE_URL
│   ├── VITE_SUPABASE_ANON_KEY
│   └── VITE_DEEPSEEK_API_KEY
├── index.html
├── vite.config.js
├── tailwind.config.js
└── src/
    ├── styles/
    │   └── globals.css             ← Full design system (colors, typography, classes)
    ├── lib/
    │   ├── supabase.js             ← Supabase client singleton
    │   └── deepseek.js             ← AI parser + cache + fallback
    ├── utils/
    │   ├── generateReceipt.js      ← jsPDF contribution receipt
    │   ├── settlement.js           ← Minimum transfer algorithm
    │   ├── formatters.js           ← paise→rupees, date formatting
    │   └── seedDemoData.js         ← Demo data for judging
    ├── hooks/
    │   ├── useAuth.js              ← Supabase auth state
    │   ├── useGroup.js             ← Current group data
    │   └── useTransactions.js      ← Transactions + real-time updates
    ├── components/
    │   ├── layout/
    │   │   ├── BottomNav.jsx       ← Fixed mobile navigation
    │   │   └── PageWrapper.jsx     ← Max-width container + safe areas
    │   └── ui/
    │       ├── Avatar.jsx          ← Colored circle with initials
    │       ├── BalanceCard.jsx     ← Pool balance with progress bar
    │       ├── TransactionItem.jsx ← Single feed item
    │       ├── DebtCard.jsx        ← Debt with settle button
    │       ├── Toast.jsx           ← Success/error notifications
    │       ├── Skeleton.jsx        ← Loading shimmer
    │       └── CategoryPill.jsx    ← Colored category label
    └── pages/
        ├── Login.jsx               ← Auth entry
        ├── Signup.jsx              ← Auth + profile creation
        ├── Dashboard.jsx           ← Home screen (pool + activity)
        ├── AddExpense.jsx          ← AI parse screen (HERO)
        ├── PoolWallet.jsx          ← Contributions + receipts
        ├── Debts.jsx               ← P2P debt tracker
        └── Settlement.jsx          ← Month-end settlement engine
```

---

## 6. FEATURES — COMPLETE SPECIFICATION

*(Sections 6.1–6.9, 7–14: see repository history for full text; implementation tracks this PRD.)*

---

*PRD v1.0 — Micathon '26 — Team Hisaab — GIKI*  
*Last updated: April 2026*
