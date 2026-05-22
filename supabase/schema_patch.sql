-- ============================================================
-- schema_patch.sql
-- Run this in your Supabase SQL Editor after schema.sql, or on an
-- existing project that previously used public profile/streak policies.
--
-- Auth model:
--   auth.users owns email + password
--   profiles.id references auth.users.id
--   profiles is created from auth user metadata on signup
-- ============================================================

DO $$ BEGIN
    CREATE TYPE grade_group_type AS ENUM ('1-4', '5-8', '9-10', '11-12');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade_group grade_group_type NOT NULL DEFAULT '5-8';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS active_dates DATE[] DEFAULT ARRAY[]::DATE[];

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_grade TEXT;
BEGIN
    requested_grade := COALESCE(NEW.raw_user_meta_data->>'grade_group', '5-8');

    INSERT INTO public.profiles (id, full_name, grade_group, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Student'),
        CASE
            WHEN requested_grade IN ('1-4', '5-8', '9-10', '11-12') THEN requested_grade::grade_group_type
            ELSE '5-8'::grade_group_type
        END,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🧑‍🎓')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        grade_group = EXCLUDED.grade_group,
        avatar_url = EXCLUDED.avatar_url;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Public can update profiles" ON profiles;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert their own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can update their own streak" ON user_streaks;
DROP POLICY IF EXISTS "Public can read streaks" ON user_streaks;
DROP POLICY IF EXISTS "Public can insert streaks" ON user_streaks;
DROP POLICY IF EXISTS "Public can update streaks" ON user_streaks;

CREATE POLICY "Users can view their own streak"
  ON user_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
  ON user_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
  ON user_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT 'Supabase Auth + profiles wiring updated successfully.' AS status;
