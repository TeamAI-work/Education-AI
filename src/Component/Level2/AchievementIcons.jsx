import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { fetchBadges, fetchUserBadges, getStreak } from '../../lib/gamification';
import { getStoredUserId } from '../../lib/useStudentProfile';
import { supabase } from '../../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Rarity config
// ---------------------------------------------------------------------------
const RARITY_CONFIG = {
  common:    { color: '#C0C0C0', dim: 'rgba(192,192,192,0.10)', glow: 'rgba(192,192,192,0.25)', label: 'Common' },
  rare:      { color: '#6666ff', dim: 'rgba(102,102,255,0.12)', glow: 'rgba(102,102,255,0.35)', label: 'Rare' },
  legendary: { color: '#FFD700', dim: 'rgba(255,215,0,0.12)',   glow: 'rgba(255,215,0,0.5)',   label: 'Legendary' },
};

function getRarity(badgeId) {
  const id = badgeId.toLowerCase();
  if (id.startsWith('58300000')) return 'legendary';
  if (id.startsWith('58200000')) return 'rare';
  return 'common';
}

// ---------------------------------------------------------------------------
// Progress mapping
// ---------------------------------------------------------------------------
function getProgressAndTarget(badge, stats) {
  const id = badge.id.toLowerCase();
  // Common
  if (id === '58100000-0000-0000-0000-000000000001') return { current: Math.min(stats.totalCount, 1),       target: 1,  hasBar: true };
  if (id === '58100000-0000-0000-0000-000000000002') return { current: Math.min(stats.queryCount, 1),       target: 1,  hasBar: true };
  if (id === '58100000-0000-0000-0000-000000000003') return { current: Math.min(stats.noteTotal, 1),        target: 1,  hasBar: true };
  if (id === '58100000-0000-0000-0000-000000000004') return { current: Math.min(stats.currentStreak, 2),    target: 2,  hasBar: true };
  // Rare
  if (id === '58200000-0000-0000-0000-000000000001') return { current: stats.currentStreak,                 target: 5,  hasBar: true };
  if (id === '58200000-0000-0000-0000-000000000002') return { current: stats.queryCount,                    target: 10, hasBar: true };
  if (id === '58200000-0000-0000-0000-000000000003') return { current: stats.noteTotal,                     target: 5,  hasBar: true };
  if (id === '58200000-0000-0000-0000-000000000004') return { current: stats.distinctSubjectCount,          target: 3,  hasBar: true };
  if (id === '58200000-0000-0000-0000-000000000005') return { current: 0,                                   target: 1,  hasBar: false };
  // Legendary
  if (id === '58300000-0000-0000-0000-000000000001') return { current: stats.noteEditCount,                 target: 3,  hasBar: true };
  if (id === '58300000-0000-0000-0000-000000000002') return { current: Math.min(stats.queryCount, 20),      target: 20, hasBar: true };
  if (id === '58300000-0000-0000-0000-000000000003') return { current: 0,                                   target: 1,  hasBar: false };
  return { current: 0, target: 1, hasBar: true };
}

