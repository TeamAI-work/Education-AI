import { motion } from 'framer-motion';
import { Trophy, Award, Star, Flame, Sparkles, BookOpen } from 'lucide-react';

export default function AchievementIcons({ streakCount = 4, notesCount = 0, queryCount = 0 }) {
  
  // High fidelity monochromatic badges structure
  const BADGES = [
    {
      id: 'streak_5',
      title: 'Consistency Star',
      desc: 'Maintain a study streak of 5 consecutive days.',
      icon: Flame,
      current: streakCount,
      target: 5,
      emoji: '\u{1F525}'
    },
    {
      id: 'queries_5',
      title: 'AI Inquirer',
      desc: 'Send at least 5 query items to the RAG vector engine.',
      icon: Sparkles,
      current: queryCount,
      target: 5,
      emoji: '\u{2728}'
    },
    {
      id: 'notes_3',
      title: 'Active Annotator',
      desc: 'Capture 3 highlighted snippets inside the notebook.',
      icon: BookOpen,
      current: notesCount,
      target: 3,
      emoji: '\u{1F4D6}'
    },
    {
      id: 'habit_pioneer',
      title: 'Habit Pioneer',
      desc: 'Unlock your first active session and complete a study day.',
      icon: Award,
      current: queryCount > 0 || notesCount > 0 ? 1 : 0,
      target: 1,
      emoji: '\u{1F3C6}'
    }
  ];

  return (
    <div className="glass rounded-3xl p-5 border border-white/10 flex flex-col h-full overflow-hidden relative select-none">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-15 bg-[#6666ff] pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#6666ff]/10 flex items-center justify-center border border-[#6666ff]/25 animate-pulse">
            <Trophy size={20} className="text-[#6666ff]" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm leading-none">Habit Achievements</h3>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-0.5">Your study trophies</p>
          </div>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-2">
        {BADGES.map((badge) => {
          const isUnlocked = badge.current >= badge.target;
          const progress = Math.min((badge.current / badge.target) * 100, 100);
          const Icon = badge.icon;

          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -3, scale: 1.01 }}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between
                ${isUnlocked 
                  ? 'bg-gradient-to-br from-[#6666ff]/10 to-transparent border-[#6666ff]/25 shadow-[0_4px_16px_rgba(102,102,255,0.08)]' 
                  : 'bg-white/5 border-white/5 opacity-70'
                }`}
            >
              {/* Unlock glow layer */}
              {isUnlocked && (
                <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-20 bg-[#6666ff] pointer-events-none" />
              )}

              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl relative
                    ${isUnlocked 
                      ? 'bg-gradient-to-br from-[#6666ff] to-[#4d4dff] text-[#0a0f1e] shadow-md shadow-[#6666ff]/20' 
                      : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                  >
                    {isUnlocked ? badge.emoji : <Star size={16} />}
                  </div>
                  
                  <div>
                    <h4 className="text-white font-black text-xs leading-none">{badge.title}</h4>
                    <p className="text-white/40 text-[9px] font-semibold mt-1 leading-normal leading-tight max-w-[180px]">{badge.desc}</p>
                  </div>
                </div>

                {isUnlocked && (
                  <span className="text-[8px] bg-[#6666ff]/15 border border-[#6666ff]/35 text-[#6666ff] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none">
                    Unlocked
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-auto pt-2">
                <div className="flex items-center justify-between text-[8px] font-bold text-white/30 mb-1 select-none">
                  <span>Progress</span>
                  <span>{badge.current} / {badge.target}</span>
                </div>
                <div className="w-full h-1.5 bg-black/35 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#6666ff] to-[#7a7aff] rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
