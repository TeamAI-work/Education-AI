import { supabase } from './supabaseClient';

/**
 * Log a completed activity to the activity_logs table.
 */
export async function logActivity(userId, activityType, score = null) {
  if (!userId) return { error: 'No user ID' };
  const { data, error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    activity_type: activityType,
    score,
    completed_at: new Date().toISOString(),
  });
  if (error) console.warn('logActivity error:', error.message);
  return { data, error };
}

/**
 * Update the user's daily streak.
 */
export async function updateStreak(userId) {
  if (!userId) return;
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
    });
    return;
  }

  if (existing.last_active_date === today) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isConsecutive = existing.last_active_date === yesterday;
  const newStreak = isConsecutive ? existing.current_streak + 1 : 1;
  const newLongest = Math.max(existing.longest_streak, newStreak);

  await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/**
 * Fetch the user's current streak data.
 */
export async function getStreak(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

/**
 * Fetch activity stats for a user.
 */
export async function getActivityStats(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId);

  if (!data) return null;

  const alphabetLogs = data.filter((a) => a.activity_type === 'alphabet_tracing');
  const mathLogs = data.filter((a) => a.activity_type === 'living_math');
  const scores = data.filter((a) => a.score !== null).map((a) => a.score);
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  return {
    totalActivities: data.length,
    bestScore,
    alphabetCount: alphabetLogs.length,
    mathCount: mathLogs.length,
  };
}

/**
 * Generate a simple UUID v4.
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create a student profile using localStorage (no Supabase Auth required).
 * Directly inserts into the profiles table using a self-generated UUID.
 */
export async function getOrCreateProfile({ name, avatar, gradeGroup = '1-4' }) {
  // Check for existing profile stored locally
  let userId = localStorage.getItem('edu_ai_user_id');

  if (userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) return data;
  }

  // Generate a new UUID for this student
  userId = uuidv4();

  // Insert profile (requires public insert policy - see schema_patch.sql)
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: name,
      grade_group: gradeGroup,
      avatar_url: avatar || '🧒',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Profile insert error:', error.message);
    // Return a local-only profile as fallback so the app still works
    const fallback = { id: userId, full_name: name, grade_group: gradeGroup, avatar_url: avatar || '🧒' };
    localStorage.setItem('edu_ai_user_id', userId);
    localStorage.setItem('edu_ai_profile', JSON.stringify(fallback));
    return fallback;
  }

  // Initialize streak row
  await supabase.from('user_streaks').insert({
    user_id: userId,
    current_streak: 1,
    longest_streak: 1,
    last_active_date: new Date().toISOString().slice(0, 10),
  });

  localStorage.setItem('edu_ai_user_id', userId);
  localStorage.setItem('edu_ai_profile', JSON.stringify(profile));
  return profile;
}
