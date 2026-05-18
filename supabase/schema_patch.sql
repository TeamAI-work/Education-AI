-- ============================================================
-- schema_patch.sql
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- This allows the app to insert student profiles without
-- requiring Supabase Auth (no anonymous sign-in needed).
-- ============================================================

-- Drop restrictive policies that require auth.uid()
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own notes" ON notebook_notes;
DROP POLICY IF EXISTS "Users can manage their own maps" ON concept_maps;
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON chat_messages;

-- ── Profiles ────────────────────────────────────────────────
-- Allow anyone to insert a profile (students create their own on first visit)
CREATE POLICY "Public can insert profiles"
  ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anyone to read any profile
CREATE POLICY "Public can read profiles"
  ON profiles FOR SELECT TO anon, authenticated USING (true);

-- Allow profile updates (student can update their own record)
CREATE POLICY "Public can update profiles"
  ON profiles FOR UPDATE TO anon, authenticated USING (true);

-- ── User Streaks ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can read streaks" ON user_streaks;
DROP POLICY IF EXISTS "Public can insert streaks" ON user_streaks;
DROP POLICY IF EXISTS "Public can update streaks" ON user_streaks;

CREATE POLICY "Public can read streaks"
  ON user_streaks FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can insert streaks"
  ON user_streaks FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can update streaks"
  ON user_streaks FOR UPDATE TO anon, authenticated USING (true);

-- ── Activity Logs ────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Public can read activity logs" ON activity_logs;

CREATE POLICY "Public can insert activity logs"
  ON activity_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can read activity logs"
  ON activity_logs FOR SELECT TO anon, authenticated USING (true);

-- ── User Badges ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can read user badges" ON user_badges;
DROP POLICY IF EXISTS "Public can insert user badges" ON user_badges;

CREATE POLICY "Public can read user badges"
  ON user_badges FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can insert user badges"
  ON user_badges FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ── Badges (master list) ─────────────────────────────────────
-- Already has a public read policy from schema.sql.
-- No changes needed.

-- ── Documents ────────────────────────────────────────────────
-- Already has a public read policy from schema.sql.
-- No changes needed.

-- Done!
SELECT 'Policies updated successfully. No anonymous auth needed.' AS status;
