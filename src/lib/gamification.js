import { supabase } from './supabaseClient';

/**
 * Log a completed activity to the activity_logs table.
 * @param {string} userId
 * @param {string} activityType
 * @param {number|null} score
 * @param {object|null} metadata - optional context e.g. { letter: 'A' } or { subject: 'photosynthesis' }
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
    .select('activity_type, score, metadata, completed_at')
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns true if the sorted list of ISO-date strings contains N or more consecutive dates.
 */
function hasNConsecutiveDates(dates, n) {
  if (!dates || dates.length < n) return false;
  const sorted = [...new Set(dates)].sort();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      streak++;
      if (streak >= n) return true;
    } else {
      streak = 1;
    }
  }
  return streak >= n;
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

/**
 * Fetch all available master badges for a specific grade group.
 */
export async function fetchBadges(gradeGroup) {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('grade_group', gradeGroup)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('fetchBadges error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Fetch all unlocked badges for a specific user.
 */
export async function fetchUserBadges(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', userId);
    
  if (error) {
    console.error('fetchUserBadges error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Check if the user has met any new badge unlock conditions,
 * inserts them into user_badges, and returns newly unlocked badge items.
 * Supports all 12 badges for Grades 1-4 and all 12 for Grades 5-8.
 */
export async function checkForNewBadges(userId, gradeGroup) {
  if (!userId) return { newlyUnlocked: [] };

  try {
    // 1. Fetch available badges & user's unlocked badges in parallel
    const [allBadges, unlocked] = await Promise.all([
      fetchBadges(gradeGroup),
      fetchUserBadges(userId)
    ]);

    const unlockedSet = new Set(unlocked.map((ub) => ub.badge_id || ub.badge?.id));

    // 2. Fetch streak
    const streak = await getStreak(userId);
    const currentStreak = streak?.current_streak || 0;

    // 3. Fetch all activity logs (with metadata)
    const { data: logs, error: logsErr } = await supabase
      .from('activity_logs')
      .select('activity_type, score, metadata, completed_at')
      .eq('user_id', userId);
    if (logsErr) throw logsErr;
    const logList = logs || [];

    // 4. Fetch notebook notes
    const { data: noteRows, error: notesErr } = await supabase
      .from('notebook_notes')
      .select('created_at')
      .eq('user_id', userId);
    if (notesErr) throw notesErr;
    const noteTotal = (noteRows || []).length;
    const noteDates = (noteRows || []).map((n) => n.created_at.slice(0, 10));

    // ── Grade 1-4 derived stats ────────────────────────────────────────────
    const traceLogs = logList.filter((l) => l.activity_type === 'alphabet_tracing');
    const mathLogs  = logList.filter((l) => l.activity_type === 'living_math');
    const showLogs  = logList.filter((l) => l.activity_type === 'show_and_tell');

    const highAccuracyTraceCount = traceLogs.filter((l) => (l.score || 0) >= 85).length;
    const perfectMathCount       = mathLogs.filter((l) => l.score === 100).length;
    const showTellCount          = showLogs.length;
    const bestScore              = logList.filter((l) => l.score != null).reduce((mx, l) => Math.max(mx, l.score), 0);

    // Distinct activity types present (for Activity Mixer / Perfect Day)
    const PLAY_TYPES = ['alphabet_tracing', 'living_math', 'show_and_tell'];
    const coveredTypes = new Set(logList.map((l) => l.activity_type).filter((t) => PLAY_TYPES.includes(t)));

    // Distinct letters from metadata (for Alphabet Half / Master / Star Performer)
    const distinctLetters     = new Set(traceLogs.filter((l) => l.metadata?.letter).map((l) => l.metadata.letter.toUpperCase()));
    const distinctAbove90     = new Set(traceLogs.filter((l) => (l.score || 0) >= 90 && l.metadata?.letter).map((l) => l.metadata.letter.toUpperCase()));
    // Fallback for users who traced before metadata was added
    const distinctLettersCount    = distinctLetters.size || traceLogs.length;
    const distinctAbove90Count    = distinctAbove90.size;

    // Today's activity types (Perfect Day badge)
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs  = logList.filter((l) => (l.completed_at || '').slice(0, 10) === today);
    const todayTypes = new Set(todayLogs.map((l) => l.activity_type).filter((t) => PLAY_TYPES.includes(t)));

    // ── Grade 5-8 derived stats ────────────────────────────────────────────
    const queryLogs   = logList.filter((l) => l.activity_type === 'rag_query');
    const queryCount  = queryLogs.length;
    const noteEditCount = logList.filter((l) => l.activity_type === 'note_edit').length;

    // Distinct subjects from RAG query metadata
    const distinctSubjects = new Set(
      queryLogs.filter((l) => l.metadata?.subject).map((l) => l.metadata.subject)
    );

    // Today's query / note counts (Habit Pioneer)
    const todayQueryCount = queryLogs.filter((l) => (l.completed_at || '').slice(0, 10) === today).length;
    const todayNoteCount  = noteDates.filter((d) => d === today).length;

    // Iron Scholar: dates with both a query and a note
    const queryDates      = queryLogs.map((l) => (l.completed_at || '').slice(0, 10));
    const queryDateSet    = new Set(queryDates);
    const noteDateSet     = new Set(noteDates);
    const dualHabitDates  = [...queryDateSet].filter((d) => noteDateSet.has(d));
    const hasIronScholar  = hasNConsecutiveDates(dualHabitDates, 7);

    // ── Evaluate each locked badge ────────────────────────────────────────
    const newlyUnlocked = [];

    for (const badge of allBadges) {
      if (unlockedSet.has(badge.id)) continue;

      const id = badge.id.toLowerCase();
      let isEligible = false;

      if (gradeGroup === '1-4') {
        // ── Common ──
        if      (id === '14100000-0000-0000-0000-000000000001') isEligible = logList.length >= 1;          // Aura Beginner
        else if (id === '14100000-0000-0000-0000-000000000002') isEligible = traceLogs.length >= 1;        // First Tracer
        else if (id === '14100000-0000-0000-0000-000000000003') isEligible = mathLogs.length >= 1;         // Math Explorer
        else if (id === '14100000-0000-0000-0000-000000000004') isEligible = showTellCount >= 1;           // Snapshot Taker
        // ── Rare ──
        else if (id === '14200000-0000-0000-0000-000000000001') isEligible = highAccuracyTraceCount >= 5;  // Tiny Tracer
        else if (id === '14200000-0000-0000-0000-000000000002') isEligible = perfectMathCount >= 3;        // Living Math Pioneer
        else if (id === '14200000-0000-0000-0000-000000000003') isEligible = coveredTypes.size >= 3;       // Activity Mixer
        else if (id === '14200000-0000-0000-0000-000000000004') isEligible = bestScore >= 90;             // Score Chaser
        else if (id === '14200000-0000-0000-0000-000000000005') isEligible = distinctLettersCount >= 13;  // Alphabet Half
        // ── Legendary ──
        else if (id === '14300000-0000-0000-0000-000000000001') isEligible = distinctAbove90Count >= 26;   // Alphabet Master
        else if (id === '14300000-0000-0000-0000-000000000002') isEligible = todayTypes.size >= 3;         // Perfect Day
        else if (id === '14300000-0000-0000-0000-000000000003') isEligible = distinctAbove90Count >= 5;    // Star Performer

      } else if (gradeGroup === '5-8') {
        // ── Common ──
        if      (id === '58100000-0000-0000-0000-000000000001') isEligible = logList.length >= 1;          // Aura Beginner
        else if (id === '58100000-0000-0000-0000-000000000002') isEligible = queryCount >= 1;             // First Query
        else if (id === '58100000-0000-0000-0000-000000000003') isEligible = noteTotal >= 1;              // First Note
        else if (id === '58100000-0000-0000-0000-000000000004') isEligible = currentStreak >= 2;          // Daily Visitor
        // ── Rare ──
        else if (id === '58200000-0000-0000-0000-000000000001') isEligible = currentStreak >= 5;          // Consistency Star
        else if (id === '58200000-0000-0000-0000-000000000002') isEligible = queryCount >= 10;            // AI Inquirer
        else if (id === '58200000-0000-0000-0000-000000000003') isEligible = noteTotal >= 5;              // Active Annotator
        else if (id === '58200000-0000-0000-0000-000000000004') isEligible = distinctSubjects.size >= 3;  // Subject Explorer
        else if (id === '58200000-0000-0000-0000-000000000005') isEligible = todayQueryCount >= 1 && todayNoteCount >= 1; // Habit Pioneer
        // ── Legendary ──
        else if (id === '58300000-0000-0000-0000-000000000001') isEligible = noteEditCount >= 3;          // Editor Pro
        else if (id === '58300000-0000-0000-0000-000000000002') isEligible = queryCount >= 20 && noteTotal >= 10; // Study Architect
        else if (id === '58300000-0000-0000-0000-000000000003') isEligible = hasIronScholar;              // Iron Scholar
      }

      if (isEligible) {
        const { error: insertErr } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            unlocked_at: new Date().toISOString()
          });

        if (!insertErr) {
          newlyUnlocked.push(badge);
          try { window.dispatchEvent(new Event('edu_ai_badge_unlocked')); } catch (_) {}
        } else {
          console.error('Error inserting user badge:', insertErr.message);
        }
      }
    }

    return { newlyUnlocked };
  } catch (err) {
    console.error('checkForNewBadges error:', err);
    return { newlyUnlocked: [] };
  }
}

