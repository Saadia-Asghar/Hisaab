-- ═══════════════════════════════════════════════════════════════════
-- HISAAB — Supabase SQL (run in SQL editor)
-- Money stored as INTEGER paise (1 Rs = 100 paise, no floats ever)
-- ═══════════════════════════════════════════════════════════════════

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone        TEXT,
  avatar_color TEXT DEFAULT '#4F6EF7',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  created_by     UUID REFERENCES public.profiles (id),
  monthly_target INTEGER DEFAULT 0,
  current_month  TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  invite_code    TEXT UNIQUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup by invite code
CREATE INDEX IF NOT EXISTS groups_invite_code_idx ON public.groups (invite_code);

CREATE TABLE IF NOT EXISTS public.group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pool_contributions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles (id),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  month        TEXT NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES public.groups (id) ON DELETE CASCADE,
  paid_by      UUID REFERENCES public.profiles (id),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  description  TEXT NOT NULL,
  category     TEXT DEFAULT 'other'
                CHECK (category IN ('utilities','food','transport','groceries','entertainment','other')),
  split_count  INTEGER DEFAULT 1 CHECK (split_count >= 1),
  share_paise  INTEGER NOT NULL CHECK (share_paise > 0),
  raw_input    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.debts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES public.groups (id) ON DELETE CASCADE,
  ower_id      UUID REFERENCES public.profiles (id),
  owed_to_id   UUID REFERENCES public.profiles (id),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  description  TEXT,
  settled      BOOLEAN DEFAULT FALSE,
  settled_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_debt CHECK (ower_id <> owed_to_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS debts_group_settled_idx ON public.debts (group_id, settled);
CREATE INDEX IF NOT EXISTS transactions_group_created_idx ON public.transactions (group_id, created_at DESC);

-- ─── Functions ────────────────────────────────────────────────────────────────

-- Invite code lookup (bypasses RLS safely — returns at most one row)
CREATE OR REPLACE FUNCTION public.get_group_by_invite(inv text)
RETURNS SETOF public.groups
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.groups WHERE invite_code = upper(trim(inv)) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_by_invite(text) TO authenticated;

-- Group stats in one round-trip (contributed, spent, unsettled debt count)
CREATE OR REPLACE FUNCTION public.get_group_stats(p_group_id uuid, p_month text)
RETURNS TABLE (
  contributed_paise bigint,
  spent_paise       bigint,
  unsettled_debts   bigint
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT SUM(amount_paise) FROM pool_contributions WHERE group_id = p_group_id AND month = p_month), 0) AS contributed_paise,
    COALESCE((SELECT SUM(amount_paise) FROM transactions      WHERE group_id = p_group_id AND TO_CHAR(created_at, 'YYYY-MM') = p_month), 0) AS spent_paise,
    COALESCE((SELECT COUNT(*)          FROM debts              WHERE group_id = p_group_id AND settled = false), 0) AS unsettled_debts;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_stats(uuid, text) TO authenticated;

-- ─── Enable Row Level Security ────────────────────────────────────────────────

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts             ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Legacy policy names (older Hisaab schema)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_same_group" ON public.profiles;

DROP POLICY IF EXISTS "profiles_select_visible"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"      ON public.profiles;

CREATE POLICY "profiles_select_visible" ON public.profiles FOR SELECT USING (
  id = auth.uid()
  OR id IN (
    SELECT gm2.user_id
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
  )
);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ─── Groups ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "groups_select_member"        ON public.groups;
DROP POLICY IF EXISTS "groups_insert_authenticated" ON public.groups;
DROP POLICY IF EXISTS "groups_update_creator"       ON public.groups;

CREATE POLICY "groups_select_member" ON public.groups FOR SELECT USING (
  created_by = auth.uid()
  OR id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "groups_insert_authenticated" ON public.groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
CREATE POLICY "groups_update_creator" ON public.groups FOR UPDATE
  USING (created_by = auth.uid());

-- ─── Group members ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "gm_select_same_group"      ON public.group_members;
DROP POLICY IF EXISTS "gm_insert_self_or_creator" ON public.group_members;
DROP POLICY IF EXISTS "gm_delete_self"            ON public.group_members;

CREATE POLICY "gm_select_same_group" ON public.group_members FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "gm_insert_self_or_creator" ON public.group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  );
CREATE POLICY "gm_delete_self" ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

-- ─── Pool contributions ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pool_group_members" ON public.pool_contributions;
CREATE POLICY "pool_group_members" ON public.pool_contributions FOR ALL
  USING    (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  WITH CHECK (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

-- ─── Transactions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tx_group_members" ON public.transactions;
CREATE POLICY "tx_group_members" ON public.transactions FOR ALL
  USING    (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  WITH CHECK (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

-- ─── Debts ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "debts_group_members" ON public.debts;
CREATE POLICY "debts_group_members" ON public.debts FOR ALL
  USING    (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  WITH CHECK (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

-- ─── Enable Realtime ──────────────────────────────────────────────────────────
-- Run this ONCE in Supabase SQL editor to enable live subscriptions.
-- If a table is already in the publication, you may see a harmless error — skip that line.
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pool_contributions;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- To verify everything is set up:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
