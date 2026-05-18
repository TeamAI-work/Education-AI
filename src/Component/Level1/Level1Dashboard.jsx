import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, BookOpen, Zap, Trophy, ChevronRight, PenTool } from 'lucide-react';
import { useStudentProfile } from '../../lib/useStudentProfile';
import StudentOnboarding from './StudentOnboarding';
import { getDailyLettersCount } from '../../lib/cookieUtils';

// All emojis as Unicode escapes — ASCII-safe, immune to encoding issues
const FEATURES = [
  {
    id: 'tracing',
    title: 'Alphabet Tracing',
    description: 'Write letters A\u2013Z and check your score!',
    emoji: '\u270F\uFE0F',
    bg: 'linear-gradient(135deg,#FF9F1C,#FFD93D)',
    shadow: 'rgba(255,159,28,0.4)',
    status: 'ready',
    path: '/level1/interactive-tracing',
  },
  {
    id: 'showandtell',
    title: 'Show & Tell',
    description: 'Upload a photo and discover fun facts!',
    emoji: '\u{1F4F8}',
    bg: 'linear-gradient(135deg,#FF8AAE,#FFB3C6)',
    shadow: 'rgba(255,138,174,0.4)',
    status: 'ready',
    path: '/level1/show-and-tell',
  },
  {
    id: 'math',
    title: 'Living Math',
    description: 'Drag emojis into boxes and count!',
    emoji: '\u{1F522}',
    bg: 'linear-gradient(135deg,#A29BFE,#C3B5FF)',
    shadow: 'rgba(162,155,254,0.4)',
    status: 'ready',
    path: '/level1/living-math',
  },
  {
    id: 'badges',
    title: 'My Trophy Room',
    description: 'See all your earned badges!',
    emoji: '\u{1F3C6}',
    bg: 'linear-gradient(135deg,#FFD93D,#FFEC85)',
    shadow: 'rgba(255,217,61,0.4)',
    status: 'soon',
    path: null,
    stars: '\u{1F512}',
  },
];

const FLOATERS = [
  { e: '\u2B50',     l: 4,  t: 8  },
  { e: '\u{1F308}',  l: 17, t: 72 },
  { e: '\u{1F388}',  l: 33, t: 10 },
  { e: '\u{1F4AB}',  l: 50, t: 80 },
  { e: '\u{1F31F}',  l: 65, t: 5  },
  { e: '\u{1F389}',  l: 78, t: 68 },
  { e: '\u{1F98B}',  l: 89, t: 15 },
  { e: '\u{1F338}',  l: 94, t: 58 },
];

function FeatureCard({ feature, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={feature.status === 'ready' ? { scale: 1.03, y: -5 } : {}}
      whileTap={feature.status === 'ready' ? { scale: 0.97 } : {}}
      onClick={() => feature.status === 'ready' && onClick(feature.path)}
      className="relative rounded-3xl p-5 flex flex-col gap-3 overflow-hidden select-none h-full"
      style={{
        background: feature.status === 'ready' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        cursor: feature.status === 'ready' ? 'pointer' : 'not-allowed',
        boxShadow: feature.status === 'ready' ? `0 8px 28px ${feature.shadow}` : 'none',
        opacity: feature.status === 'soon' ? 0.55 : 1,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Glow blob */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: feature.bg }} />

      {/* Emoji */}
      <div
        className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl text-4xl"
        style={{
          background: feature.status === 'ready' ? feature.bg : 'rgba(255,255,255,0.08)',
          boxShadow: feature.status === 'ready' ? `0 4px 18px ${feature.shadow}` : 'none',
          animation: feature.status === 'ready' ? `bobSpin ${2.5 + index * 0.3}s ease-in-out infinite` : 'none',
        }}
      >
        {feature.emoji}
      </div>

      {/* Text */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-black text-xl leading-tight">{feature.title}</h3>
          {feature.status === 'soon' && (
            <span className="text-[9px] bg-white/10 text-white/40 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
              Soon
            </span>
          )}
        </div>
        <p className="text-white/55 text-sm font-medium leading-snug">{feature.description}</p>
        <div className="text-base mt-1">{feature.stars}</div>
      </div>

      {/* CTA */}
      {feature.status === 'ready' && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-black text-white"
          style={{ background: feature.bg, boxShadow: `0 2px 12px ${feature.shadow}` }}
        >
          Play Now <ChevronRight size={14} />
        </div>
      )}
    </motion.div>
  );
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl flex-shrink-0"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <div className="w-5.5 h-5.5 md:w-7 md:h-7 rounded md:rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}>
        <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" style={{ color }} />
      </div>
      <div>
        <div className="text-white/40 text-[7px] md:text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5">{label}</div>
        <div className="text-white font-black text-xs md:text-sm leading-none">{value}</div>
      </div>
    </div>
  );
}

