import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PenLine, Camera, Calculator, Trophy,
  Star, Flame, ArrowLeft, ChevronRight,
  BookOpen, Zap
} from 'lucide-react';

// ─── Feature Cards Data ─────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'tracing',
    title: 'Alphabet Tracing',
    description: 'Write letters A-Z and get your accuracy checked!',
    emoji: '✏️',
    color: '#00D166',
    glow: 'rgba(0,209,102,0.25)',
    badge: 'A → Z',
    status: 'ready',
    path: '/level1/interactive-tracing',
  },
  {
    id: 'showandtell',
    title: 'Show & Tell',
    description: 'Upload a photo and discover amazing fun facts!',
    emoji: '📸',
    color: '#FF8AAE',
    glow: 'rgba(255,138,174,0.25)',
    badge: 'AI Powered',
    status: 'ready',
    path: '/level1/show-and-tell',
  },
  {
    id: 'math',
    title: 'Living Math',
    description: 'Drag emojis and learn addition the fun way!',
    emoji: '🔢',
    color: '#A29BFE',
    glow: 'rgba(162,155,254,0.25)',
    badge: 'Numbers',
    status: 'ready',
    path: '/level1/living-math',
  },
  {
    id: 'badges',
    title: 'My Badges',
    description: 'See all the stars and rewards you have earned!',
    emoji: '🏆',
    color: '#FFD93D',
    glow: 'rgba(255,217,61,0.25)',
    badge: 'Rewards',
    status: 'soon',
    path: null,
  },
];

// ─── Streak / Stats mock data ────────────────────────────────────────────────
const STATS = [
  { label: 'Day Streak', value: '3', icon: Flame, color: '#FF6B35' },
  { label: 'Stars Earned', value: '12', icon: Star, color: '#FFD93D' },
  { label: 'Letters Done', value: '8', icon: BookOpen, color: '#00D166' },
  { label: 'Best Score', value: '94%', icon: Zap, color: '#A29BFE' },
];

// ─── Feature Card Component ──────────────────────────────────────────────────
function FeatureCard({ feature, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={feature.status === 'ready' ? { scale: 1.03, y: -4 } : {}}
      onClick={() => feature.status === 'ready' && onClick(feature.path)}
      className={`relative rounded-3xl p-6 border flex flex-col gap-4 overflow-hidden
                  ${feature.status === 'ready'
                    ? 'cursor-pointer bg-white/3 border-white/8 hover:border-white/15'
                    : 'cursor-not-allowed bg-white/1 border-white/5 opacity-60'}`}
      style={{ boxShadow: feature.status === 'ready' ? `0 0 30px ${feature.glow}` : 'none' }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: feature.color }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: `${feature.color}18`, border: `1.5px solid ${feature.color}35` }}
        >
          {feature.emoji}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider"
            style={{ background: `${feature.color}20`, color: feature.color }}
          >
            {feature.badge}
          </span>
          {feature.status === 'soon' && (
            <span className="text-[9px] font-bold text-gray-500 tracking-widest uppercase">
              Coming Soon
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      <div>
        <h3 className="text-white font-black text-lg leading-tight">{feature.title}</h3>
        <p className="text-gray-500 text-sm mt-1 leading-snug">{feature.description}</p>
      </div>

      {/* CTA row */}
      {feature.status === 'ready' && (
        <div className="flex items-center gap-1 mt-auto" style={{ color: feature.color }}>
          <span className="text-sm font-bold">Let's go</span>
          <ChevronRight size={16} />
        </div>
      )}
    </motion.div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function Level1Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0f1e] flex font-['Outfit',sans-serif]">

      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <div className="w-[260px] flex-shrink-0 h-full bg-[#080d1a] border-r border-white/5
                      flex flex-col p-6 gap-6">

        {/* Back button */}
        <button
          onClick={() => navigate('/level1')}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold w-fit"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Avatar / Level badge */}
        <div className="flex flex-col items-center gap-3 py-6">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 rounded-3xl bg-[#00D166]/15 border border-[#00D166]/25
                       flex items-center justify-center text-4xl"
          >
            🧒
          </motion.div>
          <div className="text-center">
            <div className="text-white font-black text-base">Little Explorer</div>
            <div className="text-[#00D166] text-xs font-bold tracking-wider mt-0.5">
              Grade 1–4 • Level 1
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/3 border border-white/5"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}20` }}
              >
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 text-[10px] font-bold tracking-wider uppercase truncate">
                  {s.label}
                </div>
                <div className="text-white font-black text-sm">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily tip */}
        <div className="mt-auto p-4 rounded-2xl bg-[#00D166]/8 border border-[#00D166]/15">
          <p className="text-[#00D166] text-xs font-bold leading-relaxed">
            💡 Tip of the Day: <span className="text-white/70 font-normal">
              Practice writing "G" today — it's tricky but you got this!
            </span>
          </p>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col p-8 gap-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-white leading-tight">
              Hey Explorer! 👋
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Pick an activity and start learning today!
            </p>
          </div>

          {/* Streak pill */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/15 border border-orange-500/25 rounded-2xl"
          >
            <Flame size={18} className="text-orange-400" />
            <span className="text-orange-400 font-black text-sm">3 Day Streak!</span>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-5 flex-1">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={f.id}
              feature={f}
              index={i}
              onClick={(path) => navigate(path)}
            />
          ))}
        </div>

        {/* Footer progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-3xl bg-white/3 border border-white/6 flex items-center gap-5"
        >
          <Trophy size={28} className="text-[#FFD93D] flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-gray-400">Today's Progress</span>
              <span className="text-[#00D166]">2 / 3 activities done</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '66%' }}
                transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#00D166] to-[#00FF88] rounded-full"
              />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}