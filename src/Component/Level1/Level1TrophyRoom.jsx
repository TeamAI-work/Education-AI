import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Lock } from 'lucide-react';
import { fetchBadges, fetchUserBadges } from '../../lib/gamification';
import { supabase } from '../../lib/supabaseClient';

// ── Rarity config ──────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common:    { color: '#C0C0C0', dim: 'rgba(192,192,192,0.11)', glow: 'rgba(192,192,192,0.28)', label: 'Common',    icon: '\u2B1C' },
  rare:      { color: '#6666ff', dim: 'rgba(102,102,255,0.13)', glow: 'rgba(102,102,255,0.38)', label: 'Rare',       icon: '\uD83D\uDFE6' },
  legendary: { color: '#FFD700', dim: 'rgba(255,215,0,0.13)',   glow: 'rgba(255,215,0,0.5)',   label: 'Legendary',  icon: '\u2B50' },
};

function getRarity(badgeId) {
  const id = (badgeId || '').toLowerCase();
  if (id.startsWith('14300000')) return 'legendary';
  if (id.startsWith('14200000')) return 'rare';
  return 'common';
}

// ── Per-badge criteria (progress bars & hints) ──────────────────────────────
const BADGE_CRITERIA = {
  '14100000-0000-0000-0000-000000000001': { label: 'Complete any 1 activity',          target: 1,  getProgress: s => Math.min(s.totalCount, 1),              hasBar: true,  hint: 'Try any game to earn this starter badge!' },
  '14100000-0000-0000-0000-000000000002': { label: 'Trace any letter once',            target: 1,  getProgress: s => Math.min(s.tracingCount, 1),            hasBar: true,  hint: 'Open Letter Tracing and draw any letter!' },
  '14100000-0000-0000-0000-000000000003': { label: 'Play Living Math once',            target: 1,  getProgress: s => Math.min(s.mathCount, 1),               hasBar: true,  hint: 'Open Living Math and count the emojis!' },
  '14100000-0000-0000-0000-000000000004': { label: 'Share 1 photo in Show & Tell',    target: 1,  getProgress: s => Math.min(s.showTellCount, 1),           hasBar: true,  hint: 'Open Show & Tell and capture a picture!' },
  '14200000-0000-0000-0000-000000000001': { label: 'Trace 5 letters scoring \u2265 85%',     target: 5,  getProgress: s => s.highAccuracyTraceCount,              hasBar: true,  hint: 'Keep your pencil inside the dotted guide!' },
  '14200000-0000-0000-0000-000000000002': { label: 'Perfect score in Living Math \xd7 3', target: 3,  getProgress: s => s.perfectMathCount,                    hasBar: true,  hint: 'Count all the emojis perfectly 3 times!' },
  '14200000-0000-0000-0000-000000000003': { label: 'Try all 3 different activities',  target: 3,  getProgress: s => s.activityTypesCount,                   hasBar: true,  hint: 'Play Tracing, Math AND Show & Tell!' },
  '14200000-0000-0000-0000-000000000004': { label: 'Score \u2265 90% on any activity',       target: 90, getProgress: s => s.bestScore,                           hasBar: true,  hint: 'Trace very carefully or count perfectly!' },
  '14200000-0000-0000-0000-000000000005': { label: 'Trace 13 different letters',      target: 13, getProgress: s => s.distinctLettersCount,                 hasBar: true,  hint: 'Keep going through the whole alphabet!' },
  '14300000-0000-0000-0000-000000000001': { label: 'Trace ALL 26 letters with \u2265 90%', target: 26, getProgress: s => s.distinctLettersAbove90Count,          hasBar: true,  hint: 'Master every single letter with near-perfect accuracy!' },
  '14300000-0000-0000-0000-000000000002': { label: 'Complete all 3 activities in one day', target: 1, getProgress: () => 0,                                  hasBar: false, hint: 'Play Tracing, Math AND Show & Tell on the same day!' },
  '14300000-0000-0000-0000-000000000003': { label: 'Score \u2265 90% on 5 different letters', target: 5, getProgress: s => s.distinctLettersAbove90Count,         hasBar: true,  hint: 'Nail 5 DIFFERENT letters with top accuracy!' },
};

