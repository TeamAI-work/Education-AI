-- ============================================================
-- seed_badges.sql  (v2 — 12 badges per grade group, 24 total)
-- Run this AFTER schema_migration.sql in your Supabase SQL Editor.
-- ============================================================

-- Step 1: Remove the old 4+4 badges so we start clean
DELETE FROM user_badges
  WHERE badge_id IN (
    '14000000-0000-0000-0000-000000000001',
    '14000000-0000-0000-0000-000000000002',
    '14000000-0000-0000-0000-000000000003',
    '14000000-0000-0000-0000-000000000004',
    '58000000-0000-0000-0000-000000000001',
    '58000000-0000-0000-0000-000000000002',
    '58000000-0000-0000-0000-000000000003',
    '58000000-0000-0000-0000-000000000004'
  );

DELETE FROM badges
  WHERE id IN (
    '14000000-0000-0000-0000-000000000001',
    '14000000-0000-0000-0000-000000000002',
    '14000000-0000-0000-0000-000000000003',
    '14000000-0000-0000-0000-000000000004',
    '58000000-0000-0000-0000-000000000001',
    '58000000-0000-0000-0000-000000000002',
    '58000000-0000-0000-0000-000000000003',
    '58000000-0000-0000-0000-000000000004'
  );

-- Step 2: Seed all 24 new badges with rarity tiers
-- UUID scheme:
--   14100000-... = Grade 1-4 Common
--   14200000-... = Grade 1-4 Rare
--   14300000-... = Grade 1-4 Legendary
--   58100000-... = Grade 5-8 Common
--   58200000-... = Grade 5-8 Rare
--   58300000-... = Grade 5-8 Legendary

