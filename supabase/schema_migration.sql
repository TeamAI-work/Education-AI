-- ============================================================
-- schema_migration.sql
-- Run this BEFORE seed_badges.sql in your Supabase SQL Editor
-- Adds rarity tier column to badges and metadata JSONB to
-- activity_logs for per-letter tracing and subject tracking.
-- ============================================================

-- Add rarity column to badges table
ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common';

-- Add a CHECK constraint so only valid rarity values are accepted
DO $$ BEGIN
  ALTER TABLE badges ADD CONSTRAINT badges_rarity_check
    CHECK (rarity IN ('common', 'rare', 'legendary'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add metadata JSONB column to activity_logs
-- Used to store per-activity context e.g. { "letter": "A" } or { "subject": "photosynthesis" }
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Done!
SELECT 'Schema migration applied: rarity column on badges, metadata column on activity_logs.' AS status;