export default function Level1Dashboard() {
  const navigate = useNavigate();
  const { profile, streak, stats, loading, needsOnboarding, createProfile, refetch } = useStudentProfile();
  const dailyLettersCount = getDailyLettersCount();

  useEffect(() => { refetch(); }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#1a0533,#0d1b4b,#0a2e1a)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="text-5xl">⭐</motion.div>
      </div>
    );
  }

  const activityPct = Math.min(((stats?.totalActivities ?? 0) / 3) * 100, 100);

  return (
    <>
      <AnimatePresence>
        {needsOnboarding && <StudentOnboarding onComplete={createProfile} />}
      </AnimatePresence>

      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      <div
        className="md:hidden font-sans relative overflow-y-auto"
        style={{ width: '100vw', minHeight: '100dvh', background: 'linear-gradient(135deg,#1a0533,#0d1b4b 55%,#0a2e1a)' }}
      >
        {/* Floating decor */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {FLOATERS.map((f, i) => (
            <div key={i} className="absolute text-xl select-none"
              style={{ left: `${f.l}%`, top: `${f.t}%`, opacity: 0.08,
                animation: `floatBob ${4 + i * 0.5}s ease-in-out ${i * 0.4}s infinite` }}>
              {f.e}
            </div>
          ))}
        </div>

        {/* ── TOPBAR ── */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-3"
          style={{ background: 'rgba(15,12,30,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)', boxShadow: '0 0 14px rgba(255,159,28,0.3)' }}>
              {profile?.avatar_url || '🧒'}
            </div>

            {/* Name + grade */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-sm leading-tight truncate">
                {profile?.full_name?.split(' ')[0] || 'Explorer'}
              </div>
              <div className="text-[9px] font-black px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                style={{ background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)', color: '#4a2c00' }}>
                Grade 1–4 🌟
              </div>
            </div>

            {/* Streak badge */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)' }}>
              <span className="text-base">🔥</span>
              <div>
                <div className="text-white/40 text-[7px] font-bold uppercase leading-none">Streak</div>
                <div className="text-orange-400 font-black text-xs leading-none">{streak?.current_streak ?? 0}d</div>
              </div>
            </div>

            {/* Lock button */}
            <button onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white/5 border border-white/10 flex-shrink-0">
              🔒
            </button>
          </div>

          {/* Stats row */}
          <div className="flex gap-2 mt-3">
            {[
              { icon: Star, label: 'Stars', value: stats?.totalActivities ?? 0, color: '#FFD93D' },
              { icon: PenTool, label: 'Letters', value: dailyLettersCount, color: '#FF9F1C' },
              { icon: Zap, label: 'Best', value: stats?.bestScore ? `${stats.bestScore}%` : '—', color: '#A29BFE' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex-1 flex items-center gap-1.5 px-2.5 py-2 rounded-xl"
                style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                <div>
                  <div className="text-[7px] font-bold uppercase tracking-wide leading-none" style={{ color: `${color}99` }}>{label}</div>
                  <div className="text-white font-black text-xs leading-tight">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {/* <div className="mt-2.5">
            <div className="flex justify-between text-[9px] font-bold mb-1">
              <span className="text-white/35">Today's Progress</span>
              <span style={{ color: '#FF9F1C' }}>{Math.min(stats?.totalActivities ?? 0, 3)}/3</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activityPct}%` }}
                transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#FF9F1C,#FFD93D)' }}
              />
            </div>
          </div> */}
        </div>

        {/* ── GREETING ── */}
        <div className="px-4 pt-5 pb-3 relative z-10">
          <h1 className="text-2xl font-black text-white leading-tight">
            Hey {profile?.full_name?.split(' ')[0] || 'Explorer'}! 👋
          </h1>
          <p className="text-white/45 text-xs font-medium mt-0.5">
            Pick an activity and let's have some fun! 🎉
          </p>
        </div>

        {/* ── ACTIVITY CARDS ── */}
        <div className="px-4 pb-8 pt-2 grid grid-cols-2 gap-3 relative z-10" style={{ isolation: 'isolate' }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.id} feature={f} index={i} onClick={path => navigate(path)} />
          ))}
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (≥ md) ─────────────────────────────── */}
      <div
        className="hidden md:flex font-sans relative overflow-hidden flex-row"
        style={{ width: '100vw', height: '100dvh', background: 'linear-gradient(135deg,#1a0533,#0d1b4b 55%,#0a2e1a)' }}
      >
        {/* Floating decor */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {FLOATERS.map((f, i) => (
            <div key={i} className="absolute text-xl select-none"
              style={{ left: `${f.l}%`, top: `${f.t}%`, opacity: 0.1,
                animation: `floatBob ${4 + i * 0.5}s ease-in-out ${i * 0.4}s infinite` }}>
              {f.e}
            </div>
          ))}
        </div>

        {/* SIDEBAR */}
        <div
          className="w-[240px] flex-shrink-0 h-full flex flex-col relative z-10"
          style={{ background: 'rgba(255,255,255,0.04)', borderRight: '1.5px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
        >
          <div className="px-5 pt-4 pb-2">
            <button onClick={() => navigate('/level1')}
              className="text-white/40 hover:text-white/80 transition-colors text-xs font-bold">
              &larr; Back
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 py-3 px-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)', boxShadow: '0 0 20px rgba(255,159,28,0.35)', animation: 'bobSpin 3.5s ease-in-out infinite' }}>
              {profile?.avatar_url || '🧒'}
            </div>
            <div className="text-center">
              <div className="text-white font-black text-sm leading-tight">{profile?.full_name || 'Explorer'}</div>
              <div className="text-[10px] font-black px-2 py-0.5 rounded-full mt-1"
                style={{ background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)', color: '#4a2c00' }}>
                Grade 1&ndash;4 🌟
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="px-4">
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.18),rgba(255,140,0,0.08))', border: '1px solid rgba(255,107,53,0.3)', animation: 'pulseSlow 2.5s ease-in-out infinite' }}>
              <span className="text-2xl">🔥</span>
              <div>
                <div className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Day Streak</div>
                <div className="text-orange-400 font-black text-lg leading-none">{streak?.current_streak ?? 0} days!</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-2 px-4 mt-3">
            <StatPill icon={Star}    label="Stars Earned"  value={stats?.totalActivities ?? 0}                    color="#FFD93D" />
            <StatPill icon={PenTool} label="Letters Today" value={dailyLettersCount}                               color="#FF9F1C" />
            <StatPill icon={Zap}     label="Best Score"    value={stats?.bestScore ? `${stats.bestScore}%` : '—'} color="#A29BFE" />
          </div>

          {/* Progress */}
          <div className="px-4 mt-3">
            <div className="flex justify-between text-[9px] font-bold mb-1">
              <span className="text-white/40">Today's Progress</span>
              <span style={{ color: '#FF9F1C' }}>{Math.min(stats?.totalActivities ?? 0, 3)}/3</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activityPct}%` }}
                transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#FF9F1C,#FFD93D,#FF8C00)' }}
              />
            </div>
          </div>

          {/* Tip */}
          <div className="px-4 mt-auto mb-3">
            <div className="p-3 rounded-xl text-xs"
              style={{ background: 'rgba(255,159,28,0.07)', border: '1px solid rgba(255,159,28,0.18)' }}>
              <span className="text-[#FF9F1C] font-bold">💡 Tip: </span>
              <span className="text-white/50">Practice writing "G" today!</span>
            </div>
          </div>

          {/* Parent Settings */}
          <div className="px-4 mb-4">
            <button onClick={() => navigate('/settings')}
              className="w-full py-2.5 rounded-xl text-xs font-black text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 transition-all flex items-center justify-center gap-1.5">
              <span>🔒</span> Parent Settings
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col relative z-10 p-5 gap-4" style={{ overflow: 'visible' }}>
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-shrink-0"
          >
            <div>
              <h1 className="text-3xl font-black text-white leading-tight">
                Hey {profile?.full_name?.split(' ')[0] || 'Explorer'}! 👋
              </h1>
              <p className="text-white/45 text-sm font-medium mt-0.5">
                Pick an activity and let's have some fun! 🎉
              </p>
            </div>
            <Trophy size={28} className="text-yellow-400 flex-shrink-0" />
          </motion.div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 pb-4 pt-2 px-1" style={{ overflow: 'visible' }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.id} feature={f} index={i} onClick={path => navigate(path)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
