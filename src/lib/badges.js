import { supabase } from './supabaseClient';

// ─── Daily Tasks Override Metadata ──────────────────────────────────────────
const BADGE_OVERRIDES = {
  // Grade 1-4 Daily Tasks
  '14100000-0000-0000-0000-000000000001': { title: 'Explorer Spark', description: 'Complete any 1 fun activity today!' },
  '14100000-0000-0000-0000-000000000002': { title: 'Daily Tracer', description: 'Practice tracing at least 1 letter today!' },
  '14100000-0000-0000-0000-000000000003': { title: 'Daily Counter', description: 'Play the Living Math counting game once today!' },
  '14100000-0000-0000-0000-000000000004': { title: 'Daily Creator', description: 'Share 1 photo or discovery in Show & Tell today!' },
  '14200000-0000-0000-0000-000000000001': { title: 'Trace Master', description: 'Complete 2 tracing sessions today!' },
  '14200000-0000-0000-0000-000000000002': { title: 'Math Perfect', description: 'Get a perfect 100% score in Living Math today!' },
  '14200000-0000-0000-0000-000000000003': { title: 'Task Explorer Duo', description: 'Play at least 2 different games today!' },
  '14200000-0000-0000-0000-000000000004': { title: 'Score Star', description: 'Earn a high score of 90% or higher today!' },
  '14200000-0000-0000-0000-000000000005': { title: 'Alphabet Run', description: 'Trace at least 3 different letters today!' },
  '14300000-0000-0000-0000-000000000001': { title: 'Super Active', description: 'Complete a total of 5 daily activities today!' },
  '14300000-0000-0000-0000-000000000002': { title: 'Perfect Explorer Day', description: 'Complete Tracing, Math, AND Show & Tell today!' },
  '14300000-0000-0000-0000-000000000003': { title: 'Star Tracer', description: 'Complete 3 tracings, each with 90% or higher accuracy today!' },

  // Grade 5-8 Daily Tasks
  '58100000-0000-0000-0000-000000000001': { title: 'Study Spark', description: 'Complete at least 1 notebook edit or AI query today!' },
  '58100000-0000-0000-0000-000000000002': { title: 'AI Inquirer', description: 'Ask the Aura AI Assistant 1 academic question today!' },
  '58100000-0000-0000-0000-000000000003': { title: 'Note Preserver', description: 'Save 1 highlight in your Digital Notebook today!' },
  '58100000-0000-0000-0000-000000000004': { title: 'AI Explorer Duo', description: 'Ask the AI assistant 2 academic questions today!' },
  '58200000-0000-0000-0000-000000000001': { title: 'Active Recorder', description: 'Save 2 highlights in your Digital Notebook today!' },
  '58200000-0000-0000-0000-000000000002': { title: 'Deep Thinker', description: 'Ask the AI Assistant 5 academic questions today!' },
  '58200000-0000-0000-0000-000000000003': { title: 'Highlight Collector', description: 'Save 4 highlights in your Digital Notebook today!' },
  '58200000-0000-0000-0000-000000000004': { title: 'Cross Subject Runner', description: 'Ask the AI about 2 different subjects today!' },
  '58200000-0000-0000-0000-000000000005': { title: 'Daily Habit Routine', description: 'Complete both 1 notebook highlight and 1 AI query today!' },
  '58300000-0000-0000-0000-000000000001': { title: 'Active Editor', description: 'Edit or annotate at least 1 notebook note today!' },
  '58300000-0000-0000-0000-000000000002': { title: 'Daily Super Study', description: 'Ask 5 AI questions AND save 3 highlights today!' },
  '58300000-0000-0000-0000-000000000003': { title: 'Daily Task Master', description: 'Edit a note, ask an AI query, and save a highlight today!' }
};

function overrideBadge(badge) {
  if (!badge) return badge;
  const key = String(badge.id).toLowerCase();
  const override = BADGE_OVERRIDES[key];
  if (override) {
    return {
      ...badge,
      title: override.title,
      description: override.description
    };
  }
  return badge;
}

function overrideUserBadge(row) {
  if (!row) return row;
  if (row.badge) {
    row.badge = overrideBadge(row.badge);
  }
  return row;
}

// ─── Master Badges DB Queries with Intercepted Daily Metadata ────────────────
/**
 * Fetch all available badges for a specific grade group.
 */
export async function fetchAllBadges(gradeGroup) {
  const { data, error } = await supabase
    .from('badges')
    .select('id, title, description, icon_url, grade_group, rarity, created_at')
    .eq('grade_group', gradeGroup)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Badges] fetchAllBadges error:', error.message);
    return [];
  }
  return (data || []).map(overrideBadge);
}

