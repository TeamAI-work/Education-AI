import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X } from 'lucide-react';

export default function UnlockOverlay() {
  const [queue, setQueue] = useState([]);
  const [currentBadge, setCurrentBadge] = useState(null);

  // Listen to the custom unlock event broadcasted by gamification.js or manually
  useEffect(() => {
    const handleUnlockEvent = (event) => {
      const badges = event.detail?.badges;
      if (badges && badges.length > 0) {
        setQueue((prev) => [...prev, ...badges]);
      }
    };

    window.addEventListener('edu_ai_badge_unlocked_event', handleUnlockEvent);
    return () => window.removeEventListener('edu_ai_badge_unlocked_event', handleUnlockEvent);
  }, []);

  // Monitor the queue and pull the next badge to display
  useEffect(() => {
    if (!currentBadge && queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      setCurrentBadge(next);
    }
  }, [queue, currentBadge]);

  const handleClose = () => {
    setCurrentBadge(null);
  };

  if (!currentBadge) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* CSS Scoped Style Tag for lightweight emoji particle stream animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes confettiFly {
            0% { transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-10vh) translateX(var(--drift)) scale(1.2) rotate(var(--spin)); opacity: 0; }
          }
          .particle-emoji {
            position: absolute;
            bottom: 0;
            font-size: 1.8rem;
            pointer-events: none;
            user-select: none;
            animation: confettiFly var(--duration) ease-out forwards;
          }
        `}} />

        {/* Darkened backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/65 backdrop-blur-xl"
          onClick={handleClose}
        />

        {/* Confetti Particle Layer (15 random items drifting up) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {Array.from({ length: 18 }).map((_, i) => {
            const drift = `${Math.floor(Math.random() * 260) - 130}px`;
            const spin = `${Math.floor(Math.random() * 720) - 360}deg`;
            const duration = `${3 + Math.random() * 2.5}s`;
            const left = `${10 + Math.random() * 80}%`;
            const delay = `${Math.random() * 1.5}s`;
            
            return (
              <span
                key={i}
                className="particle-emoji"
                style={{
                  '--drift': drift,
                  '--spin': spin,
                  '--duration': duration,
                  left,
                  animationDelay: delay,
                }}
              >
                {currentBadge.icon_url || '\u{2B50}'}
              </span>
            );
          })}
        </div>

        {/* Glassmorphic Trophy Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-[420px] rounded-[32px] p-8 text-center flex flex-col items-center gap-6 select-none z-20"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 64px rgba(102, 102, 255, 0.25), inset 0 0 32px rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(32px)',
          }}
        >
          {/* Close button top-right */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Radial Glowing Blob Layer */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 bg-[#6666ff] pointer-events-none" />

          {/* Top small tag */}
          <span className="text-[10px] font-black tracking-widest text-[#6666ff] uppercase bg-[#6666ff]/10 border border-[#6666ff]/20 px-3 py-1 rounded-full">
            Trophy Unlocked!
          </span>

          {/* Giant Unlocked Emoji */}
          <div className="relative mt-4">
            {/* Spinning/pulsing background glow circle */}
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ rotate: { repeat: Infinity, duration: 10, ease: 'linear' }, scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' } }}
              className="absolute inset-0 w-28 h-28 rounded-full blur-xl opacity-40 bg-gradient-to-tr from-[#6666ff] to-[#9f9fff]"
            />
            <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-[#6666ff] to-[#4d4dff] flex items-center justify-center text-6xl shadow-2xl relative z-10 border border-white/20">
              {currentBadge.icon_url}
            </div>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-2 mt-2">
            <h2 className="text-2xl font-black text-white leading-tight">
              {currentBadge.title}
            </h2>
            <p className="text-white/60 text-sm font-medium leading-relaxed px-2">
              {currentBadge.description}
            </p>
          </div>

          {/* Grade bracket label */}
          <span className="text-[9px] text-white/35 font-extrabold uppercase tracking-widest border border-white/5 bg-white/5 rounded-md px-2 py-1">
            Grade Group: {currentBadge.grade_group}
          </span>

          {/* CTA Awesome button with Framer Motion spring */}
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleClose}
            className="w-full py-4 rounded-2xl text-sm font-black text-[#0a0f1e] shadow-lg shadow-[#6666ff]/20 mt-4 transition-all"
            style={{
              background: 'linear-gradient(90deg, #6666ff, #8080ff)',
            }}
          >
            Awesome!
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Trigger function to easily trigger an unlock notification from anywhere.
 */
export function triggerBadgeCelebration(badges) {
  if (!badges || badges.length === 0) return;
  const event = new CustomEvent('edu_ai_badge_unlocked_event', { detail: { badges } });
  window.dispatchEvent(event);
}
