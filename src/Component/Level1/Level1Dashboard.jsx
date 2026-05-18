import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, BookOpen, Zap, Trophy, ChevronRight } from 'lucide-react';
import { useStudentProfile } from '../../lib/useStudentProfile';
import StudentOnboarding from './StudentOnboarding';

// All emojis as Unicode escapes — ASCII-safe, immune to encoding issues
const FEATURES = [
  {
    id: 'tracing',
    title: 'Alphabet Tracing',
    description: 'Write letters A\u2013Z and check your score!',
    emoji: '\u270F\uFE0F',
    bg: 'linear-gradient(135deg,#00D166,#00FF88)',
    shadow: 'rgba(0,209,102,0.4)',
    status: 'ready',
    path: '/level1/interactive-tracing',
    stars: '\u2B50\u2B50\u2B50',
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
    stars: '\u2B50\u2B50',
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
    stars: '\u2B50\u2B50\u2B50',
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
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <div className="text-white/40 text-[9px] font-bold uppercase tracking-wider">{label}</div>
        <div className="text-white font-black text-sm leading-none">{value}</div>
      </div>
    </div>
  );
}

export default function Level1Dashboard() {
  const navigate = useNavigate();
  const { profile, streak, stats, loading, needsOnboarding, createProfile, refetch } = useStudentProfile();

  useEffect(() => { refetch(); }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#1a0533,#0d1b4b,#0a2e1a)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="text-5xl">{'\u2B50'}</motion.div>
      </div>
    );
  }

  const activityPct = Math.min(((stats?.totalActivities ?? 0) / 3) * 100, 100);

  return (
    <>
      <AnimatePresence>
        {needsOnboarding && <StudentOnboarding onComplete={createProfile} />}
      </AnimatePresence>

      <div
        className="font-sans relative overflow-hidden flex"
        style={{ width: '100vw', height: '100dvh', background: 'linear-gradient(135deg,#1a0533,#0d1b4b 55%,#0a2e1a)' }}
      >
        {/* Floating decor — CSS only */}
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
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg,#00D166,#00FF88)', boxShadow: '0 0 20px rgba(0,209,102,0.35)', animation: 'bobSpin 3.5s ease-in-out infinite' }}
            >
              {profile?.avatar_url || '\u{1F9D2}'}
            </div>
            <div className="text-center">
              <div className="text-white font-black text-sm leading-tight">{profile?.full_name || 'Explorer'}</div>
              <div className="text-[10px] font-black px-2 py-0.5 rounded-full mt-1"
                style={{ background: 'linear-gradient(135deg,#00D166,#00FF88)', color: '#004d25' }}>
                Grade 1&ndash;4 {'\u{1F31F}'}
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="px-4">
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.18),rgba(255,140,0,0.08))', border: '1px solid rgba(255,107,53,0.3)', animation: 'pulseSlow 2.5s ease-in-out infinite' }}>
              <span className="text-2xl">{'\u{1F525}'}</span>
              <div>
                <div className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Day Streak</div>
                <div className="text-orange-400 font-black text-lg leading-none">{streak?.current_streak ?? 0} days!</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-2 px-4 mt-3">
            <StatPill icon={Star}     label="Stars Earned" value={stats?.totalActivities ?? 0}                    color="#FFD93D" />
            <StatPill icon={BookOpen} label="Letters Done" value={stats?.alphabetCount ?? 0}                      color="#00D166" />
            <StatPill icon={Zap}      label="Best Score"   value={stats?.bestScore ? `${stats.bestScore}%` : '—'} color="#A29BFE" />
          </div>

          {/* Progress */}
          <div className="px-4 mt-3">
            <div className="flex justify-between text-[9px] font-bold mb-1">
              <span className="text-white/40">Today&apos;s Progress</span>
              <span style={{ color: '#00D166' }}>{Math.min(stats?.totalActivities ?? 0, 3)}/3</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activityPct}%` }}
                transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#00D166,#00FF88,#FFD93D)' }}
              />
            </div>
          </div>

          {/* Tip */}
          <div className="px-4 mt-auto mb-4">
            <div className="p-3 rounded-xl text-xs"
              style={{ background: 'rgba(0,209,102,0.07)', border: '1px solid rgba(0,209,102,0.18)' }}>
              <span className="text-[#00D166] font-bold">{'\u{1F4A1}'} Tip: </span>
              <span className="text-white/50">Practice writing &quot;G&quot; today!</span>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col relative z-10 overflow-hidden p-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-shrink-0"
          >
            <div>
              <h1 className="text-3xl font-black text-white leading-tight">
                Hey {profile?.full_name?.split(' ')[0] || 'Explorer'}! {'\u{1F44B}'}
              </h1>
              <p className="text-white/45 text-sm font-medium mt-0.5">
                Pick an activity and let&apos;s have some fun! {'\u{1F389}'}
              </p>
            </div>
            <Trophy size={28} className="text-yellow-400 flex-shrink-0" />
          </motion.div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.id} feature={f} index={i} onClick={path => navigate(path)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}