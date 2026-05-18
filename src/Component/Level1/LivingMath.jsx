import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, CheckCircle2 } from 'lucide-react';
import { logActivity, updateStreak } from '../../lib/gamification';
import { getStoredUserId } from '../../lib/useStudentProfile';

// All emojis as Unicode escapes
const ITEMS = [
  { emoji: '\u{1F34E}', label: 'Apple' },
  { emoji: '\u{1F680}', label: 'Rocket' },
  { emoji: '\u2B50',    label: 'Star' },
  { emoji: '\u{1F438}', label: 'Frog' },
  { emoji: '\u{1F388}', label: 'Balloon' },
  { emoji: '\u{1F98B}', label: 'Butterfly' },
  { emoji: '\u{1F355}', label: 'Pizza' },
  { emoji: '\u{1F3C6}', label: 'Trophy' },
];

const CONFETTI = ['\u2B50','\u{1F389}','\u2728','\u{1F4AB}','\u{1F31F}'];

function DraggableItem({ emoji, label, onDrag }) {
  return (
    <motion.div
      whileHover={{ scale: 1.18, y: -3 }}
      whileTap={{ scale: 0.88 }}
      draggable
      onDragStart={() => onDrag(emoji)}
      className="flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)' }}>
        {emoji}
      </div>
      <span className="text-white/35 text-[9px] font-bold">{label}</span>
    </motion.div>
  );
}

function DropBox({ color, shadow, items, onDragOver, onDrop, letter }) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative flex flex-col rounded-2xl p-3 transition-all flex-1"
      style={{ background: `${color}10`, border: `2px dashed ${color}50`, boxShadow: items.length > 0 ? `0 0 20px ${shadow}` : 'none', minHeight: 0 }}
    >
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black"
        style={{ background: color, color: '#fff' }}>
        Box {letter} &mdash; {items.length}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center items-center mt-3 flex-1">
        {items.length === 0
          ? <span className="text-white/20 text-xs font-bold">Drop here!</span>
          : items.map((e, i) => (
              <motion.span key={i}
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-2xl"
              >{e}</motion.span>
            ))
        }
      </div>
    </div>
  );
}

export default function LivingMath() {
  const [boxA, setBoxA] = useState([]);
  const [boxB, setBoxB] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const sum = boxA.length + boxB.length;

  const dropInto = (box) => {
    if (!dragging) return;
    if (box === 'A') setBoxA(p => [...p, dragging]);
    else setBoxB(p => [...p, dragging]);
    setDragging(null);
    setResult(null);
  };

  const handleCount = async () => {
    setResult(sum);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    const userId = getStoredUserId();
    if (userId) {
      setSaving(true);
      await Promise.all([logActivity(userId, 'living_math', sum), updateStreak(userId)]);
      setSaving(false);
    }
  };

  const handleReset = () => { setBoxA([]); setBoxB([]); setResult(null); setShowConfetti(false); };

  const resultMsg = result === 0 ? 'Add some items first! \u{1F60A}'
    : result > 10 ? 'Wow, big numbers! \u{1F31F}'
    : result > 5  ? "Great counting! You're so smart! \u2B50"
    :               "Excellent! Math star! \u{1F389}";

  return (
    <div
      className="font-sans relative overflow-hidden flex flex-col"
      style={{ width: '100vw', height: '100dvh', background: 'linear-gradient(135deg,#1a0d2e,#0d1a2e,#1a0d1a)' }}
    >
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && Array.from({ length: 14 }).map((_, i) => (
          <motion.div key={i}
            className="fixed top-0 text-2xl pointer-events-none z-50 select-none"
            style={{ left: `${5 + i * 7}%` }}
            initial={{ opacity: 1, y: -10, scale: 0 }}
            animate={{ opacity: 0, y: '100vh', scale: 1.4, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 + Math.random() * 1.5, delay: i * 0.09, ease: 'easeIn' }}
          >
            {CONFETTI[i % 5]}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex-shrink-0 text-center pt-5 pb-2">
        <h1 className="text-3xl font-black text-white">{'\u{1F522}'} Living Math</h1>
        <p className="text-white/45 text-sm font-medium mt-0.5">
          Drag emojis into the boxes and count the total!
        </p>
      </div>

      {/* PALETTE */}
      <div className="flex-shrink-0 px-6 py-2">
        <div className="flex flex-wrap justify-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {ITEMS.map((item, i) => (
            <DraggableItem key={i} emoji={item.emoji} label={item.label} onDrag={setDragging} />
          ))}
        </div>
      </div>

      {/* DROP ZONES */}
      <div className="flex-1 flex items-stretch gap-4 px-6 pb-3 min-h-0">
        <DropBox letter="A" color="#00D166" shadow="rgba(0,209,102,0.3)"
          items={boxA} onDragOver={e => e.preventDefault()} onDrop={() => dropInto('A')} />

        <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 w-12">
          <span className="text-4xl font-black text-white">+</span>
          <span className="text-white/35 text-xs font-bold">{boxA.length}+{boxB.length}</span>
        </div>

        <DropBox letter="B" color="#A29BFE" shadow="rgba(162,155,254,0.3)"
          items={boxB} onDragOver={e => e.preventDefault()} onDrop={() => dropInto('B')} />
      </div>

      {/* ACTIONS + RESULT */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2 px-6 pb-5">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleCount}
            disabled={sum === 0 || saving}
            className="px-6 py-3 rounded-xl font-black text-base flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#00D166,#00FF88)', color: '#004d25', boxShadow: '0 4px 16px rgba(0,209,102,0.4)' }}
          >
            {saving
              ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>{'\u23F3'}</motion.span>
              : <><CheckCircle2 size={18} /> Count Them All!</>}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="p-3 rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <RefreshCcw size={18} />
          </motion.button>
        </div>

        <AnimatePresence>
          {result !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className="text-center"
            >
              <div className="text-5xl font-black" style={{ color: '#00D166' }}>= {result}</div>
              <p className="text-white/55 text-sm font-bold mt-1">{resultMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