/**
 * Fetch all user_badges rows for a user, including the progress column.
 */
export async function fetchAllUserBadges(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_badges')
    .select('id, user_id, badge_id, unlocked_at, progress, badge:badges(id, title, description, icon_url, rarity)')
    .eq('user_id', userId);

  if (error) {
    console.error('[Badges] fetchAllUserBadges error:', error.message);
    return [];
  }
  return (data || []).map(overrideUserBadge);
}

/**
 * Update badge progress in user_badges table.
 */
export async function updateBadge(badgeId, userId, progress){
    if (!userId) return;
    const { data, error } = await supabase
      .from("user_badges")
      .update({ progress: progress })
      .eq('user_id', userId)
      .eq('badge_id', badgeId);

    if (error) return 0;
    return "success";
}

/**
 * Fetch all available badges (compatible alias).
 */
export async function fetchBadges(gradeGroup) {
  return fetchAllBadges(gradeGroup);
}

/**
 * Fetch all user_badges rows (compatible alias).
 */
export async function fetchUserBadges(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_badges')
    .select('id, user_id, badge_id, unlocked_at, progress, badge:badges(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('[Badges] fetchUserBadges error:', error.message);
    return [];
  }
  return (data || []).map(overrideUserBadge);
}

// ─── Daily Tasks Streak Tracker Helper ───────────────────────────────────────
/**
 * Retrieve consecutive Daily Task completion streaks from local storage.
 * Resolves missed days cleanly on page navigation/load.
 */
export function getTasksStreak() {
  let taskStreak = { current_streak: 0, longest_streak: 0, last_completed_date: null };
  try {
    const cached = localStorage.getItem('edu_ai_tasks_streak');
    if (cached) taskStreak = JSON.parse(cached);
  } catch (e) {
    return taskStreak;
  }

  const today = new Date().toLocaleDateString('sv-SE');
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');

  // If they missed completing their tasks yesterday (and not completed today yet), reset
  if (taskStreak.last_completed_date && 
      taskStreak.last_completed_date !== today && 
      taskStreak.last_completed_date !== yesterday) {
    taskStreak.current_streak = 0;
    localStorage.setItem('edu_ai_tasks_streak', JSON.stringify(taskStreak));
  }

  return taskStreak;
}

// ─── Internal helpers for gamification rules ──────────────────────────────────
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
 * Check badge conditions, perform daily resetting if new day,
 * and update user_badges.progress strictly based on today's activities.
 */
