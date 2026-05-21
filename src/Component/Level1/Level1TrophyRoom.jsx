import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Lock } from 'lucide-react';
import { fetchBadges, fetchUserBadges } from '../../lib/gamification';

const RARITY_CONFIG = {
  common: { color: '#C0C0C0', dim: 'rgba(192,192,192,0.11)', glow: 'rgba(192,192,192,0.28)', label: 'Common', icon: '\u2B1C' },
  rare: { color: '#6666ff', dim: 'rgba(102,102,255,0.13)', glow: 'rgba(102,102,255,0.38)', label: 'Rare', icon: '\uD83D\uDFE6' },
  legendary: { color: '#FFD700', dim: 'rgba(255,215,0,0.13)', glow: 'rgba(255,215,0,0.5)', label: 'Legendary', icon: '\u2B50' },
};

function getRarity(badge) {
  return badge?.rarity && RARITY_CONFIG[badge.rarity] ? badge.rarity : 'common';
}

function clampProgress(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(numberValue, 1));
}

export default function Level1TrophyRoom({ isOpen, onClose, userId }) {
  const [badges, setBadges] = useState([]);
  const [userBadgeMap, setUserBadgeMap] = useState({});
  const [loading, setLoading] = useState(true);

  const loadTrophyData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [allBadges, userBadges] = await Promise.all([
        fetchBadges('1-4'),
        fetchUserBadges(userId),
      ]);

      const map = {};
      for (const ub of userBadges) {
        const badgeId = ub.badge_id || ub.badge?.id;
        if (!badgeId) continue;
        map[badgeId] = {
          id: ub.id,
          progress: clampProgress(ub.progress),
          unlocked_at: ub.unlocked_at,
        };
      }

      setBadges(allBadges);
      setUserBadgeMap(map);
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

  const isUnlocked = (badge) => Boolean(userBadgeMap[badge.id]?.unlocked_at);
  const unlockedCount = badges.filter(isUnlocked).length;
  const overallPct = badges.length > 0 ? (unlockedCount / badges.length) * 100 : 0;

  const grouped = {
    common: badges.filter(b => getRarity(b) === 'common'),
    rare: badges.filter(b => getRarity(b) === 'rare'),
    legendary: badges.filter(b => getRarity(b) === 'legendary'),
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes legendaryPulse {
            0%, 100% { box-shadow: 0 0 12px rgba(255,215,0,0.20); border-color: rgba(255,215,0,0.35); }
            50% { box-shadow: 0 0 30px rgba(255,215,0,0.60); border-color: rgba(255,215,0,0.72); }
          }
          @keyframes legendaryCardShimmer {
            0%, 100% { box-shadow: 0 4px 20px rgba(255,215,0,0.05); }
            50% { box-shadow: 0 4px 28px rgba(255,215,0,0.18); }
          }
          .legendary-orb-locked { animation: legendaryPulse 2.6s ease-in-out infinite; }
          .legendary-card-locked { animation: legendaryCardShimmer 3s ease-in-out infinite; }
        `}} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-md" />

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
          <button onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors z-20"
          >
            <X size={17} />
          </button>

          <div className="flex-shrink-0 flex items-center gap-4 pb-4 mb-5 border-b border-white/8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD93D] to-[#FF9F1C] flex items-center justify-center shadow-lg shadow-yellow-500/25 flex-shrink-0">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-none">My Trophy Room</h2>
              <p className="text-white/40 text-[10px] font-extrabold uppercase tracking-widest mt-1.5">
                Grade 1{'\u2013'}4 Badges {'\uD83D\uDD16'}
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

              {/* Daily Reset Info Disclaimer */}
              <div 
                className="flex-shrink-0 p-3.5 rounded-2xl mb-5 flex items-start gap-3"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(249, 115, 22, 0.08))', 
                  border: '1.5px dashed rgba(249, 115, 22, 0.25)' 
                }}
              >
                <span className="text-lg leading-none select-none">⏰</span>
                <div>
                  <h5 className="text-[#f97316] font-extrabold text-[11px] uppercase tracking-wider leading-none">Daily Tasks System</h5>
                  <p className="text-white/60 text-[10px] font-semibold mt-1 leading-relaxed">
                    Every task progress resets to <strong className="text-white">0%</strong> at midnight. Complete <strong className="text-white">3 or more daily tasks</strong> today to maintain and grow your epic daily streak!
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-6 pb-2">
                {(['common', 'rare', 'legendary']).map(rarity => {
                  const group = grouped[rarity];
                  if (!group || group.length === 0) return null;
                  const rc = RARITY_CONFIG[rarity];

                  return (
                    <div key={rarity}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm" style={{ color: rc.color }}>{rc.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: rc.color }}>
                          {rc.label} Badges
                        </span>
                        <div className="flex-1 h-px" style={{ background: `${rc.color}20` }} />
                        <span className="text-[9px] font-black" style={{ color: `${rc.color}80` }}>
                          {group.filter(isUnlocked).length} / {group.length}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {group.map((badge, idx) => {
                          const ubData = userBadgeMap[badge.id];
                          const unlocked = Boolean(ubData?.unlocked_at);
                          const progress = unlocked ? 1 : clampProgress(ubData?.progress);
                          const pct = Math.round(progress * 100);
                          const partial = !unlocked && pct > 0;
                          const legendaryLocked = rarity === 'legendary' && !unlocked;

                          return (
                            <motion.div
                              key={badge.id}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                              whileHover={unlocked ? { y: -3, scale: 1.015 } : partial ? { scale: 1.005 } : {}}
                              className={`relative rounded-2xl p-4 flex flex-col gap-2.5 overflow-hidden border transition-all ${legendaryLocked ? 'legendary-card-locked' : ''}`}
                              style={{
                                background: unlocked
                                  ? `linear-gradient(135deg, ${rc.dim}, rgba(255,255,255,0.025))`
                                  : partial ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                                border: unlocked
                                  ? `1.5px solid ${rc.color}35`
                                  : legendaryLocked
                                    ? '1.5px solid rgba(255,215,0,0.25)'
                                    : partial ? `1px solid ${rc.color}18` : '1px solid rgba(255,255,255,0.06)',
                                boxShadow: unlocked ? `0 6px 22px ${rc.glow}18` : 'none',
                                opacity: !unlocked && !partial && rarity !== 'legendary' ? 0.62 : 1,
                              }}
                            >
                              {unlocked && (
                                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-22 pointer-events-none" style={{ background: rc.color }} />
                              )}

                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl border transition-all relative overflow-hidden ${legendaryLocked ? 'legendary-orb-locked' : ''}`}
                                  style={
                                    unlocked
                                      ? { background: `linear-gradient(135deg, ${rc.color}, ${rc.color}bb)`, border: `1px solid ${rc.color}50`, boxShadow: `0 4px 16px ${rc.color}40` }
                                      : legendaryLocked
                                        ? { background: 'rgba(255,215,0,0.07)', border: '1.5px solid rgba(255,215,0,0.35)' }
                                        : partial
                                          ? { background: `${rc.color}0e`, border: `1px solid ${rc.color}22` }
                                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                                  }
                                >
                                  {unlocked ? (
                                    <motion.span
                                      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.08, 1] }}
                                      transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                                    >
                                      {badge.icon_url}
                                    </motion.span>
                                  ) : legendaryLocked ? (
                                    <span style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>?</span>
                                  ) : partial ? (
                                    <span style={{ fontSize: '1.5rem', opacity: 0.45 }}>{badge.icon_url}</span>
                                  ) : (
                                    <Lock size={18} style={{ color: `${rc.color}60` }} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="font-black text-sm leading-tight"
                                      style={{ color: unlocked ? rc.color : legendaryLocked ? 'rgba(255,215,0,0.70)' : 'rgba(255,255,255,0.72)' }}>
                                      {badge.title}
                                    </h3>
                                    {unlocked && (
                                      <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 tracking-wider"
                                        style={{ background: `${rc.color}20`, border: `1px solid ${rc.color}40`, color: rc.color }}>
                                        Unlocked {'\u2713'}
                                      </span>
                                    )}
                                    {partial && (
                                      <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 tracking-wider bg-white/5 border border-white/10 text-white/35">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white/40 text-[10px] font-medium leading-relaxed">{badge.description}</p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold uppercase tracking-wider"
                                    style={{ color: unlocked ? rc.color : 'rgba(255,255,255,0.28)' }}>
                                    {unlocked ? 'Complete!' : partial ? 'In Progress' : 'Locked'}
                                  </span>
                                  <span className="text-[9px] font-black" style={{ color: unlocked ? rc.color : 'rgba(255,255,255,0.32)' }}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden border"
                                  style={{ background: 'rgba(0,0,0,0.38)', border: `1px solid ${unlocked ? rc.color + '28' : 'rgba(255,255,255,0.05)'}` }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.85, ease: 'easeOut', delay: idx * 0.05 }}
                                    className="h-full rounded-full"
                                    style={{
                                      background: unlocked
                                        ? `linear-gradient(90deg, ${rc.color}cc, ${rc.color})`
                                        : partial
                                          ? `linear-gradient(90deg, ${rc.color}48, ${rc.color}70)`
                                          : 'rgba(255,255,255,0.08)',
                                      boxShadow: unlocked ? `0 0 8px ${rc.color}70` : 'none',
                                    }}
                                  />
                                </div>
                              </div>

                              {!unlocked && (
                                <p className="text-[9px] font-medium leading-normal flex items-center gap-1"
                                  style={{ color: legendaryLocked ? 'rgba(255,215,0,0.28)' : 'rgba(255,255,255,0.22)' }}>
                                  <Lock size={8} style={{ flexShrink: 0, opacity: 0.6 }} />
                                  {badge.description || 'Keep playing to unlock this badge!'}
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
