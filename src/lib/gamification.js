import { supabase } from './supabaseClient';
import { fetchProfileByUserId } from './auth';

// ─── ID Helpers ────────────────────────────────────────────────────────────
//
// Two separate IDs exist in this schema:
//
//   authUserId  = auth.users.id  → stored in localStorage 'edu_ai_user_id'
//                 Used to identify the Supabase auth session.
//
//   profileId   = profiles.id (auto-generated UUID)
//                 FK target for: user_streaks.user_id, activity_logs.user_id
//                 Stored in the 'edu_ai_profile' JSON under the key 'id'.
//
// Always use profileId when querying user_streaks or activity_logs.
// ───────────────────────────────────────────────────────────────────────────

/** Returns the auto-generated profiles.id from the cached profile JSON. Synchronous — use resolveProfileId() on mount paths. */
export function getProfileId() {
  try {
    const raw = localStorage.getItem('edu_ai_profile');
    return raw ? JSON.parse(raw)?.id ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Async, self-healing version of getProfileId().
 *
 * Use this on every page/component mount where you are about to write to
 * user_streaks or activity_logs (which FK → profiles.id), to prevent
 * 409 Conflict errors caused by a stale localStorage cache.
 *
 * Strategy:
 *  1. Fast-path  — if cached id ≠ auth user ID, cache is already healed.
 *  2. Slow-path  — query the DB for the real profiles.id, overwrite cache.
 *  3. Fallback   — if DB is unreachable, return whatever is in cache.
 *
 * @returns {Promise<string|null>} profiles.id (auto-UUID) or null
 */
export async function resolveProfileId() {
  const authUserId = localStorage.getItem('edu_ai_user_id');
  if (!authUserId) return null;

  // Fast-path — cached id already differs from auth id (cache is healed)
  try {
    const raw = localStorage.getItem('edu_ai_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed.id !== authUserId) {
        return parsed.id;
      }
    }
  } catch { /* ignore parse errors */ }

  // Slow-path — fetch fresh profile row from the database
  try {
    const dbProfile = await fetchProfileByUserId(authUserId);
    if (dbProfile?.id) {
      localStorage.setItem('edu_ai_profile', JSON.stringify(dbProfile));
      return dbProfile.id;
    }
  } catch (err) {
    console.warn('[resolveProfileId] DB fetch failed, falling back to cache:', err?.message);
  }

  // Last-resort fallback
  return getProfileId();
}

/**
 * Log a completed activity to activity_logs.
 * @param {string} profileId  — profiles.id (auto-UUID), NOT auth user ID
 */
export async function logActivity(profileId, activityType, score = null, metadata = null) {
  if (!profileId) return { error: 'No profile ID' };
  const payload = {
    user_id: profileId,          // FK → profiles.id
    activity_type: activityType,
    score,
    completed_at: new Date().toISOString(),
  };
  if (metadata) payload.metadata = metadata;
  const { data, error } = await supabase.from('activity_logs').insert(payload);
  if (error) console.warn('logActivity error:', error.message);
  return { data, error };
}

/**
 * Update (or initialise) the user's daily streak in Supabase + localStorage.
 * @param {string} profileId  — profiles.id (auto-UUID), NOT auth user ID
 */
export async function updateStreak(profileId) {
  if (!profileId) return;
  const today = new Date().toLocaleDateString('sv-SE');

  // 1. Fetch current row from Supabase (source of truth)
  let existing = null;
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', profileId)   // FK → profiles.id
      .maybeSingle();
    if (data && !error) existing = data;
  } catch (err) {
    console.warn('updateStreak: Supabase fetch failed, will use local cache:', err.message);
  }

  // 2. Load local cache
  let local = { current_streak: 0, longest_streak: 0, last_active_date: null, active_dates: [] };
  try {
    const cached = localStorage.getItem('edu_ai_streak');
    if (cached) local = JSON.parse(cached);
  } catch { /* ignore parse errors */ }

  // 3. Resolve the authoritative values (DB wins unless local is newer)
  let currentStreak = local.current_streak  || 0;
  let longestStreak = local.longest_streak  || 0;
  let lastDate      = local.last_active_date || null;
  let activeDates   = Array.isArray(local.active_dates) ? [...local.active_dates] : [];

  if (existing) {
    const dbDate = existing.last_active_date;
    if (!lastDate || (dbDate && dbDate > lastDate)) {
      // DB is more recent — trust it fully
      currentStreak = existing.current_streak || 0;
      longestStreak = existing.longest_streak || 0;
      lastDate      = dbDate;
      activeDates   = Array.isArray(existing.active_dates) ? [...existing.active_dates] : [];
    } else if (dbDate === lastDate) {
      // Same day — take the higher values and merge dates
      currentStreak = Math.max(currentStreak, existing.current_streak || 0);
      longestStreak = Math.max(longestStreak, existing.longest_streak || 0);
      activeDates   = Array.from(new Set([...activeDates, ...(existing.active_dates || [])]));
    } else {
      // Local is newer (offline writes) — merge DB dates in case they have older entries
      activeDates = Array.from(new Set([...activeDates, ...(existing.active_dates || [])]));
    }
  }

  activeDates.sort();

  // 4. Already active today → just sync without incrementing
  if (lastDate === today) {
    const synced = {
      user_id:          profileId,
      current_streak:   currentStreak,
      longest_streak:   longestStreak,
      last_active_date: today,
      active_dates:     activeDates,
      updated_at:       new Date().toISOString(),
    };
    localStorage.setItem('edu_ai_streak', JSON.stringify(synced));

    // Push to DB only if something actually changed
    if (existing) {
      const dbDates    = new Set(existing.active_dates || []);
      const hasNewDates = activeDates.some(d => !dbDates.has(d));
      const changed     = hasNewDates
        || existing.current_streak !== currentStreak
        || existing.longest_streak !== longestStreak;

      if (changed) {
        await supabase
          .from('user_streaks')
          .update({
            current_streak:   currentStreak,
            longest_streak:   longestStreak,
            last_active_date: today,
            active_dates:     activeDates,
            updated_at:       new Date().toISOString(),
          })
          .eq('user_id', profileId);
      }
    } else {
      // Row doesn't exist yet — create it
      await supabase.from('user_streaks').insert(synced).then(({ error }) => {
        if (error) console.warn('updateStreak insert (today-sync) failed:', error.message);
      });
    }
    return;
  }

  // 5. New day — calculate new streak
  const yesterday    = new Date(Date.now() - 86_400_000).toLocaleDateString('sv-SE');
  const consecutive  = lastDate === yesterday;
  const newStreak    = consecutive ? currentStreak + 1 : 1;
  const newLongest   = Math.max(longestStreak, newStreak);

  if (!activeDates.includes(today)) activeDates.push(today);
  activeDates.sort();

  const updated = {
    user_id:          profileId,
    current_streak:   newStreak,
    longest_streak:   newLongest,
    last_active_date: today,
    active_dates:     activeDates,
    updated_at:       new Date().toISOString(),
  };

  // Save locally first (offline resilience)
  localStorage.setItem('edu_ai_streak', JSON.stringify(updated));

  // Persist to Supabase
  try {
    if (!existing) {
      const { error } = await supabase.from('user_streaks').insert(updated);
      if (error) console.warn('updateStreak insert failed:', error.message);
    } else {
      const { error } = await supabase
        .from('user_streaks')
        .update({
          current_streak:   newStreak,
          longest_streak:   newLongest,
          last_active_date: today,
          active_dates:     activeDates,
          updated_at:       new Date().toISOString(),
        })
        .eq('user_id', profileId);
      if (error) console.warn('updateStreak update failed:', error.message);
    }
  } catch (err) {
    console.warn('updateStreak: Supabase save failed, local cache is the fallback:', err.message);
  }
}