export async function checkForNewBadges(userId, gradeGroup) {
  if (!userId) return { newlyUnlocked: [] };

  try {
    const today = new Date().toLocaleDateString('sv-SE');

    // 1. Fetch user's last active date from user_streaks to check if it's a new day
    let lastActiveDate = null;
    try {
      const { data: streakRow } = await supabase
        .from('user_streaks')
        .select('last_active_date')
        .eq('user_id', userId)
        .single();
      if (streakRow) {
        lastActiveDate = streakRow.last_active_date;
      }
    } catch (err) {
      console.warn('[Badges] Streak fetch failed inside daily tasks engine:', err);
    }

    // 2. Perform daily reset in user_badges if a new day has arrived
    const localResetKey = `edu_ai_last_badge_reset_date_${userId}`;
    const localResetDate = localStorage.getItem(localResetKey);
    const dbNewDay = lastActiveDate && lastActiveDate !== today;
    const localNewDay = !localResetDate || localResetDate !== today;

    if (dbNewDay || localNewDay) {
      try {
        console.log('[Badges] New day detected! Resetting daily task progress in user_badges table...');
        const { error: resetErr } = await supabase
          .from('user_badges')
          .update({ progress: 0, unlocked_at: null })
          .eq('user_id', userId);
        if (resetErr) throw resetErr;
        localStorage.setItem(localResetKey, today);
      } catch (err) {
        console.warn('[Badges] Daily resetting of task progress failed:', err.message);
      }
    }

    // 3. Fetch all master badges + existing user_badges rows
    const [allBadges, existingRows] = await Promise.all([
      fetchBadges(gradeGroup),
      fetchUserBadges(userId),
    ]);

    // Build lookup: badge_id → existing row { id, progress, unlocked_at }
    const existingMap = {};
    for (const row of existingRows) {
      existingMap[row.badge_id] = row;
    }

    // 4. Fetch activity logs and notebook notes
    const [logsResult, notesResult] = await Promise.all([
      supabase.from('activity_logs').select('activity_type, score, metadata, completed_at').eq('user_id', userId),
      supabase.from('notebook_notes').select('created_at').eq('user_id', userId)
    ]);

    if (logsResult.error) throw logsResult.error;
    if (notesResult.error) throw notesResult.error;

    const logList = logsResult.data || [];
    const noteRows = notesResult.data || [];

    // Filter to STRICTLY today's activities for daily resetting tasks
    const todayLogs = logList.filter((l) => l.completed_at && new Date(l.completed_at).toLocaleDateString('sv-SE') === today);
    const todayNotes = noteRows.filter((n) => n.created_at && new Date(n.created_at).toLocaleDateString('sv-SE') === today);

    // ── Grade 1-4 stats (Today only!) ──────────────────────────────────────
    const traceLogs = todayLogs.filter((l) => l.activity_type === 'alphabet_tracing');
    const mathLogs  = todayLogs.filter((l) => l.activity_type === 'living_math');
    const showLogs  = todayLogs.filter((l) => l.activity_type === 'show_and_tell');

    const highAccuracyTraceTodayCount = traceLogs.filter((l) => (l.score || 0) >= 90).length;
    const perfectMathTodayCount       = mathLogs.filter((l) => l.score === 100).length;
    const showTellTodayCount          = showLogs.length;
    const bestScoreToday              = todayLogs.filter((l) => l.score != null).reduce((mx, l) => Math.max(mx, l.score), 0);

    const PLAY_TYPES   = ['alphabet_tracing', 'living_math', 'show_and_tell'];
    const coveredTypesToday = new Set(todayLogs.map((l) => l.activity_type).filter((t) => PLAY_TYPES.includes(t)));

    const distinctLettersToday      = new Set(traceLogs.filter((l) => l.metadata?.letter).map((l) => l.metadata.letter.toUpperCase()));
    const distinctLettersTodayCount = distinctLettersToday.size;

    // ── Grade 5-8 stats (Today only!) ──────────────────────────────────────
    const queryLogs     = todayLogs.filter((l) => l.activity_type === 'rag_query');
    const queryCount    = queryLogs.length;
    const noteEditCount = todayLogs.filter((l) => l.activity_type === 'note_edit').length;
    const noteTotal     = todayNotes.length;

    const distinctSubjects = new Set(
      queryLogs.filter((l) => l.metadata?.subject).map((l) => l.metadata.subject)
    );
    const distinctSubjectsTodayCount = distinctSubjects.size;

    // ── Progress fraction (0–1) per daily task ──────────────────────────────
    function getProgressFraction(badgeId) {
      const id = badgeId.toLowerCase();
      if (gradeGroup === '1-4') {
        if (id === '14100000-0000-0000-0000-000000000001') return Math.min(todayLogs.length / 1, 1);
        if (id === '14100000-0000-0000-0000-000000000002') return Math.min(traceLogs.length / 1, 1);
        if (id === '14100000-0000-0000-0000-000000000003') return Math.min(mathLogs.length / 1, 1);
        if (id === '14100000-0000-0000-0000-000000000004') return Math.min(showTellTodayCount / 1, 1);
        if (id === '14200000-0000-0000-0000-000000000001') return Math.min(traceLogs.length / 2, 1);
        if (id === '14200000-0000-0000-0000-000000000002') return perfectMathTodayCount >= 1 ? 1 : 0;
        if (id === '14200000-0000-0000-0000-000000000003') return Math.min(coveredTypesToday.size / 2, 1);
        if (id === '14200000-0000-0000-0000-000000000004') return bestScoreToday >= 90 ? 1 : Math.min(bestScoreToday / 90, 0.99);
        if (id === '14200000-0000-0000-0000-000000000005') return Math.min(distinctLettersTodayCount / 3, 1);
        if (id === '14300000-0000-0000-0000-000000000001') return Math.min(todayLogs.length / 5, 1);
        if (id === '14300000-0000-0000-0000-000000000002') return coveredTypesToday.size >= 3 ? 1 : Math.min(coveredTypesToday.size / 3, 0.99);
        if (id === '14300000-0000-0000-0000-000000000003') return Math.min(highAccuracyTraceTodayCount / 3, 1);
      } else if (gradeGroup === '5-8') {
        if (id === '58100000-0000-0000-0000-000000000001') return todayLogs.length >= 1 ? 1 : 0;
        if (id === '58100000-0000-0000-0000-000000000002') return Math.min(queryCount / 1, 1);
        if (id === '58100000-0000-0000-0000-000000000003') return Math.min(noteTotal / 1, 1);
        if (id === '58100000-0000-0000-0000-000000000004') return Math.min(queryCount / 2, 1);
        if (id === '58200000-0000-0000-0000-000000000001') return Math.min(noteTotal / 2, 1);
        if (id === '58200000-0000-0000-0000-000000000002') return Math.min(queryCount / 5, 1);
        if (id === '58200000-0000-0000-0000-000000000003') return Math.min(noteTotal / 4, 1);
        if (id === '58200000-0000-0000-0000-000000000004') return Math.min(distinctSubjectsTodayCount / 2, 1);
        if (id === '58200000-0000-0000-0000-000000000005') return (queryCount >= 1 && noteTotal >= 1) ? 1 : Math.min((queryCount + noteTotal) / 2, 0.99);
        if (id === '58300000-0000-0000-0000-000000000001') return Math.min(noteEditCount / 1, 1);
        if (id === '58300000-0000-0000-0000-000000000002') return (queryCount >= 5 && noteTotal >= 3) ? 1 : Math.min((Math.min(queryCount, 5) + Math.min(noteTotal, 3)) / 8, 0.99);
        if (id === '58300000-0000-0000-0000-000000000003') return (noteEditCount >= 1 && queryCount >= 1 && noteTotal >= 1) ? 1 : Math.min((Math.min(noteEditCount, 1) + Math.min(queryCount, 1) + Math.min(noteTotal, 1)) / 3, 0.99);
      }
      return 0;
    }

    // ── Write progress to user_badges for every badge ─────────────────────
    const newlyUnlocked = [];

    for (const badge of allBadges) {
      const existing          = existingMap[badge.id];
      const isAlreadyUnlocked = Boolean(existing?.unlocked_at);

      // Only skip if unlocked TODAY
      if (isAlreadyUnlocked) continue;

      const fraction = getProgressFraction(badge.id);
      const isEarned = fraction >= 1;

      // No progress and no existing row → nothing to write
      if (fraction <= 0 && !existing) continue;

      const payload = {
        user_id:  userId,
        badge_id: badge.id,
        progress: isEarned ? 1 : parseFloat(fraction.toFixed(4)),
        ...(isEarned ? { unlocked_at: new Date().toISOString() } : {}),
      };

      if (existing) {
        // Only update if progress changed
        const storedProgress = existing.progress ?? 0;
        if (fraction > storedProgress || isEarned) {
          const { error: updateErr } = await supabase
            .from('user_badges')
            .update(payload)
            .eq('id', existing.id);

          if (updateErr) {
            console.error('[Badges] Error updating daily task progress:', updateErr.message);
          } else if (isEarned) {
            newlyUnlocked.push(badge);
            try { window.dispatchEvent(new Event('edu_ai_badge_unlocked')); } catch (_) {}
          }
        }
      } else {
        // Insert a new row (partial progress or fully earned)
        const { error: insertErr } = await supabase
          .from('user_badges')
          .insert(payload);

        if (insertErr) {
          console.error('[Badges] Error inserting user badge:', insertErr.message);
        } else if (isEarned) {
          newlyUnlocked.push(badge);
          try { window.dispatchEvent(new Event('edu_ai_badge_unlocked')); } catch (_) {}
        }
      }
    }

    // 5. Evaluate and update Daily Tasks Streak
    const completedTasksToday = allBadges.filter(badge => {
      const existing = existingMap[badge.id];
      const fraction = getProgressFraction(badge.id);
      return fraction >= 1 || Boolean(existing?.unlocked_at);
    }).length;

    if (completedTasksToday >= 3) {
      let taskStreak = { current_streak: 0, longest_streak: 0, last_completed_date: null };
      try {
        const cached = localStorage.getItem('edu_ai_tasks_streak');
        if (cached) taskStreak = JSON.parse(cached);
      } catch (e) {}

      if (taskStreak.last_completed_date !== today) {
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');
        const isConsecutive = taskStreak.last_completed_date === yesterday;
        
        const newStreak = isConsecutive ? (taskStreak.current_streak || 0) + 1 : 1;
        const newLongest = Math.max(taskStreak.longest_streak || 0, newStreak);
        
        const updatedStreak = {
          current_streak: newStreak,
          longest_streak: newLongest,
          last_completed_date: today
        };
        
        localStorage.setItem('edu_ai_tasks_streak', JSON.stringify(updatedStreak));
        
        try {
          window.dispatchEvent(new Event('edu_ai_task_streak_updated'));
        } catch (_) {}
      }
    }

    return { newlyUnlocked };
  } catch (err) {
    console.error('[Badges] checkForNewBadges error:', err);
    return { newlyUnlocked: [] };
  }
}