// ── Activity stats fetcher ─────────────────────────────────────────────────────
async function fetchActivityProgress(userId) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('activity_type, score, metadata, completed_at')
    .eq('user_id', userId);

  if (error || !data) {
    return { totalCount: 0, tracingCount: 0, mathCount: 0, showTellCount: 0, highAccuracyTraceCount: 0, perfectMathCount: 0, activityTypesCount: 0, bestScore: 0, distinctLettersCount: 0, distinctLettersAbove90Count: 0 };
  }

  const traceLogs = data.filter(l => l.activity_type === 'alphabet_tracing');
  const mathLogs  = data.filter(l => l.activity_type === 'living_math');

  const distinctLetters     = new Set(traceLogs.filter(l => l.metadata?.letter).map(l => l.metadata.letter.toUpperCase()));
  const distinctAbove90     = new Set(traceLogs.filter(l => (l.score || 0) >= 90 && l.metadata?.letter).map(l => l.metadata.letter.toUpperCase()));

  const PLAY_TYPES = ['alphabet_tracing', 'living_math', 'show_and_tell'];
  const coveredTypes = new Set(data.map(l => l.activity_type).filter(t => PLAY_TYPES.includes(t)));

  return {
    totalCount:               data.length,
    tracingCount:             traceLogs.length,
    mathCount:                mathLogs.length,
    showTellCount:            data.filter(l => l.activity_type === 'show_and_tell').length,
    highAccuracyTraceCount:   traceLogs.filter(l => (l.score || 0) >= 85).length,
    perfectMathCount:         mathLogs.filter(l => l.score === 100).length,
    activityTypesCount:       coveredTypes.size,
    bestScore:                data.filter(l => l.score != null).reduce((mx, l) => Math.max(mx, l.score), 0),
    distinctLettersCount:     distinctLetters.size || traceLogs.length,
    distinctLettersAbove90Count: distinctAbove90.size,
  };
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Level1TrophyRoom({ isOpen, onClose, userId }) {
  const [badges, setBadges]         = useState([]);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);

  const loadTrophyData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [allBadges, userBadges, activityStats] = await Promise.all([
        fetchBadges('1-4'),
        fetchUserBadges(userId),
        fetchActivityProgress(userId),
      ]);
      setBadges(allBadges);
      setUnlockedIds(new Set(userBadges.map(ub => ub.badge_id || ub.badge?.id)));
      setStats(activityStats);
    } catch (e) {
      console.error('Error loading Level 1 trophy data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen && userId) loadTrophyData(); }, [isOpen, userId]);
  useEffect(() => {
    window.addEventListener('edu_ai_badge_unlocked', loadTrophyData);
    return () => window.removeEventListener('edu_ai_badge_unlocked', loadTrophyData);
  }, [userId]);

  if (!isOpen) return null;

  const unlockedCount = badges.filter(b => unlockedIds.has(b.id)).length;
  const overallPct    = badges.length > 0 ? (unlockedCount / badges.length) * 100 : 0;

  // Group badges by rarity in display order
  const grouped = {
    common:    badges.filter(b => getRarity(b.id) === 'common'),
    rare:      badges.filter(b => getRarity(b.id) === 'rare'),
    legendary: badges.filter(b => getRarity(b.id) === 'legendary'),
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Legendary CSS animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes legendaryPulse {
            0%, 100% { box-shadow: 0 0 12px rgba(255,215,0,0.20); border-color: rgba(255,215,0,0.35); }
            50%       { box-shadow: 0 0 30px rgba(255,215,0,0.60); border-color: rgba(255,215,0,0.72); }
          }
          @keyframes legendaryCardShimmer {
            0%, 100% { box-shadow: 0 4px 20px rgba(255,215,0,0.05); }
            50%       { box-shadow: 0 4px 28px rgba(255,215,0,0.18); }
          }
          .legendary-orb-locked { animation: legendaryPulse 2.6s ease-in-out infinite; }
          .legendary-card-locked { animation: legendaryCardShimmer 3s ease-in-out infinite; }
        `}} />

        {/* Blurred backdrop */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-md" />

        {/* Floating background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
          <div className="absolute top-[8%] left-[10%] text-5xl opacity-10 animate-bounce" style={{ animationDuration: '3.2s' }}>{'\u2B50'}</div>
          <div className="absolute bottom-[10%] right-[8%] text-5xl opacity-8 animate-pulse" style={{ animationDuration: '4.5s' }}>{'\uD83C\uDF88'}</div>
          <div className="absolute top-[20%] right-[14%] text-4xl opacity-8 animate-bounce" style={{ animationDuration: '5.5s' }}>{'\uD83C\uDF89'}</div>
          <div className="absolute bottom-[22%] left-[6%] text-4xl opacity-10 animate-pulse" style={{ animationDuration: '3.8s' }}>{'\uD83C\uDF1F'}</div>
        </div>

        {/* Main Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-[700px] rounded-[36px] p-6 md:p-8 flex flex-col z-10 select-none"
          style={{
            maxHeight: '90dvh',
            background: 'rgba(16, 8, 40, 0.88)',
            border: '1.5px solid rgba(255, 255, 255, 0.10)',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.60), inset 0 0 32px rgba(255,255,255,0.02)',
            backdropFilter: 'blur(28px)',
          }}
        >
          {/* Corner glow blobs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 bg-[#FFD93D] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl opacity-14 bg-[#A29BFE] pointer-events-none" />

          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors z-20"
          >
            <X size={17} />
          </button>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-4 pb-4 mb-5 border-b border-white/8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD93D] to-[#FF9F1C] flex items-center justify-center shadow-lg shadow-yellow-500/25 flex-shrink-0">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-none">My Trophy Room</h2>
              <p className="text-white/40 text-[10px] font-extrabold uppercase tracking-widest mt-1.5">
                Grade 1{'\u20134'} Badges {'\uD83D\uDD16'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="text-4xl">
                {'\u2B50'}
              </motion.div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Loading Trophies...</p>
            </div>
          ) : (
            <>
              {/* Overall progress banner */}
              <div className="flex-shrink-0 p-4 rounded-2xl mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <h4 className="text-white font-black text-sm">
                    {unlockedCount === badges.length && badges.length > 0
                      ? `All ${badges.length} badges collected! ${'\uD83C\uDFC6'}`
                      : `${unlockedCount} of ${badges.length} badges unlocked`}
                  </h4>
                  <p className="text-white/40 text-[10px] font-bold mt-0.5">Keep playing to collect them all!</p>
                </div>
                <div className="flex items-center gap-3 flex-1 sm:max-w-[260px]">
                  <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF9F1C]"
                    />
                  </div>
                  <span className="text-white font-black text-sm leading-none flex-shrink-0">{Math.round(overallPct)}%</span>
                </div>
              </div>

              {/* Scrollable badge list grouped by rarity */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-6 pb-2">
                {(['common', 'rare', 'legendary']).map(rarity => {
                  const group = grouped[rarity];
                  if (!group || group.length === 0) return null;
                  const rc = RARITY_CONFIG[rarity];

                  return (
                    <div key={rarity}>
                      {/* Section header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm" style={{ color: rc.color }}>{rc.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: rc.color }}>
                          {rc.label} Badges
                        </span>
                        <div className="flex-1 h-px" style={{ background: `${rc.color}20` }} />
                        <span className="text-[9px] font-black" style={{ color: `${rc.color}80` }}>
                          {group.filter(b => unlockedIds.has(b.id)).length} / {group.length}
                        </span>
                      </div>

                      {/* Row layout */}
                      <div className="flex flex-col gap-3">
                        {group.map((badge, idx) => {
                          const isUnlocked = unlockedIds.has(badge.id);
                          const criteria   = BADGE_CRITERIA[badge.id.toLowerCase()];
                          const current    = criteria && stats ? Math.min(criteria.getProgress(stats), criteria.target) : 0;
                          const target     = criteria?.target ?? 1;
                          const pct        = target > 0 ? (current / target) * 100 : 0;
                          const isPartial  = !isUnlocked && pct > 0;
                          const isLegendaryLocked = rarity === 'legendary' && !isUnlocked;

                          return (
                            <motion.div
                              key={badge.id}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                              whileHover={isUnlocked ? { y: -3, scale: 1.015 } : isPartial ? { scale: 1.005 } : {}}
                              className={`relative rounded-2xl p-4 flex flex-col gap-2.5 overflow-hidden border transition-all ${isLegendaryLocked ? 'legendary-card-locked' : ''}`}
                              style={{
                                background: isUnlocked
                                  ? `linear-gradient(135deg, ${rc.dim}, rgba(255,255,255,0.025))`
                                  : isPartial ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                                border: isUnlocked
                                  ? `1.5px solid ${rc.color}35`
                                  : isLegendaryLocked
                                    ? '1.5px solid rgba(255,215,0,0.25)'
                                    : isPartial ? `1px solid ${rc.color}18` : '1px solid rgba(255,255,255,0.06)',
                                boxShadow: isUnlocked ? `0 6px 22px ${rc.glow}18` : 'none',
                                opacity: !isUnlocked && !isPartial && rarity !== 'legendary' ? 0.62 : 1,
                              }}
                            >
                              {/* Unlock glow blob */}
                              {isUnlocked && (
                                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-22 pointer-events-none" style={{ background: rc.color }} />
                              )}

                              {/* Top row: orb + title/desc + chip */}
                              <div className="flex items-start gap-3">
                                {/* Icon orb */}
                                <div
                                  className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl border transition-all relative overflow-hidden ${isLegendaryLocked ? 'legendary-orb-locked' : ''}`}
                                  style={
                                    isUnlocked
                                      ? { background: `linear-gradient(135deg, ${rc.color}, ${rc.color}bb)`, border: `1px solid ${rc.color}50`, boxShadow: `0 4px 16px ${rc.color}40` }
                                      : isLegendaryLocked
                                        ? { background: 'rgba(255,215,0,0.07)', border: '1.5px solid rgba(255,215,0,0.35)' }
                                        : isPartial
                                          ? { background: `${rc.color}0e`, border: `1px solid ${rc.color}22` }
                                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                                  }
                                >
                                  {isUnlocked ? (
                                    <motion.span
                                      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.08, 1] }}
                                      transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                                    >
                                      {badge.icon_url}
                                    </motion.span>
                                  ) : isLegendaryLocked ? (
                                    <span style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>?</span>
                                  ) : isPartial ? (
                                    <span style={{ fontSize: '1.5rem', opacity: 0.45 }}>{badge.icon_url}</span>
                                  ) : (
                                    <Lock size={18} style={{ color: `${rc.color}60` }} />
                                  )}
                                </div>

                                {/* Title + description */}
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="font-black text-sm leading-tight"
                                      style={{ color: isUnlocked ? rc.color : isLegendaryLocked ? 'rgba(255,215,0,0.70)' : 'rgba(255,255,255,0.72)' }}>
                                      {badge.title}
                                    </h3>
                                    {isUnlocked && (
                                      <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 tracking-wider"
                                        style={{ background: `${rc.color}20`, border: `1px solid ${rc.color}40`, color: rc.color }}>
                                        Unlocked {'\u2713'}
                                      </span>
                                    )}
                                    {isPartial && (
                                      <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 tracking-wider bg-white/5 border border-white/10 text-white/35">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white/40 text-[10px] font-medium leading-relaxed">{badge.description}</p>
                                </div>
                              </div>

                              {/* Progress bar (only if criteria.hasBar) */}
                              {criteria?.hasBar && (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-wider"
                                      style={{ color: isUnlocked ? rc.color : 'rgba(255,255,255,0.28)' }}>
                                      {isUnlocked ? 'Complete!' : criteria.label}
                                    </span>
                                    <span className="text-[9px] font-black" style={{ color: isUnlocked ? rc.color : 'rgba(255,255,255,0.32)' }}>
                                      {current} / {target}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 rounded-full overflow-hidden border"
                                    style={{ background: 'rgba(0,0,0,0.38)', border: `1px solid ${isUnlocked ? rc.color + '28' : 'rgba(255,255,255,0.05)'}` }}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.85, ease: 'easeOut', delay: idx * 0.05 }}
                                      className="h-full rounded-full"
                                      style={{
                                        background: isUnlocked
                                          ? `linear-gradient(90deg, ${rc.color}cc, ${rc.color})`
                                          : isPartial
                                            ? `linear-gradient(90deg, ${rc.color}48, ${rc.color}70)`
                                            : 'rgba(255,255,255,0.08)',
                                        boxShadow: isUnlocked ? `0 0 8px ${rc.color}70` : 'none',
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Lock hint (only when locked) */}
                              {!isUnlocked && criteria?.hint && (
                                <p className="text-[9px] font-medium leading-normal flex items-center gap-1"
                                  style={{ color: isLegendaryLocked ? 'rgba(255,215,0,0.28)' : 'rgba(255,255,255,0.22)' }}>
                                  <Lock size={8} style={{ flexShrink: 0, opacity: 0.6 }} />
                                  {criteria.hint}
                                </p>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {badges.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Trophy size={36} className="text-white/10 mb-3" />
                    <p className="text-white/35 text-xs font-bold">No badges found</p>
                    <p className="text-white/20 text-[10px] mt-1 max-w-[200px] leading-normal">
                      Run seed_badges.sql in your Supabase dashboard to populate badges.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