INSERT INTO badges (id, title, description, icon_url, grade_group, rarity, created_at)
VALUES

  -- ── Grade 1–4 Common (4) ───────────────────────────────────
  (
    '14100000-0000-0000-0000-000000000001',
    'Aura Beginner',
    'Complete any 1 activity and start your learning journey!',
    '🚀', '1-4', 'common',
    '2024-01-01 00:01:00+00'
  ),
  (
    '14100000-0000-0000-0000-000000000002',
    'First Tracer',
    'Complete letter tracing for the very first time.',
    '✍️', '1-4', 'common',
    '2024-01-01 00:02:00+00'
  ),
  (
    '14100000-0000-0000-0000-000000000003',
    'Math Explorer',
    'Play the Living Math emoji counting game once.',
    '🔢', '1-4', 'common',
    '2024-01-01 00:03:00+00'
  ),
  (
    '14100000-0000-0000-0000-000000000004',
    'Snapshot Taker',
    'Share any 1 picture in Show & Tell.',
    '📷', '1-4', 'common',
    '2024-01-01 00:04:00+00'
  ),

  -- ── Grade 1–4 Rare (5) ────────────────────────────────────
  (
    '14200000-0000-0000-0000-000000000001',
    'Tiny Tracer',
    'Complete 5 letter tracing sessions each scoring 85% or higher.',
    '🖊️', '1-4', 'rare',
    '2024-01-01 00:05:00+00'
  ),
  (
    '14200000-0000-0000-0000-000000000002',
    'Living Math Pioneer',
    'Get a perfect 100% score in Living Math three separate times.',
    '🧮', '1-4', 'rare',
    '2024-01-01 00:06:00+00'
  ),
  (
    '14200000-0000-0000-0000-000000000003',
    'Activity Mixer',
    'Try all 3 activities: Letter Tracing, Living Math, and Show & Tell.',
    '🎯', '1-4', 'rare',
    '2024-01-01 00:07:00+00'
  ),
  (
    '14200000-0000-0000-0000-000000000004',
    'Score Chaser',
    'Achieve a score of 90% or higher on any single activity.',
    '🌟', '1-4', 'rare',
    '2024-01-01 00:08:00+00'
  ),
  (
    '14200000-0000-0000-0000-000000000005',
    'Alphabet Half',
    'Trace at least 13 different letters of the alphabet.',
    '🔤', '1-4', 'rare',
    '2024-01-01 00:09:00+00'
  ),

  -- ── Grade 1–4 Legendary (3) ───────────────────────────────
  (
    '14300000-0000-0000-0000-000000000001',
    'Alphabet Master',
    'Trace all 26 letters of the alphabet, each with 90% or higher accuracy.',
    '👑', '1-4', 'legendary',
    '2024-01-01 00:10:00+00'
  ),
  (
    '14300000-0000-0000-0000-000000000002',
    'Perfect Day',
    'Complete all 3 activity types — Tracing, Math, and Show & Tell — in a single day.',
    '🏆', '1-4', 'legendary',
    '2024-01-01 00:11:00+00'
  ),
  (
    '14300000-0000-0000-0000-000000000003',
    'Star Performer',
    'Achieve 90% or higher accuracy on 5 completely different letters.',
    '🌠', '1-4', 'legendary',
    '2024-01-01 00:12:00+00'
  ),

  -- ── Grade 5–8 Common (4) ──────────────────────────────────
  (
    '58100000-0000-0000-0000-000000000001',
    'Aura Beginner',
    'Create your profile and complete your first study session.',
    '🚀', '5-8', 'common',
    '2024-01-01 00:13:00+00'
  ),
  (
    '58100000-0000-0000-0000-000000000002',
    'First Query',
    'Ask the Aura AI Study Helper your very first academic question.',
    '✨', '5-8', 'common',
    '2024-01-01 00:14:00+00'
  ),
  (
    '58100000-0000-0000-0000-000000000003',
    'First Note',
    'Save your first highlight in the Digital Notebook.',
    '📖', '5-8', 'common',
    '2024-01-01 00:15:00+00'
  ),
  (
    '58100000-0000-0000-0000-000000000004',
    'Daily Visitor',
    'Visit your dashboard on at least 2 different days.',
    '📅', '5-8', 'common',
    '2024-01-01 00:16:00+00'
  ),

  -- ── Grade 5–8 Rare (5) ────────────────────────────────────
  (
    '58200000-0000-0000-0000-000000000001',
    'Consistency Star',
    'Build a study streak of 5 consecutive days.',
    '🔥', '5-8', 'rare',
    '2024-01-01 00:17:00+00'
  ),
  (
    '58200000-0000-0000-0000-000000000002',
    'AI Inquirer',
    'Ask the AI textbook assistant 10 academic questions in total.',
    '🤖', '5-8', 'rare',
    '2024-01-01 00:18:00+00'
  ),
  (
    '58200000-0000-0000-0000-000000000003',
    'Active Annotator',
    'Save 5 highlights in your Digital Notebook.',
    '🗒️', '5-8', 'rare',
    '2024-01-01 00:19:00+00'
  ),
  (
    '58200000-0000-0000-0000-000000000004',
    'Subject Explorer',
    'Ask the AI about at least 3 different academic subjects.',
    '🗺️', '5-8', 'rare',
    '2024-01-01 00:20:00+00'
  ),
  (
    '58200000-0000-0000-0000-000000000005',
    'Habit Pioneer',
    'Complete both a notebook highlight and an AI query on the same day.',
    '🏅', '5-8', 'rare',
    '2024-01-01 00:21:00+00'
  ),

  -- ── Grade 5–8 Legendary (3) ───────────────────────────────
  (
    '58300000-0000-0000-0000-000000000001',
    'Editor Pro',
    'Edit or annotate at least 3 of your saved notebook notes.',
    '✒️', '5-8', 'legendary',
    '2024-01-01 00:22:00+00'
  ),
  (
    '58300000-0000-0000-0000-000000000002',
    'Study Architect',
    'Accumulate 20 AI queries AND 10 saved notes — both thresholds.',
    '🧠', '5-8', 'legendary',
    '2024-01-01 00:23:00+00'
  ),
  (
    '58300000-0000-0000-0000-000000000003',
    'Iron Scholar',
    'Do both a notebook highlight AND an AI query every single day for 7 consecutive days.',
    '🏆', '5-8', 'legendary',
    '2024-01-01 00:24:00+00'
  )

ON CONFLICT (id)
DO UPDATE SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  icon_url    = EXCLUDED.icon_url,
  grade_group = EXCLUDED.grade_group,
  rarity      = EXCLUDED.rarity;

SELECT '24 master badges seeded successfully (4C+5R+3L per grade group).' AS status;
