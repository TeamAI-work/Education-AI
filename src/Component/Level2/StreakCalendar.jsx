import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Award } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { logActivity, updateStreak, getStreak } from '../../lib/gamification';

export default function StreakCalendar({ activitiesCount = 0 }) {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    bestStreak: 0,
    completedDays: {}
  });
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('edu_ai_user_id');

  const fetchStreakAndLogs = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch current streak data from Supabase/cache
      const streakRow = await getStreak(userId);
      
      // 2. Map the active_dates array into the completedDays dictionary
      const completed = {};
      if (streakRow && streakRow.active_dates) {
        streakRow.active_dates.forEach(dateStr => {
          completed[dateStr] = true;
        });
      }

      setStreakData({
        currentStreak: streakRow?.current_streak ?? 0,
        bestStreak: streakRow?.longest_streak ?? 0,
        completedDays: completed
      });
    } catch (err) {
      console.warn('Failed to load streak calendar from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mount effect to sync the streak first, then fetch the calendar data.
  useEffect(() => {
    const syncAndFetch = async () => {
      if (userId) {
        await updateStreak(userId);
      }
      await fetchStreakAndLogs();
    };
    syncAndFetch();
  }, [fetchStreakAndLogs, userId]);

  // Reactive effect when activitiesCount increments (RAG queries or notebook saves)
  useEffect(() => {
    const recordActivity = async () => {
      if (activitiesCount > 0 && userId) {
        setLoading(true);
        // Log study activity in Supabase
        await logActivity(userId, 'level2_study');
        // Refresh grid and counters
        await fetchStreakAndLogs();
      }
    };
    recordActivity();
  }, [activitiesCount, userId, fetchStreakAndLogs]);

  // Calculate past 35 days (5 rows, 7 columns) for the habit grid
  const getPast35Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const dayList = getPast35Days();
  const todayStr = new Date().toLocaleDateString('sv-SE');

  return (
    <div className="glass rounded-3xl p-5 border border-white/10 select-none flex flex-col gap-4 relative overflow-hidden h-full">
      {/* Background Glow */}
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-20 bg-[#6666ff] pointer-events-none" />
      
      {/* Header Info */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#6666ff]/10 flex items-center justify-center border border-[#6666ff]/25">
            <Flame size={20} className="text-[#6666ff]" />
          </div>
          <div>
            <h3 className="text-white font-black text-base leading-tight">Daily Habit Tracker</h3>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Stay consistent</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#6666ff]/10 border border-[#6666ff]/25">
          <span className="text-lg">{'\uD83D\uDD25'}</span>
          <span className="text-[#6666ff] text-sm font-black">{streakData.currentStreak} Days</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 flex-shrink-0">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider leading-none">Best Habit Run</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Trophy size={16} className="text-yellow-400" />
            <span className="text-white font-black text-base">{streakData.bestStreak} Days</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider leading-none">Total Active Days</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Award size={16} className="text-[#6666ff]" />
            <span className="text-white font-black text-base">
              {Object.keys(streakData.completedDays).length} Days
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Section */}
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="flex items-center justify-between text-[9px] font-bold text-white/40 px-1">
          <span>Habit Streak Board (Past 5 Weeks)</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded bg-white/5 border border-white/10" />
            <div className="w-2.5 h-2.5 rounded bg-[#6666ff]/40" />
            <div className="w-2.5 h-2.5 rounded bg-[#6666ff]" />
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 p-3 rounded-2xl bg-black/20 border border-white/5 justify-items-center relative">
          {loading && (
            <div className="absolute inset-0 bg-[#0a0f1e]/40 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-20">
              <span className="text-[10px] text-[#6666ff] font-bold animate-pulse">Syncing Supabase...</span>
            </div>
          )}

          {dayList.map((day) => {
            const dateKey = day.toLocaleDateString('sv-SE');
            const isCompleted = streakData.completedDays[dateKey] || (dateKey === todayStr && activitiesCount > 0);
            const isToday = dateKey === todayStr;

            return (
              <motion.div
                key={dateKey}
                whileHover={{ scale: 1.25, zIndex: 10 }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[8px] font-black transition-all cursor-pointer relative
                  ${isCompleted 
                    ? 'bg-[#6666ff] text-[#0a0f1e] shadow-[0_0_8px_rgba(102,102,255,0.35)]' 
                    : isToday 
                      ? 'bg-white/5 text-white border-2 border-dashed border-[#6666ff]/50'
                      : 'bg-white/5 text-white/20 border border-white/5 hover:bg-white/10'
                  }`}
                title={`${day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${isCompleted ? 'Completed' : 'No Activity'}`}
              >
                {day.getDate()}
                
                {isToday && !isCompleted && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#6666ff] animate-ping" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Suggestion Panel */}
      <div className="p-2.5 rounded-xl bg-[#6666ff]/5 border border-[#6666ff]/12 flex-shrink-0 text-center">
        <span className="text-[#6666ff] font-black text-xs">Habit Tip: </span>
        <span className="text-white/50 text-[11px] font-medium leading-none">
          Study at the same time daily to program muscle memory!
        </span>
      </div>
    </div>
  );
}
