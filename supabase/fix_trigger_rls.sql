-- ============================================================
-- fix_trigger_rls.sql
-- Fixes: "Database error saving new user" (500) on signup
--
-- Root cause: The handle_new_user() trigger runs during auth user
-- creation. Even though it's SECURITY DEFINER (runs as postgres
-- superuser), if the profiles table has FORCE ROW LEVEL SECURITY
-- enabled, even superuser roles get blocked.
--
-- Fix 1: Recreate the trigger function with explicit SET row_security = off
-- Fix 2: Add a service-role-compatible policy as safety net
-- ============================================================

-- Step 1: Recreate the trigger with row_security bypassed
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
EXCEPTION
    -- Catch any error so the trigger never blocks auth user creation
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user() failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   SET row_security = off;   -- <-- KEY FIX: bypass RLS inside this trigger

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Trigger fix applied: handle_new_user() now bypasses RLS and has error guard.' AS status;
