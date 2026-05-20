import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ChevronLeft, ArrowRight, Star, HelpCircle, Check } from 'lucide-react';
import { logActivity, updateStreak, checkForNewBadges } from '../../lib/gamification';
import { triggerBadgeCelebration } from '../Navigation/UnlockOverlay';
import { getStoredUserId } from '../../lib/useStudentProfile';
import { useNavigate } from 'react-router-dom';

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
  { emoji: '\u{1F431}', label: 'Cat'},
  { emoji: '\u{1F436}', label: 'Dog'},
  { emoji: '\u{1F405}', label: 'Lion'},
  { emoji: '\u{1F406}', label: 'Tiger'},
  { emoji: '\u{1F42F}', label: 'Rabbit'},
  { emoji: '\u{1F418}', label: 'Elephant'},
];

const CONFETTI = ['\u2B50', '\u{1F389}', '\u2728', '\u{1F4AB}', '\u{1F31F}'];

// ── Shared drag state (module-level refs — no re-renders during drag) ──────
let _ghostEl = null;
let _activeDragEmoji = null;
let _dropInto = null;   // Set once by the parent component — routes A/B correctly

function createGhost(emoji, x, y) {
  if (_ghostEl) _ghostEl.remove();
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed; left:${x - 28}px; top:${y - 28}px; z-index:9999;
    width:56px; height:56px; border-radius:14px; font-size:28px;
    display:flex; align-items:center; justify-content:center;
    background:rgba(255,255,255,0.15); backdrop-filter:blur(8px);
    border:2px solid rgba(255,255,255,0.3);
    pointer-events:none; user-select:none;
    transform:scale(1.25); opacity:0.92;
    transition:transform 0.1s;
  `;
  el.textContent = emoji;
  document.body.appendChild(el);
  _ghostEl = el;
}

function moveGhost(x, y) {
  if (_ghostEl) {
    _ghostEl.style.left = `${x - 28}px`;
    _ghostEl.style.top  = `${y - 28}px`;
  }
}

function removeGhost() {
  if (_ghostEl) { _ghostEl.remove(); _ghostEl = null; }
}

function DraggableItem({ emoji, label, onDragStart: notifyDrag }) {
  const handlePointerDown = (e) => {
    e.preventDefault();
    _activeDragEmoji = emoji;
    notifyDrag(emoji);
    const { clientX, clientY } = e.touches?.[0] ?? e;
    createGhost(emoji, clientX, clientY);

    const onMove = (ev) => {
      const { clientX: cx, clientY: cy } = ev.touches?.[0] ?? ev;
      moveGhost(cx, cy);
    };

    const onUp = (ev) => {
      const { clientX: cx, clientY: cy } = ev.changedTouches?.[0] ?? ev;
      removeGhost();
      // Find which drop box is under the finger/cursor and route correctly
      const el = document.elementFromPoint(cx, cy);
      const box = el?.closest('[data-dropbox]');
      if (box && _dropInto) {
        _dropInto(box.getAttribute('data-dropbox'));  // passes 'A' or 'B'
      }
      _activeDragEmoji = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onPointerDown={handlePointerDown}
      className="flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)' }}>
        {emoji}
      </div>
      <span className="text-white/35 text-[8px] md:text-[9px] font-bold">{label}</span>
    </motion.div>
  );
}

// DropBox no longer manages drop routing — data-dropbox attribute handles it
function DropBox({ color, shadow, items, letter, targetCount, op, subTarget, onItemClick }) {

  const isFilled = items.length === targetCount;
  const subtractedCount = items.filter(item => item.isSubtracted).length;
  const isSubMode = op === '-';

  let instruction = '';
  if (!isSubMode) {
    instruction = `Drag ${targetCount} items here!`;
  } else {
    if (items.length < targetCount) {
      instruction = `Drag ${targetCount} items here first!`;
    } else if (subtractedCount < subTarget) {
      instruction = `Click ${subTarget} items to subtract! (${subtractedCount} / ${subTarget})`;
    } else {
      instruction = `Nice! Count the remaining big items!`;
    }
  }

  return (
    <div
      data-dropbox={letter}
      className="relative flex flex-col rounded-2xl p-4 transition-all flex-1 select-none"
      style={{ 
        background: isFilled ? `${color}18` : `${color}06`, 
        border: isFilled ? `2.5px solid ${color}` : `2.5px dashed ${color}40`, 
        boxShadow: items.length > 0 ? `0 0 25px ${shadow}` : 'none', 
        minHeight: 0 
      }}
    >
      {/* Box Header Badge */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5"
        style={{ background: color, color: '#05070f' }}
      >
        <span>Box {letter}</span>
        <span className="bg-white/35 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
          {items.length} / {targetCount}
        </span>
      </div>

      {/* Guide Banner */}
      <div className="text-center mt-2 text-[10px] font-black tracking-wider uppercase text-white/40">
        {instruction}
      </div>

      {/* Inner playground */}
      <div className="flex flex-wrap gap-3.5 justify-center items-center mt-3.5 flex-1 overflow-y-auto no-scrollbar max-h-[160px] p-2">
        {items.length === 0 ? (
          <span className="text-white/15 text-xs font-bold py-8">Drop items here!</span>
        ) : (
          items.map((item, i) => {
            const isSub = isSubMode && item.isSubtracted;
            return (
              <motion.div 
                key={item.id}
                initial={{ scale: 0, rotate: -20 }} 
                animate={{ 
                  scale: isSub ? 0.65 : 1,
                  opacity: isSub ? 0.35 : 1,
                  rotate: isSub ? -10 : 0
                }}
                whileHover={isSubMode ? { scale: isSub ? 0.75 : 1.12 } : {}}
                whileTap={isSubMode ? { scale: 0.9 } : {}}
                onClick={() => isSubMode && onItemClick && onItemClick(i)}
                className={`relative w-12 h-12 flex items-center justify-center text-3xl select-none ${
                  isSubMode ? 'cursor-pointer' : ''
                }`}
              >
                <span className={isSub ? 'filter grayscale blur-[0.3px]' : ''}>
                  {item.emoji}
                </span>

                {/* Subtraction Cross Overlay */}
                {isSub && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none text-red-500 font-bold text-lg drop-shadow"
                  >
                    {'\u274C'}
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function LivingMath() {
  const navigate = useNavigate();

  // Question States
  const [currentQuestion, setCurrentQuestion] = useState({ n1: 0, n2: 0, op: '+', ans: 0 });
  const [options, setOptions] = useState([]);
  
  // Workspace States
  const [boxA, setBoxA] = useState([]);
  const [boxB, setBoxB] = useState([]);
  const [dragging, setDragging] = useState(null);
  
  // Game states
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Auto advance timer
  const [countdown, setCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);

  const clearAutoAdvance = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const startAutoAdvance = () => {
    clearAutoAdvance();
    setCountdown(4);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearAutoAdvance();
          generateQuestion();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Generate dynamic question
  const generateQuestion = () => {
    clearAutoAdvance();
    const isAddition = Math.random() > 0.45;
    let n1, n2, op, ans;

    if (isAddition) {
      n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
      n2 = Math.floor(Math.random() * 4) + 1; // 1 to 4
      op = '+';
      ans = n1 + n2;
    } else {
      n1 = Math.floor(Math.random() * 6) + 4; // 4 to 9
      n2 = Math.floor(Math.random() * (n1 - 1)) + 1; // 1 to n1-1
      op = '-';
      ans = n1 - n2;
    }

    // Generate 4 unique options including correct answer
    const opts = new Set([ans]);
    while (opts.size < 4) {
      const wrong = Math.max(1, ans + (Math.floor(Math.random() * 7) - 3));
      opts.add(wrong);
    }
    
    const shuffledOpts = Array.from(opts).sort(() => Math.random() - 0.5);

    setCurrentQuestion({ n1, n2, op, ans });
    setOptions(shuffledOpts);
    setBoxA([]);
    setBoxB([]);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  // Initialize
  useEffect(() => {
    generateQuestion();
    return () => clearAutoAdvance();
  }, []);

  const dropInto = (box) => {
    // Works with both mouse (dragging state) and touch (_activeDragEmoji ref)
    const emoji = dragging || _activeDragEmoji;
    if (!emoji) return;
    const newItem = { id: Date.now() + Math.random(), emoji, isSubtracted: false };
    
    if (box === 'A') {
      if (boxA.length < currentQuestion.n1) {
        setBoxA(p => [...p, newItem]);
      }
    } else {
      if (boxB.length < currentQuestion.n2) {
        setBoxB(p => [...p, newItem]);
      }
    }
    setDragging(null);
  };
  // Register dropInto so the pointer-up handler can call it for any box
  _dropInto = dropInto;

  // Click handler to subtract items (only in subtraction mode)
  const handleItemClick = (index) => {
    if (currentQuestion.op !== '-') return;
    setBoxA(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, isSubtracted: !item.isSubtracted };
      }
      return item;
    }));
  };

  // Verify option click
  const handleSelectAnswer = async (option) => {
    if (isCorrect) return; // Already answered
    
    setSelectedOption(option);
    const correct = option === currentQuestion.ans;
    setIsCorrect(correct);

    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      const userId = getStoredUserId();
      if (userId) {
        setSaving(true);
        await Promise.all([
          logActivity(userId, 'living_math', 100), 
          updateStreak(userId)
        ]);

        try {
          const { newlyUnlocked } = await checkForNewBadges(userId, '1-4');
          if (newlyUnlocked && newlyUnlocked.length > 0) {
            triggerBadgeCelebration(newlyUnlocked);
          }
        } catch (badgeErr) {
          console.warn('Error checking badges in LivingMath:', badgeErr);
        }

        setSaving(false);
      }
      
      startAutoAdvance();
    } else {
      // Clear incorrect state after 1.5 seconds to let them try again
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 1500);
    }
  };

  const handleResetWorkspace = () => {
    setBoxA([]);
    setBoxB([]);
  };

  const isSubMode = currentQuestion.op === '-';
  const subtractedCount = boxA.filter(item => item.isSubtracted).length;

  // Validation of workspace representation
  const modeledCorrectly = !isSubMode 
    ? (boxA.length === currentQuestion.n1 && boxB.length === currentQuestion.n2)
    : (boxA.length === currentQuestion.n1 && subtractedCount === currentQuestion.n2);

  return (
    <div
      className="font-sans relative flex flex-col select-none overflow-y-auto"
      style={{ width: '100vw', minHeight: '100dvh', background: 'linear-gradient(135deg,#0a0b10,#11172a,#08080f)' }}
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && Array.from({ length: 15 }).map((_, i) => (
          <motion.div key={i}
            className="fixed top-0 text-2xl pointer-events-none z-50 select-none"
            style={{ left: `${5 + i * 6.5}%` }}
            initial={{ opacity: 1, y: -10, scale: 0 }}
            animate={{ opacity: 0, y: '100vh', scale: 1.4, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2 + Math.random() * 1.3, delay: i * 0.08, ease: 'easeIn' }}
          >
            {CONFETTI[i % CONFETTI.length]}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Back button */}
      <div className="absolute left-4 top-4 z-50 cursor-pointer flex gap-2 items-center transition-all group" onClick={() => navigate(-1)}>
        <ChevronLeft className="text-white/60 group-hover:text-white transition-colors w-8 h-8 bg-white/5 rounded-xl border border-white/8 p-1" /> 
        <span className="text-white/60 group-hover:text-white font-bold text-sm transition-colors">Back</span>
      </div>

      {/* HEADER & TARGET EQUATION */}
      <div className="flex-shrink-0 text-center pt-4 pb-2 relative z-10 flex flex-col items-center px-4">
        <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <span>{'\u{1F522}'}</span> Living Math Playground
        </h1>
        <p className="text-white/45 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mt-0.5">
          Model the math with objects & select the answer!
        </p>

        {/* EQUATION DISPLAY */}
        <motion.div 
          layout
          className="mt-3 px-4 md:px-6 py-2 md:py-2.5 rounded-2xl border flex items-center gap-3 md:gap-4 bg-white/[0.02]"
          style={{ 
            borderColor: isCorrect ? '#FF9F1C' : 'rgba(255,255,255,0.08)',
            boxShadow: isCorrect ? '0 0 25px rgba(255,159,28,0.15)' : 'none'
          }}
        >
          <div className="text-2xl md:text-3xl font-black tracking-wider text-white">{currentQuestion.n1}</div>
          <div className="text-xl md:text-2xl font-black text-level-2">{currentQuestion.op}</div>
          <div className="text-2xl md:text-3xl font-black tracking-wider text-white">{currentQuestion.n2}</div>
          <div className="text-xl md:text-2xl font-black text-white/35">=</div>
          <div className="text-2xl md:text-3xl font-black tracking-widest text-[#FF9F1C] min-w-[28px]">
            {isCorrect ? currentQuestion.ans : '?'}
          </div>
        </motion.div>
      </div>

      {/* OBJECTS PALETTE */}
      <div className="px-4 py-2 relative z-10 w-full">
        <div className="max-w-fit mx-auto px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] shadow-inner w-full">
          <div className="grid grid-cols-7 md:flex md:justify-center gap-2 md:gap-3">
            {ITEMS.map((item, i) => (
              <DraggableItem key={i} emoji={item.emoji} label={item.label} onDragStart={setDragging} />
            ))}
          </div>
        </div>
      </div>

      {/* DYNAMIC WORKSPACE (Two-Box for Addition, Single-Box for Subtraction) */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4 px-4 md:px-6 py-2 relative z-10 max-w-4xl mx-auto w-full" style={{ minHeight: '200px' }}>
        {!isSubMode ? (
          /* ADDITION: TWO-BOXES */
          <>
            <DropBox 
              letter="A" 
              color="#FF9F1C" 
              shadow="rgba(255,159,28,0.2)"
              items={boxA} 
              targetCount={currentQuestion.n1}
              op={currentQuestion.op}
            />

            <div className="flex md:flex-col items-center justify-center gap-3 md:gap-1.5 flex-shrink-0 py-2 md:py-0 w-full md:w-14">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-lg md:text-xl font-bold">
                {currentQuestion.op}
              </div>
              <button
                onClick={handleResetWorkspace}
                className="py-1 px-3 md:p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 bg-white/[0.02] md:bg-transparent border border-white/5 md:border-0 transition-all text-[9px] md:text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
              >
                <RefreshCcw size={9} /> Reset
              </button>
            </div>

            <DropBox 
              letter="B" 
              color="#A29BFE" 
              shadow="rgba(162,155,254,0.2)"
              items={boxB} 
              targetCount={currentQuestion.n2}
              op={currentQuestion.op}
            />
          </>
        ) : (
          /* SUBTRACTION: SINGLE BOX WORKSPACE */
          <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 w-full">
            <DropBox 
              letter="A" 
              color="#FF8AAE" 
              shadow="rgba(255,138,174,0.25)"
              items={boxA} 
              targetCount={currentQuestion.n1}
              op={currentQuestion.op}
              subTarget={currentQuestion.n2}
              onItemClick={handleItemClick}
            />

            <div className="flex md:flex-col items-center justify-center gap-3 md:gap-4 flex-shrink-0 w-full md:w-24 p-2 md:p-0 bg-white/[0.01] md:bg-transparent rounded-2xl">
              <div className="py-2 px-4 md:p-3.5 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center flex md:flex-col items-center justify-center gap-1.5 md:gap-1 w-full">
                <div className="text-white/35 text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">Subtract</div>
                <div className="text-xl md:text-2xl font-black text-red-400">{currentQuestion.n2}</div>
              </div>

              <button
                onClick={handleResetWorkspace}
                className="py-2 px-4 rounded-xl text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-all text-[9px] md:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 w-full border border-white/5"
              >
                <RefreshCcw size={9} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ANSWERS MCQ GRID */}
      <div className="flex flex-col items-center gap-2 md:gap-3 px-4 md:px-6 pb-8 relative z-10 max-w-2xl mx-auto w-full">
        
        {/* Nudge Hint Banners */}
        <div className="text-center text-[11px] font-bold text-white/40 flex items-center gap-1">
          {modeledCorrectly ? (
            <span className="text-[#FF9F1C] flex items-center gap-1">
              🌟 Excellent modeling! Select the correct answer below:
            </span>
          ) : isSubMode ? (
            boxA.length < currentQuestion.n1 ? (
              <span className="flex items-center gap-1">
                <HelpCircle size={12} /> Step 1: Drag {currentQuestion.n1} objects into Box A.
              </span>
            ) : (
              <span className="flex items-center gap-1 text-level-2">
                🌟 Step 2: Click exactly {currentQuestion.n2} items in Box A to cross them out!
              </span>
            )
          ) : (
            <span className="flex items-center gap-1">
              <HelpCircle size={12} /> Drag objects to the boxes to help count the math problem.
            </span>
          )}
        </div>

        {/* Option buttons */}
        <div className="grid grid-cols-4 gap-4 w-full">
          {options.map((opt) => {
            const isSelected = selectedOption === opt;
            const isThisCorrect = isSelected && isCorrect;
            const isThisWrong = isSelected && isCorrect === false;

            return (
              <motion.button
                key={opt}
                whileHover={!isCorrect ? { scale: 1.06, y: -2 } : {}}
                whileTap={!isCorrect ? { scale: 0.94 } : {}}
                onClick={() => handleSelectAnswer(opt)}
                disabled={isCorrect !== null}
                className={`py-2.5 md:py-3.5 rounded-2xl text-xl md:text-2xl font-black transition-all border shadow-lg ${
                  isThisCorrect 
                    ? 'border-[#FF9F1C] bg-[#FF9F1C]/15 text-[#FF9F1C]' 
                    : isThisWrong 
                      ? 'border-red-500 bg-red-500/10 text-red-500 animate-shake' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* Correct/Incorrect Banner */}
        <AnimatePresence>
          {isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex items-center justify-between pt-3 rounded-2xl border"
              style={{
                background: isCorrect ? 'rgba(255, 159, 28, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: isCorrect ? 'rgba(255, 159, 28, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {isCorrect ? '\u2705' : '\u274C'}
                </span>
                <span className={`text-xs font-black uppercase tracking-wider ${
                  isCorrect ? 'text-[#FF9F1C]' : 'text-red-400'
                }`}>
                  {isCorrect 
                    ? "Fantastic work! +10 Points! \u{1F389}" 
                    : "Not quite. Try counting the items again! \u2728"
                  }
                </span>
              </div>

              {isCorrect && (
                <button
                  onClick={generateQuestion}
                  className="py-1.5 px-3.5 rounded-xl text-[10px] font-black text-white hover:brightness-110 flex items-center gap-1 transition-all"
                  style={{
                    background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)',
                    color: '#4a2c00'
                  }}
                >
                  {countdown !== null ? `Next (${countdown}s)` : 'Next'} <ArrowRight size={10} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
