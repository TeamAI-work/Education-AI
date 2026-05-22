-- ============================================================
-- fix_schema_drift.sql
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
--
-- Problem: profiles table was altered to have an auto-generated
-- `id` PK + a separate `user_id` FK to auth.users. The trigger
-- and RLS policies still use the OLD design (profiles.id = auth.users.id).
-- This causes a NOT NULL violation on `user_id` → 500 on signup.
--
-- Fix Strategy: Keep the new schema (auto id + user_id), and fix
-- the trigger, RLS policies, and add the required UNIQUE constraint.
-- ============================================================

-- Step 1: Add UNIQUE constraint on profiles.user_id
-- (Required for ON CONFLICT (user_id) in the trigger)
DO $$ BEGIN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'UNIQUE constraint on profiles.user_id already exists, skipping.';
END $$;

-- Step 2: Fix RLS policies — they currently check auth.uid() = id
-- but `id` is now auto-generated. Must check auth.uid() = user_id.
DROP POLICY IF EXISTS "Users can view their own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 3: Fix the handle_new_user trigger
-- - Insert into user_id (not id) 
-- - Use ON CONFLICT (user_id)
-- - SET row_security = off so RLS doesn't block the trigger
-- - Add EXCEPTION guard so trigger NEVER blocks auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_grade TEXT;
BEGIN
    requested_grade := COALESCE(NEW.raw_user_meta_data->>'grade_group', '5-8');

    INSERT INTO public.profiles (user_id, full_name, grade_group, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Student'),
        CASE
            WHEN requested_grade IN ('1-4', '5-8', '9-10', '11-12') THEN requested_grade::grade_group_type
            ELSE '5-8'::grade_group_type
        END,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🧑‍🎓')
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name   = EXCLUDED.full_name,
        grade_group = EXCLUDED.grade_group,
        avatar_url  = EXCLUDED.avatar_url;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Never block auth user creation due to a trigger error
        RAISE WARNING 'handle_new_user() failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   SET row_security = off;  -- bypass RLS so trigger can always insert

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify
SELECT 'fix_schema_drift.sql applied successfully.' AS status;
