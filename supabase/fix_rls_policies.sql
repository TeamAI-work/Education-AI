-- ============================================================
-- fix_rls_policies.sql
-- Run in: Supabase Dashboard → SQL Editor
--
-- Problem:
--   All data tables (user_streaks, activity_logs, notebook_notes,
--   chat_sessions, user_badges, concept_maps) have:
--       user_id  UUID  FK → profiles.id   (auto-generated UUID)
--
--   But the existing RLS policies check:
--       auth.uid() = user_id
--
--   This NEVER matches because auth.uid() is the Supabase auth user ID,
--   while user_id in these tables is profiles.id (a different auto-UUID).
--
-- Fix:
--   Rewrite every policy to resolve the auth user through profiles:
--       auth.uid() = (
--           SELECT user_id FROM profiles WHERE id = <table>.user_id
--       )
--   where profiles.user_id = auth.users.id  (the real auth user ID)
-- ============================================================

-- ── user_streaks ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own streak"   ON user_streaks;
DROP POLICY IF EXISTS "Users can insert their own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can update their own streak" ON user_streaks;

CREATE POLICY "Users can view their own streak"
  ON user_streaks FOR SELECT TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = user_streaks.user_id)
  );

CREATE POLICY "Users can insert their own streak"
  ON user_streaks FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = user_streaks.user_id)
  );

CREATE POLICY "Users can update their own streak"
  ON user_streaks FOR UPDATE TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = user_streaks.user_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = user_streaks.user_id)
  );

-- ── activity_logs ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view their own activity logs"   ON activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;

CREATE POLICY "Users can manage their own activity logs"
  ON activity_logs FOR ALL TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = activity_logs.user_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = activity_logs.user_id)
  );

-- ── notebook_notes ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own notes" ON notebook_notes;

CREATE POLICY "Users can manage their own notes"
  ON notebook_notes FOR ALL TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = notebook_notes.user_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = notebook_notes.user_id)
  );

-- ── chat_sessions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;

CREATE POLICY "Users can manage their own chat sessions"
  ON chat_sessions FOR ALL TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = chat_sessions.user_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = chat_sessions.user_id)
  );

-- ── chat_messages (via session ownership) ─────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON chat_messages;

CREATE POLICY "Users can manage their own chat messages"
  ON chat_messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      JOIN profiles p ON p.id = cs.user_id
      WHERE cs.id = chat_messages.session_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      JOIN profiles p ON p.id = cs.user_id
      WHERE cs.id = chat_messages.session_id
        AND p.user_id = auth.uid()
    )
  );

-- ── user_badges ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own badges"  ON user_badges;
DROP POLICY IF EXISTS "Users can unlock badges"          ON user_badges;

CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = user_badges.user_id)
  );

CREATE POLICY "Users can unlock badges"
  ON user_badges FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = user_badges.user_id)
  );

CREATE POLICY "Users can update their own badge progress"
  ON user_badges FOR UPDATE TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = user_badges.user_id)
  );

-- ── concept_maps ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own maps" ON concept_maps;

CREATE POLICY "Users can manage their own maps"
  ON concept_maps FOR ALL TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = concept_maps.user_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = concept_maps.user_id)
  );

SELECT 'fix_rls_policies.sql applied — all data table RLS now resolves auth through profiles.user_id' AS status;
