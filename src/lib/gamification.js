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

  // 1. Get current local state
  let localStreak = { current_streak: 0, longest_streak: 0, last_active_date: null };
  try {
    const cached = localStorage.getItem('edu_ai_streak');
    if (cached) {
      localStreak = JSON.parse(cached);
    }
  } catch (e) {
    console.error('Error loading local streak:', e);
  }

  // If already active today, do nothing
  if (localStreak.last_active_date === today) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isConsecutive = localStreak.last_active_date === yesterday;
  const newStreak = isConsecutive ? (localStreak.current_streak || 0) + 1 : 1;
  const newLongest = Math.max(localStreak.longest_streak || 0, newStreak);

  const updatedStreak = {
    user_id: userId,
    current_streak: newStreak,
    longest_streak: newLongest,
    last_active_date: today,
    updated_at: new Date().toISOString()
  };

  // 2. Write to local storage immediately
  localStorage.setItem('edu_ai_streak', JSON.stringify(updatedStreak));

  // 3. Sync to Supabase
  try {
    const { data: existing } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      await supabase.from('user_streaks').insert(updatedStreak);
    } else {
      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_active_date: today,
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

  // 1. Load local streak as baseline
  let localStreak = { current_streak: 0, longest_streak: 0, last_active_date: null };
  try {
    const cached = localStorage.getItem('edu_ai_streak');
    if (cached) {
      localStreak = JSON.parse(cached);
    }
  } catch (e) {
    console.error('Error parsing local streak:', e);
  }

  // 2. Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (data && !error) {
      // Sync local storage with latest remote data if remote is higher or newer
      if (data.current_streak > localStreak.current_streak || data.last_active_date !== localStreak.last_active_date) {
        localStreak = data;
        localStorage.setItem('edu_ai_streak', JSON.stringify(data));
      }
      return data;
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
export async function getOrCreateProfile({ name, avatar, gradeGroup = '1-4', password = null }) {
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

  // 1. Standardize a system email for the student to use Supabase Auth securely
  const email = `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.ai`;
  const safePassword = password || 'default-secure-pass-123'; // Fallback for level 1 quick-starts

  // 2. Register in Supabase auth.users DB
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: safePassword,
  });

  if (authError) {
    console.error('Auth User creation error:', authError.message);
    throw new Error(`Auth Error: ${authError.message}`);
  }

  // Use the UUID provided natively by Supabase Auth!
  userId = authData.user.id;

  // 3. Prepare custom profile payload for the "profiles" table
  const insertPayload = {
    id: userId,
    full_name: name.trim(),
    grade_group: gradeGroup,
    avatar_url: avatar || '🧒',
    created_at: new Date().toISOString(),
  };

  if (password) {
    insertPayload.password = password;
  }

  // 4. Perform insert into profiles
  let { data: profile, error } = await supabase
    .from('profiles')
    .insert(insertPayload)
    .select()
    .single();

  // Handle fallback if the 'password' column doesn't exist yet
  if (error && error.message && (error.message.includes('password') || error.code === 'PGRST204')) {
    console.warn("Supabase relation 'profiles' does not have 'password' column. Falling back to password-less profile creation.");
    delete insertPayload.password;
    const fallbackRes = await supabase
      .from('profiles')
      .insert(insertPayload)
      .select()
      .single();
    profile = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    console.error('Profile insert error:', error.message);
    throw new Error(error.message);
  }

  // Initialize streak row
  await supabase.from('user_streaks').insert({
    user_id: userId,
    current_streak: 1,
    longest_streak: 1,
    last_active_date: new Date().toISOString().slice(0, 10),
    active_dates: [new Date().toISOString().slice(0, 10)]
  });

  localStorage.setItem('edu_ai_user_id', userId);
  localStorage.setItem('edu_ai_profile', JSON.stringify(profile));
  return profile;
}
