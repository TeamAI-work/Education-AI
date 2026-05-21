import { supabase } from './supabaseClient';

/**
 * Log a completed activity to the activity_logs table.
 */
export async function logActivity(userId, activityType, score = null, metadata = null) {
  if (!userId) return { error: 'No user ID' };
  const payload = {
    user_id: userId,
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
 * Update the user's daily streak.
 */
export async function updateStreak(userId) {
  if (!userId) return;
  const today = new Date().toLocaleDateString('sv-SE');

  // 1. Fetch current streak state from Supabase to have the ultimate source of truth
  let existing = null;
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data && !error) {
      existing = data;
    }
  } catch (err) {
    console.warn('updateStreak Supabase fetch failed, falling back to local calculation:', err);
  }

  // 2. Load from localStorage
  let localStreak = { current_streak: 0, longest_streak: 0, last_active_date: null, active_dates: [] };
  try {
    const cached = localStorage.getItem('edu_ai_streak');
    if (cached) localStreak = JSON.parse(cached);
  } catch (e) {
    console.error('Error loading local streak:', e);
  }

  // 3. Resolve the single source of truth between DB and local cache
  let currentStreakVal = localStreak.current_streak || 0;
  let longestStreakVal = localStreak.longest_streak || 0;
  let lastActiveDateVal = localStreak.last_active_date;
  let activeDatesVal = localStreak.active_dates || [];

  if (existing) {
    const dbDate = existing.last_active_date;
    const localDate = lastActiveDateVal;

    // If DB is newer or we don't have a local date, trust DB
    if (!localDate || (dbDate && dbDate > localDate)) {
      currentStreakVal = existing.current_streak || 0;
      longestStreakVal = existing.longest_streak || 0;
      lastActiveDateVal = existing.last_active_date;
      activeDatesVal = existing.active_dates || [];
    } else if (dbDate === localDate) {
      // If dates match, take max of current/longest streaks and merge active_dates
      currentStreakVal = Math.max(currentStreakVal, existing.current_streak || 0);
      longestStreakVal = Math.max(longestStreakVal, existing.longest_streak || 0);
      
      const mergedDates = new Set([...activeDatesVal, ...(existing.active_dates || [])]);
      activeDatesVal = Array.from(mergedDates);
    } else {
      // Local is newer (offline mode scenario)
      // Merge active dates from DB anyway
      const mergedDates = new Set([...activeDatesVal, ...(existing.active_dates || [])]);
      activeDatesVal = Array.from(mergedDates);
    }
  }

  // 4. If already active today, no need to increment, but we might want to ensure database and localStorage are synced
  if (lastActiveDateVal === today) {
    const syncedStreak = {
      user_id: userId,
      current_streak: currentStreakVal,
      longest_streak: longestStreakVal,
      last_active_date: today,
      active_dates: activeDatesVal,
      updated_at: new Date().toISOString(),
    };
    
    localStorage.setItem('edu_ai_streak', JSON.stringify(syncedStreak));

    if (existing) {
      const dbDatesSet = new Set(existing.active_dates || []);
      const hasNewDates = activeDatesVal.some(d => !dbDatesSet.has(d));
      
      if (hasNewDates || existing.current_streak !== currentStreakVal || existing.longest_streak !== longestStreakVal) {
        try {
          await supabase
            .from('user_streaks')
            .update({
              current_streak: currentStreakVal,
              longest_streak: longestStreakVal,
              last_active_date: today,
              active_dates: activeDatesVal,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        } catch (err) {
          console.warn('Sync existing streak failed:', err);
        }
      }
    } else {
      try {
        await supabase.from('user_streaks').insert(syncedStreak);
      } catch (err) {
        console.warn('Insert missing streak failed:', err);
      }
    }
    return;
  }

  // 5. Calculate new streak values (since last active date is not today)
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');
  const isConsecutive = lastActiveDateVal === yesterday;
  
  const newStreak = isConsecutive ? currentStreakVal + 1 : 1;
  const newLongest = Math.max(longestStreakVal, newStreak);
  
  // Append today to active dates
  if (!activeDatesVal.includes(today)) {
    activeDatesVal.push(today);
  }
  
  // Keep active dates sorted
  activeDatesVal.sort();

  const updatedStreak = {
    user_id: userId,
    current_streak: newStreak,
    longest_streak: newLongest,
    last_active_date: today,
    active_dates: activeDatesVal,
    updated_at: new Date().toISOString(),
  };

  // Save to LocalStorage
  localStorage.setItem('edu_ai_streak', JSON.stringify(updatedStreak));

  // Save to Supabase
  try {
    if (!existing) {
      await supabase.from('user_streaks').insert(updatedStreak);
    } else {
      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_active_date: today,
          active_dates: activeDatesVal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }
  } catch (err) {
    console.warn('updateStreak Supabase save failed, using local storage baseline:', err);
  }
}

/**
 * Fetch the user's current streak data.
 */
export async function getStreak(userId) {
  if (!userId) return null;

  let localStreak = { current_streak: 0, longest_streak: 0, last_active_date: null, active_dates: [] };
  try {
    const cached = localStorage.getItem('edu_ai_streak');
    if (cached) localStreak = JSON.parse(cached);
  } catch (e) {
    console.error('Error parsing local streak:', e);
  }

  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      // Merge local and remote
      const localDate = localStreak.last_active_date;
      const dbDate = data.last_active_date;
      
      let mergedStreak = { ...data };
      if (localDate && dbDate && localDate > dbDate) {
        mergedStreak = localStreak;
      } else if (localDate === dbDate) {
        mergedStreak.current_streak = Math.max(localStreak.current_streak || 0, data.current_streak || 0);
        mergedStreak.longest_streak = Math.max(localStreak.longest_streak || 0, data.longest_streak || 0);
        const mergedDates = new Set([...(localStreak.active_dates || []), ...(data.active_dates || [])]);
        mergedStreak.active_dates = Array.from(mergedDates).sort();
      } else {
        const mergedDates = new Set([...(localStreak.active_dates || []), ...(data.active_dates || [])]);
        mergedStreak.active_dates = Array.from(mergedDates).sort();
      }

      localStorage.setItem('edu_ai_streak', JSON.stringify(mergedStreak));
      return mergedStreak;
    }
  } catch (err) {
    console.warn('getStreak Supabase load failed, using local fallback:', err);
  }

  return localStreak;
}