/**
 * Fetch the user's current streak, merging Supabase + localStorage.
 * @param {string} profileId  — profiles.id (auto-UUID), NOT auth user ID
 */
export async function getStreak(profileId) {
  if (!profileId) return null;

  // Load local cache first so we always have a fallback
  let local = { current_streak: 0, longest_streak: 0, last_active_date: null, active_dates: [] };
  try {
    const cached = localStorage.getItem('edu_ai_streak');
    if (cached) local = JSON.parse(cached);
  } catch { /* ignore */ }

  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', profileId)  // FK → profiles.id
      .maybeSingle();

    if (data && !error) {
      const localDate = local.last_active_date;
      const dbDate    = data.last_active_date;

      let merged = { ...data };

      if (localDate && dbDate && localDate > dbDate) {
        // Local is more recent
        merged = { ...local };
      } else if (localDate === dbDate) {
        merged.current_streak = Math.max(local.current_streak || 0, data.current_streak || 0);
        merged.longest_streak = Math.max(local.longest_streak || 0, data.longest_streak || 0);
        merged.active_dates   = Array.from(
          new Set([...(local.active_dates || []), ...(data.active_dates || [])])
        ).sort();
      } else {
        // DB is more recent — merge active_dates from local in case of offline writes
        merged.active_dates = Array.from(
          new Set([...(local.active_dates || []), ...(data.active_dates || [])])
        ).sort();
      }

      localStorage.setItem('edu_ai_streak', JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('getStreak: Supabase load failed, using local fallback:', err.message);
  }

  return local;
}

/**
 * Fetch summarised activity stats for a user.
 * @param {string} profileId  — profiles.id (auto-UUID), NOT auth user ID
 */
export async function getActivityStats(profileId) {
  if (!profileId) return null;
  const { data, error } = await supabase
    .from('activity_logs')
    .select('activity_type, score, metadata, completed_at')
    .eq('user_id', profileId);   // FK → profiles.id

  if (error) {
    console.warn('getActivityStats error:', error.message);
    return null;
  }
  if (!data) return null;

  const alphabetLogs = data.filter(a => a.activity_type === 'alphabet_tracing');
  const mathLogs     = data.filter(a => a.activity_type === 'living_math');
  const scores       = data.filter(a => a.score !== null).map(a => a.score);
  const bestScore    = scores.length > 0 ? Math.max(...scores) : 0;

  return {
    totalActivities: data.length,
    bestScore,
    alphabetCount:   alphabetLogs.length,
    mathCount:       mathLogs.length,
  };
}

/**
 * Get or create a student profile (used by Level 1 onboarding).
 * @returns {object} profile row from the profiles table
 */
export async function getOrCreateProfile({ name, avatar, gradeGroup = '1-4', password = null }) {
  const authUserId = localStorage.getItem('edu_ai_user_id');

  if (authUserId) {
    // profiles.user_id = auth user ID
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUserId)
      .maybeSingle();
    if (data) {
      localStorage.setItem('edu_ai_profile', JSON.stringify(data));
      return data;
    }
  }

  const email        = `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.ai`;
  const safePassword = password || 'default-secure-pass-123';

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: safePassword,
    options: { data: { full_name: name.trim(), grade_group: gradeGroup, avatar_url: avatar || '🧒' } },
  });
  if (authError) throw new Error(`Auth Error: ${authError.message}`);

  const newAuthUserId = authData.user.id;

  // user_id = auth user ID; profiles.id is auto-generated by the DB
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { user_id: newAuthUserId, full_name: name.trim(), grade_group: gradeGroup, avatar_url: avatar || '🧒' },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (profileError) throw new Error(profileError.message);

  // Initialise streak using profiles.id (auto-UUID)
  await supabase.from('user_streaks').upsert(
    {
      user_id:          profile.id,
      current_streak:   1,
      longest_streak:   1,
      last_active_date: new Date().toLocaleDateString('sv-SE'),
      active_dates:     [new Date().toLocaleDateString('sv-SE')],
      updated_at:       new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  localStorage.setItem('edu_ai_user_id', newAuthUserId);        // auth user ID
  localStorage.setItem('edu_ai_profile', JSON.stringify(profile));
  localStorage.setItem('edu_ai_streak', JSON.stringify({
    user_id:          profile.id,
    current_streak:   1,
    longest_streak:   1,
    last_active_date: new Date().toLocaleDateString('sv-SE'),
    active_dates:     [new Date().toLocaleDateString('sv-SE')],
  }));

  return profile;
}

export { fetchBadges, fetchUserBadges, checkForNewBadges } from './Badges';
