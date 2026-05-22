import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Zap, X } from 'lucide-react';
import { getStoredUserId } from '../../lib/useStudentProfile';
import { supabase } from '../../lib/supabaseClient';
import { fetchAllBadges, fetchAllUserBadges, getTasksStreak } from '../../lib/Badges';

// ---------------------------------------------------------------------------
// Rarity config — sourced from badge.rarity column in DB
// ---------------------------------------------------------------------------
const RARITY_CONFIG = {
  common: { color: '#C0C0C0', dim: 'rgba(192,192,192,0.10)', glow: 'rgba(192,192,192,0.25)', label: 'Common' },
  rare: { color: '#6666ff', dim: 'rgba(102,102,255,0.12)', glow: 'rgba(102,102,255,0.35)', label: 'Rare' },
  legendary: { color: '#FFD700', dim: 'rgba(255,215,0,0.12)', glow: 'rgba(255,215,0,0.5)', label: 'Legendary' },
};

// ---------------------------------------------------------------------------
// Pure display component — reads ONLY from:
//   badges table      → master list with rarity, title, description, icon_url
//   user_badges table → progress (0–1) and unlocked_at per badge
//
// The write path (checkForNewBadges in gamification.js) is responsible for
// computing and updating user_badges.progress after every user action.
// ---------------------------------------------------------------------------
export default function AchievementIcons({ onClose }) {
  const [badges, setBadges] = useState([]);  // all master badges for grade
  const [userBadgeMap, setUserBadgeMap] = useState({});  // badge_id → { id, progress, unlocked_at }
  const [loading, setLoading] = useState(true);
  const [taskStreak, setTaskStreak] = useState({ current_streak: 0, longest_streak: 0, last_completed_date: null });

  async function loadData() {
    const userId = getStoredUserId();
    if (!userId) { setLoading(false); return; }

    try {
      // Resolve grade group
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_group')
        .eq('id', userId)
        .single();
      const gradeGroup = profile?.grade_group || '5-8';

      // Fetch master badges + user's progress rows — nothing else
      const [allBadges, userBadgeRows] = await Promise.all([
        fetchAllBadges(gradeGroup),
        fetchAllUserBadges(userId),
      ]);

      // Build lookup: badge_id → user_badges row
      const map = {};
      for (const ub of userBadgeRows) {
        map[ub.badge_id] = {
          id: ub.id,
          progress: ub.progress ?? 0,   // 0–1 fraction written by checkForNewBadges
          unlocked_at: ub.unlocked_at,
        };
      }

      setBadges(allBadges);
      setUserBadgeMap(map);
    } catch (err) {
      console.error('[AchievementIcons] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    setTaskStreak(getTasksStreak());
    // Re-fetch whenever checkForNewBadges fires an unlock event
    const handler = () => loadData();
    const streakHandler = () => {
      setTaskStreak(getTasksStreak());
    };
    window.addEventListener('edu_ai_badge_unlocked', handler);
    window.addEventListener('edu_ai_task_streak_updated', streakHandler);
    return () => {
      window.removeEventListener('edu_ai_badge_unlocked', handler);
      window.removeEventListener('edu_ai_task_streak_updated', streakHandler);
    };
  }, []);

  const commonBadges = badges.filter(b => b.rarity === 'common');
  const rareBadges = badges.filter(b => b.rarity === 'rare');
  const legendaryBadges = badges.filter(b => b.rarity === 'legendary');

  // -------------------------------------------------------------------------
  // Badge card
  // -------------------------------------------------------------------------
  function BadgeCard({ badge }) {
    const rarity = badge.rarity in RARITY_CONFIG ? badge.rarity : 'common';
    const cfg = RARITY_CONFIG[rarity];
    const ubData = userBadgeMap[badge.id];

    // Badge state
    // - unlocked:   has a confirmed unlocked_at in user_badges → 100%
    // - inProgress: has a user_badges row with 0 < progress < 1 → show %
    // - noneYet:    no user_badges row at all → 0%
    const unlocked = Boolean(ubData?.unlocked_at);
    const rawProgress = unlocked
      ? 1
      : (ubData?.progress ?? 0);           // 0 if badge not in user_badges yet
    const pct = unlocked ? 100 : Math.floor(rawProgress * 100);
    const inProgress = !unlocked && pct > 0;
    const noneYet = !unlocked && pct === 0;

    // Card styling
    let cardBg = 'rgba(255,255,255,0.03)';
    let cardBorder = 'rgba(255,255,255,0.05)';
    let cardOpacity = 1;
    if (unlocked) {
      cardBg = `linear-gradient(135deg, ${cfg.dim}, rgba(0,0,0,0.18))`;
      cardBorder = cfg.color + '4D';
    } else if (inProgress) {
      cardBg = cfg.dim;
      cardBorder = 'rgba(255,255,255,0.08)';
    } else {
      cardOpacity = 0.55;
    }

    const hoverAnim = unlocked ? { y: -3, scale: 1.01 } : inProgress ? { scale: 1.005 } : {};

    function IconOrb() {
      const base = {
        width: 44, height: 44, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '1.4rem', fontWeight: 900, position: 'relative',
      };
      if (unlocked) return (
        <div style={{ ...base, background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}55)`, border: `1.5px solid ${cfg.color}66`, boxShadow: `0 4px 14px ${cfg.glow}` }}>
          <span style={{ fontSize: '1.35rem' }}>{badge.icon_url}</span>
        </div>
      );
      if (rarity === 'legendary') return (
        <div className="legendary-orb" style={{ ...base, background: 'rgba(255,215,0,0.08)', border: '1.5px solid rgba(255,215,0,0.35)', color: '#FFD700' }}>?</div>
      );
      if (inProgress) return (
        <div style={{ ...base, background: `${cfg.color}1A`, border: `1.5px solid ${cfg.color}40` }}>
          <span style={{ fontSize: '1.35rem', opacity: 0.5 }}>{badge.icon_url}</span>
        </div>
      );
      return (
        <div style={{ ...base, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Lock size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
      );
    }

    return (
      <motion.div
        whileHover={hoverAnim}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '12px 13px', position: 'relative', overflow: 'hidden', opacity: cardOpacity }}
      >
        {/* Unlock glow blob */}
        {unlocked && (
          <div style={{ position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: '50%', background: cfg.glow, filter: 'blur(22px)', pointerEvents: 'none' }} />
        )}

        {/* Top row: icon + title/desc + chip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
            <IconOrb />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: unlocked ? '#f0f0f0' : 'rgba(255,255,255,0.65)', lineHeight: 1.25, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {badge.title}
              </div>
              <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.35 }}>
                {badge.description}
              </div>
            </div>
          </div>
          {unlocked && (
            <div style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: cfg.color, background: `${cfg.color}22`, border: `1px solid ${cfg.color}44`, borderRadius: 99, padding: '2px 7px', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
              {cfg.label}
            </div>
          )}
          {inProgress && (
            <div style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 99, padding: '2px 7px', whiteSpace: 'nowrap' }}>
              In Progress
            </div>
          )}
        </div>

        {/* Progress bar — driven purely by user_badges.progress from DB */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: unlocked ? cfg.color : 'rgba(255,255,255,0.30)' }}>
              {unlocked ? 'Complete!' : inProgress ? 'In Progress' : 'Locked'}
            </span>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: unlocked ? cfg.color : 'rgba(255,255,255,0.30)' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: 99,
                background: unlocked ? cfg.color : inProgress ? `${cfg.color}8C` : 'rgba(255,255,255,0.12)',
                boxShadow: unlocked ? `0 0 8px ${cfg.glow}` : 'none',
              }}
            />
          </div>
        </div>

        {/* Lock hint — uses badge.description from DB, no hardcoded strings */}
        {noneYet && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 9, color: 'rgba(255,255,255,0.20)', fontSize: '0.62rem' }}>
            <Lock size={7} style={{ flexShrink: 0 }} />
            <span>{badge.description || 'Keep studying to unlock!'}</span>
          </div>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------------------
  // Rarity section
  // -------------------------------------------------------------------------
  function RaritySection({ items, cfg }) {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-4 sm:mb-[18px]" style={{ padding: '2px 6px 2px 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 3, height: 12, borderRadius: 99, background: cfg.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: `${cfg.color}99`, background: `${cfg.color}18`, border: `1px solid ${cfg.color}33`, borderRadius: 99, padding: '1px 6px' }}>
            {items.length}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5" style={{ padding: '3px 2px' }}>
          {items.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="glass no-scrollbar rounded-3xl p-3.5 sm:p-5 border border-white/10 flex flex-col h-full overflow-hidden relative select-none">
      <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0 }} className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(99,102,241,0.18))', border: '1px solid rgba(99,102,241,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.25)', flexShrink: 0 }}>
            <Trophy size={18} style={{ color: '#a5b4fc' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>Habit Achievements</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>Your study trophies</div>
          </div>
        </div>
        <div className="flex group items-center gap-2 px-2 py-1 text-white/50 rounded-xl  transition-all cursor-pointer" onClick={onClose}>
          <X size={25} className='group-hover:text-white'/>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.6rem', animation: 'spin 1s linear infinite' }}>{'\u2699\uFE0F'}</span>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 8px 18px 2px',
            margin: '-6px -8px -18px -2px',
          }}
          className="no-scrollbar"
        >
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes legendaryPulse {
              0%, 100% { box-shadow: 0 0 10px rgba(255,215,0,0.18); border-color: rgba(255,215,0,0.35); }
              50%       { box-shadow: 0 0 26px rgba(255,215,0,0.55); border-color: rgba(255,215,0,0.7); }
            }
            .legendary-orb { animation: legendaryPulse 2.5s ease-in-out infinite; }
          `}} />

          {/* Daily Task Streak Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
              border: '1.5px solid rgba(249, 115, 22, 0.3)',
              borderRadius: 16,
              padding: '14px 16px',
              margin: '3px 6px 20px 2px',
              boxShadow: '0 8px 32px rgba(249, 115, 22, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Glowing backdrop */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(249, 115, 22, 0.4)', filter: 'blur(20px)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)', flexShrink: 0 }}>
                <Zap size={20} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Tasks Streak</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Complete 3+ daily tasks to keep the flame alive!</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Current Streak</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span>{taskStreak.current_streak}</span>
                  <span style={{ fontSize: '1rem' }}>🔥</span>
                </div>
              </div>
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Longest Streak</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span>{taskStreak.longest_streak}</span>
                  <span style={{ fontSize: '1rem' }}>👑</span>
                </div>
              </div>
            </div>
          </motion.div>

          {badges.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.30)', fontSize: '0.8rem', paddingTop: 40 }}>
              No badges found for your grade group.
            </div>
          ) : (
            <>
              <RaritySection items={commonBadges} cfg={RARITY_CONFIG.common} />
              <RaritySection items={rareBadges} cfg={RARITY_CONFIG.rare} />
              <RaritySection items={legendaryBadges} cfg={RARITY_CONFIG.legendary} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