// ---------------------------------------------------------------------------
// Lock hint mapping
// ---------------------------------------------------------------------------
function getLockHint(badgeId) {
  const id = badgeId.toLowerCase();
  if (id === '58100000-0000-0000-0000-000000000001') return 'Complete your first study session';
  if (id === '58100000-0000-0000-0000-000000000002') return 'Ask the AI chatbot your first question';
  if (id === '58100000-0000-0000-0000-000000000003') return 'Highlight text and save your first note';
  if (id === '58100000-0000-0000-0000-000000000004') return 'Visit your dashboard on 2 different days';
  if (id === '58200000-0000-0000-0000-000000000001') return 'Study 5 days in a row to earn this';
  if (id === '58200000-0000-0000-0000-000000000002') return 'Ask the AI 10 academic questions';
  if (id === '58200000-0000-0000-0000-000000000003') return 'Save 5 notes in your Digital Notebook';
  if (id === '58200000-0000-0000-0000-000000000004') return 'Ask about 3 different subjects (Space, Rome, Math, Plants...)';
  if (id === '58200000-0000-0000-0000-000000000005') return 'Do a note capture AND an AI query on the same day';
  if (id === '58300000-0000-0000-0000-000000000001') return 'Edit or annotate 3 of your saved notes';
  if (id === '58300000-0000-0000-0000-000000000002') return 'Reach 20 AI queries AND 10 saved notes';
  if (id === '58300000-0000-0000-0000-000000000003') return 'Do both a note and a query every day for 7 days in a row';
  return 'Keep studying to unlock!';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AchievementIcons() {
  const [badges,              setBadges]              = useState([]);
  const [unlockedIds,         setUnlockedIds]         = useState(new Set());
  const [loading,             setLoading]             = useState(true);
  const [currentStreak,       setCurrentStreak]       = useState(0);
  const [noteTotal,           setNoteTotal]           = useState(0);
  const [queryCount,          setQueryCount]          = useState(0);
  const [noteEditCount,       setNoteEditCount]       = useState(0);
  const [distinctSubjectCount,setDistinctSubjectCount]= useState(0);
  const [totalCount,          setTotalCount]          = useState(0);

  async function loadData() {
    const userId = getStoredUserId();
    if (!userId) { setLoading(false); return; }

    try {
      // Get user's grade group from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_group')
        .eq('id', userId)
        .single();

      const gradeGroup = profile?.grade_group || '5-8';

      const [
        allBadges,
        userBadges,
        streak,
        notesRes,
        queryRes,
        noteEditRes,
        subjectRes,
        totalRes,
      ] = await Promise.all([
        fetchBadges(gradeGroup),
        fetchUserBadges(userId),
        getStreak(userId),
        supabase.from('notebook_notes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('activity_type', 'rag_query'),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('activity_type', 'note_edit'),
        supabase.from('activity_logs').select('metadata').eq('user_id', userId).eq('activity_type', 'rag_query'),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setBadges(allBadges || []);
      setUnlockedIds(new Set((userBadges || []).map(b => b.badge_id)));
      setCurrentStreak(streak?.current_streak || 0);
      setNoteTotal(notesRes.count || 0);
      setQueryCount(queryRes.count || 0);
      setNoteEditCount(noteEditRes.count || 0);

      const subjects = new Set(
        (subjectRes.data || [])
          .map(row => row.metadata?.subject)
          .filter(Boolean)
      );
      setDistinctSubjectCount(subjects.size);
      setTotalCount(totalRes.count || 0);
    } catch (err) {
      console.error('[AchievementIcons] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('edu_ai_badge_unlocked', handler);
    return () => window.removeEventListener('edu_ai_badge_unlocked', handler);
  }, []);

  // Group badges by rarity
  const commonBadges    = badges.filter(b => getRarity(b.id) === 'common');
  const rareBadges      = badges.filter(b => getRarity(b.id) === 'rare');
  const legendaryBadges = badges.filter(b => getRarity(b.id) === 'legendary');

  const stats = { currentStreak, noteTotal, queryCount, noteEditCount, distinctSubjectCount, totalCount };

  // -------------------------------------------------------------------------
  // Badge card renderer
  // -------------------------------------------------------------------------
  function BadgeCard({ badge }) {
    const rarity   = getRarity(badge.id);
    const cfg      = RARITY_CONFIG[rarity];
    const unlocked = unlockedIds.has(badge.id);
    const { current, target, hasBar } = getProgressAndTarget(badge, stats);
    const pct        = Math.min(Math.round((current / target) * 100), 100);
    const inProgress = !unlocked && current > 0;
    const noneYet    = !unlocked && current === 0;

    // Card background / border
    let cardBg     = 'rgba(255,255,255,0.03)';
    let cardBorder = 'rgba(255,255,255,0.05)';
    let cardOpacity = 1;

    if (unlocked) {
      cardBg     = `linear-gradient(135deg, ${cfg.dim}, rgba(0,0,0,0.18))`;
      cardBorder = cfg.color + '4D'; // 30% opacity
    } else if (inProgress) {
      cardBg     = cfg.dim;
      cardBorder = 'rgba(255,255,255,0.08)';
    } else {
      cardOpacity = 0.55;
    }

    // Hover animation
    const hoverAnim = unlocked
      ? { y: -3, scale: 1.01 }
      : inProgress
        ? { scale: 1.005 }
        : {};

    // Icon orb
    function IconOrb() {
      const orbBase = {
        width: 44,
        height: 44,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '1.4rem',
        fontWeight: 900,
        position: 'relative',
        overflow: 'visible',
      };

      if (unlocked) {
        return (
          <div style={{
            ...orbBase,
            background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}55)`,
            border: `1.5px solid ${cfg.color}66`,
            boxShadow: `0 4px 14px ${cfg.glow}`,
          }}>
            <span style={{ fontSize: '1.35rem' }}>{badge.icon_url}</span>
          </div>
        );
      }

      if (rarity === 'legendary') {
        // Pulsing legendary orb with "?" symbol
        return (
          <div
            className="legendary-orb"
            style={{
              ...orbBase,
              background: 'rgba(255,215,0,0.08)',
              border: '1.5px solid rgba(255,215,0,0.35)',
              color: '#FFD700',
            }}
          >
            ?
          </div>
        );
      }

      // Rare / Common locked
      if (inProgress) {
        return (
          <div style={{
            ...orbBase,
            background: `${cfg.color}1A`,
            border: `1.5px solid ${cfg.color}40`,
          }}>
            <span style={{ fontSize: '1.35rem', opacity: 0.5 }}>{badge.icon_url}</span>
          </div>
        );
      }

      // Fully locked, no progress
      return (
        <div style={{
          ...orbBase,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Lock size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
      );
    }

    return (
      <motion.div
        whileHover={hoverAnim}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={{
          background:    cardBg,
          border:        `1px solid ${cardBorder}`,
          borderRadius:  14,
          padding:       '12px 13px',
          position:      'relative',
          overflow:      'hidden',
          opacity:       cardOpacity,
          cursor:        unlocked ? 'default' : 'default',
        }}
      >
        {/* Unlock glow blob */}
        {unlocked && (
          <div style={{
            position:     'absolute',
            top:          -18,
            right:        -18,
            width:        72,
            height:       72,
            borderRadius: '50%',
            background:   cfg.glow,
            filter:       'blur(22px)',
            pointerEvents:'none',
          }} />
        )}

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          {/* Left: orb + text */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
            <IconOrb />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize:     '0.78rem',
                fontWeight:   700,
                color:        unlocked ? '#f0f0f0' : 'rgba(255,255,255,0.65)',
                lineHeight:   1.25,
                marginBottom: 2,
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
              }}>
                {badge.title}
              </div>
              <div style={{
                fontSize:  '0.67rem',
                color:     'rgba(255,255,255,0.38)',
                lineHeight: 1.35,
              }}>
                {badge.description}
              </div>
            </div>
          </div>

          {/* Right: status chip */}
          {unlocked && (
            <div style={{
              flexShrink:   0,
              fontSize:     '0.6rem',
              fontWeight:   700,
              color:        cfg.color,
              background:   `${cfg.color}22`,
              border:       `1px solid ${cfg.color}44`,
              borderRadius: 99,
              padding:      '2px 7px',
              whiteSpace:   'nowrap',
              letterSpacing: '0.03em',
            }}>
              {cfg.label}
            </div>
          )}
          {inProgress && !unlocked && (
            <div style={{
              flexShrink:   0,
              fontSize:     '0.6rem',
              fontWeight:   600,
              color:        'rgba(255,255,255,0.35)',
              background:   'rgba(255,255,255,0.06)',
              border:       '1px solid rgba(255,255,255,0.10)',
              borderRadius: 99,
              padding:      '2px 7px',
              whiteSpace:   'nowrap',
            }}>
              In Progress
            </div>
          )}
        </div>

        {/* Progress bar */}
        {hasBar && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{
                fontSize:  '0.62rem',
                fontWeight: 600,
                color:     unlocked ? cfg.color : 'rgba(255,255,255,0.30)',
              }}>
                {unlocked ? 'Complete!' : 'Progress'}
              </span>
              <span style={{
                fontSize:  '0.62rem',
                fontWeight: 600,
                color:     unlocked ? cfg.color : 'rgba(255,255,255,0.30)',
              }}>
                {current} / {target}
              </span>
            </div>
            <div style={{
              height:       5,
              borderRadius: 99,
              background:   'rgba(0,0,0,0.35)',
              border:       '1px solid rgba(255,255,255,0.05)',
              overflow:     'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{
                  height:       '100%',
                  borderRadius: 99,
                  background:   unlocked
                    ? cfg.color
                    : inProgress
                      ? `${cfg.color}8C`
                      : 'rgba(255,255,255,0.12)',
                  boxShadow:    unlocked ? `0 0 8px ${cfg.glow}` : 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Lock hint */}
        {noneYet && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        4,
            marginTop:  9,
            color:      'rgba(255,255,255,0.20)',
            fontSize:   '0.62rem',
          }}>
            <Lock size={7} style={{ flexShrink: 0 }} />
            <span>{getLockHint(badge.id)}</span>
          </div>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------------------
  // Rarity section renderer
  // -------------------------------------------------------------------------
  function RaritySection({ label, items, cfg }) {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 18 }}>
        {/* Section header */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          marginBottom: 8,
        }}>
          <div style={{
            width:        3,
            height:       12,
            borderRadius: 99,
            background:   cfg.color,
            flexShrink:   0,
          }} />
          <span style={{
            fontSize:      '0.65rem',
            fontWeight:    700,
            color:         cfg.color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {cfg.label}
          </span>
          <span style={{
            fontSize:     '0.6rem',
            fontWeight:   600,
            color:        `${cfg.color}99`,
            background:   `${cfg.color}18`,
            border:       `1px solid ${cfg.color}33`,
            borderRadius: 99,
            padding:      '1px 6px',
          }}>
            {items.length}
          </span>
        </div>

        {/* Badge row list */}
        <div style={{
          display:             'flex',
          flexDirection:       'column',
          gap:                 10,
        }}>
          {items.map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="glass no-scrollbar rounded-3xl p-5 border border-white/10 flex flex-col h-full overflow-hidden relative select-none">

      {/* Corner glow blob */}
      <div style={{
        position:     'absolute',
        top:          -30,
        right:        -30,
        width:        130,
        height:       130,
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <div style={{
          width:        40,
          height:       40,
          borderRadius: 12,
          background:   'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(99,102,241,0.18))',
          border:       '1px solid rgba(99,102,241,0.40)',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          boxShadow:    '0 4px 16px rgba(99,102,241,0.25)',
          flexShrink:   0,
        }}>
          <Trophy size={18} style={{ color: '#a5b4fc' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
            Habit Achievements
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>
            Your study trophies
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.6rem', animation: 'spin 1s linear infinite' }}>
            {'\u2699\uFE0F'}
          </span>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}
        
        className='no-scrollbar'>
          {/* Legendary pulse keyframe */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes legendaryPulse {
              0%, 100% { box-shadow: 0 0 10px rgba(255,215,0,0.18); border-color: rgba(255,215,0,0.35); }
              50%       { box-shadow: 0 0 26px rgba(255,215,0,0.55); border-color: rgba(255,215,0,0.7); }
            }
            .legendary-orb { animation: legendaryPulse 2.5s ease-in-out infinite; }
          `}} />

          <RaritySection label="Common"    items={commonBadges}    cfg={RARITY_CONFIG.common} />
          <RaritySection label="Rare"      items={rareBadges}      cfg={RARITY_CONFIG.rare} />
          <RaritySection label="Legendary" items={legendaryBadges} cfg={RARITY_CONFIG.legendary} />
        </div>
      )}
    </div>
  );
}
