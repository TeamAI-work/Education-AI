import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, CheckCircle2 } from 'lucide-react';

// Simple drag-and-drop living math for 1-4 grade students
const ITEMS = ['🍎', '🚀', '⭐', '🐸', '🎈', '🦋', '🍕', '🏆'];

function MathItem({ emoji, id, onDrag }) {
  return (
    <motion.div
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      draggable
      onDragStart={() => onDrag(emoji)}
      className="text-4xl p-3 bg-white/5 rounded-2xl border border-white/10 cursor-grab active:cursor-grabbing select-none"
    >
      {emoji}
    </motion.div>
  );
}

export default function LivingMath() {
  const [boxA, setBoxA] = useState([]);
  const [boxB, setBoxB] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [result, setResult] = useState(null);

  const dropInto = (box) => {
    if (!dragging) return;
    if (box === 'A') setBoxA(prev => [...prev, dragging]);
    else setBoxB(prev => [...prev, dragging]);
    setDragging(null);
    setResult(null);
  };

  const sum = boxA.length + boxB.length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0f1e] flex flex-col items-center justify-center gap-8 p-8 font-['Outfit',sans-serif]">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white">🔢 Living Math</h1>
        <p className="text-gray-400 mt-1">Drag items into the boxes and count the total!</p>
      </div>

      {/* Item Palette */}
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {ITEMS.map((emoji, i) => (
          <MathItem key={i} emoji={emoji} id={i} onDrag={setDragging} />
        ))}
      </div>

      {/* Drop Zones */}
      <div className="flex items-center gap-8">
        {/* Box A */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={() => dropInto('A')}
          className="min-w-[140px] min-h-[140px] p-4 rounded-3xl border-2 border-dashed border-[#00D166]/40
                     bg-[#00D166]/5 flex flex-wrap gap-2 justify-center items-center transition-colors
                     hover:border-[#00D166]/70 hover:bg-[#00D166]/10"
        >
          {boxA.length === 0
            ? <span className="text-gray-600 text-sm font-bold">Drop here</span>
            : boxA.map((e, i) => <span key={i} className="text-3xl">{e}</span>)
          }
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-black text-white">+</span>
          <span className="text-gray-500 text-xs font-bold">{boxA.length} + {boxB.length}</span>
        </div>

        {/* Box B */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={() => dropInto('B')}
          className="min-w-[140px] min-h-[140px] p-4 rounded-3xl border-2 border-dashed border-purple-500/40
                     bg-purple-500/5 flex flex-wrap gap-2 justify-center items-center transition-colors
                     hover:border-purple-500/70 hover:bg-purple-500/10"
        >
          {boxB.length === 0
            ? <span className="text-gray-600 text-sm font-bold">Drop here</span>
            : boxB.map((e, i) => <span key={i} className="text-3xl">{e}</span>)
          }
        </div>
      </div>

      {/* Calculate */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setResult(sum)}
          disabled={sum === 0}
          className="px-8 py-3 bg-[#00D166] text-white font-black rounded-2xl
                     shadow-[0_0_20px_rgba(0,209,102,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="inline mr-2" size={20} />
          Count them all!
        </motion.button>
        <button
          onClick={() => { setBoxA([]); setBoxB([]); setResult(null); }}
          className="p-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      <AnimatePresence>
        {result !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="text-7xl font-black text-white">
              = <span className="text-[#00D166]">{result}</span>
            </div>
            <p className="text-gray-400 mt-1">
              {result > 10 ? "Wow, you can count big numbers! 🌟" : "Great counting! ⭐"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