/**
 * Fetch activity stats for a user.
 */
export async function getActivityStats(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from('activity_logs')
    .select('activity_type, score, metadata, completed_at')
    .eq('user_id', userId);

  if (!data) return null;

  const alphabetLogs = data.filter((a) => a.activity_type === 'alphabet_tracing');
  const mathLogs     = data.filter((a) => a.activity_type === 'living_math');
  const scores       = data.filter((a) => a.score !== null).map((a) => a.score);
  const bestScore    = scores.length > 0 ? Math.max(...scores) : 0;

  return {
    totalActivities: data.length,
    bestScore,
    alphabetCount: alphabetLogs.length,
    mathCount: mathLogs.length,
  };
}



/**
 * Get or create a student profile.
 */
export async function getOrCreateProfile({ name, avatar, gradeGroup = '1-4', password = null }) {
  let userId = localStorage.getItem('edu_ai_user_id');

  if (userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) return data;
  }

  const email       = `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.ai`;
  const safePassword = password || 'default-secure-pass-123';

  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: safePassword });
  if (authError) {
    console.error('Auth User creation error:', authError.message);
    throw new Error(`Auth Error: ${authError.message}`);
  }

  userId = authData.user.id;

  const insertPayload = {
    id: userId,
    full_name: name.trim(),
    grade_group: gradeGroup,
    avatar_url: avatar || '🧒',
    created_at: new Date().toISOString(),
  };
  if (password) insertPayload.password = password;

  let { data: profile, error } = await supabase.from('profiles').insert(insertPayload).select().single();

  if (error && error.message && (error.message.includes('password') || error.code === 'PGRST204')) {
    console.warn("Falling back to password-less profile creation.");
    delete insertPayload.password;
    const fallbackRes = await supabase.from('profiles').insert(insertPayload).select().single();
    profile = fallbackRes.data;
    error   = fallbackRes.error;
  }

  if (error) {
    console.error('Profile insert error:', error.message);
    throw new Error(error.message);
  }

  await supabase.from('user_streaks').insert({
    user_id: userId,
    current_streak: 1,
    longest_streak: 1,
    last_active_date: new Date().toLocaleDateString('sv-SE'),
    active_dates: [new Date().toLocaleDateString('sv-SE')],
  });

  localStorage.setItem('edu_ai_user_id', userId);
  localStorage.setItem('edu_ai_profile', JSON.stringify(profile));
  return profile;
}

export { fetchBadges, fetchUserBadges, checkForNewBadges } from './Badges';
