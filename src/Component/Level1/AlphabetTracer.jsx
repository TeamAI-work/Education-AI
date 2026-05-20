import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ChevronLeft, ChevronRight, Star, RotateCcw } from 'lucide-react';
import { LETTER_PATHS, alphabet } from '../../data/letterPaths';
import { logActivity, updateStreak, checkForNewBadges } from '../../lib/gamification';
import { triggerBadgeCelebration } from '../Navigation/UnlockOverlay';
import { getStoredUserId } from '../../lib/useStudentProfile';
import { useNavigate } from 'react-router-dom';
import { incrementDailyLetters } from '../../lib/cookieUtils';

const CANVAS_SIZE = 300;
const PATH_TOLERANCE = 22;

function samplePath(pathEl, count = 80) {
  const len = pathEl.getTotalLength();
  const points = [];
  for (let i = 0; i <= count; i++) {
    const p = pathEl.getPointAtLength((i / count) * len);
    points.push({ x: p.x, y: p.y });
  }
  return points;
}

function minDistToPath(px, py, points) {
  let minDist = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const ax = points[i].x, ay = points[i].y;
    const bx = points[i+1].x, by = points[i+1].y;
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx*dx + dy*dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / lenSq));
    const d = Math.hypot(px - (ax + t*dx), py - (ay + t*dy));
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Confetti particle - uses Unicode escapes to avoid encoding issues
const CONFETTI_EMOJIS = ['\u2B50', '\u{1F31F}', '\u2728', '\u{1F389}', '\u{1F38A}', '\u{1F4AB}', '\u{1F3C6}', '\u{1F308}'];

function ConfettiParticle({ delay }) {
  const emoji = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];
  const startX = Math.random() * 100;
  return (
    <motion.div
      initial={{ opacity: 1, y: -20, x: `${startX}vw`, scale: 0 }}
      animate={{ opacity: 0, y: '100vh', scale: 1.5, rotate: 360 }}
      transition={{ duration: 2.5 + Math.random() * 1.5, delay, ease: 'easeIn' }}
      className="fixed top-0 text-3xl pointer-events-none z-50 select-none"
    >
      {emoji}
    </motion.div>
  );
}

export default function AlphabetTracer() {
  const navigate = useNavigate()

  const canvasRef      = useRef(null);
  const svgRef         = useRef(null);
  const boundaryRef    = useRef(null);
  const drawnPoints    = useRef([]);
  // Perf: cache expensive computations in refs
  const refPointsCache = useRef([]);   // sampled guide points, computed once per letter
  const canvasRect     = useRef(null); // cached getBoundingClientRect
  const drawCount      = useRef(0);    // throttle progress updates

  const [isDrawing, setIsDrawing]       = useState(false);
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [result, setResult]             = useState(null);
  const [progress, setProgress]         = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [countdown, setCountdown]       = useState(null);

  const countdownIntervalRef = useRef(null);

  const letter     = alphabet[currentIdx];
  const letterData = LETTER_PATHS[letter];

  // Build boundary mask + cache ref points once per letter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!svgRef.current) return;
      const mask = document.createElement('canvas');
      mask.width  = CANVAS_SIZE;
      mask.height = CANVAS_SIZE;
      const mCtx = mask.getContext('2d');
      mCtx.lineCap = 'round'; mCtx.lineJoin = 'round';
      const paths = svgRef.current.querySelectorAll('path[data-guide]');
      paths.forEach(p => {
        mCtx.lineWidth = 55;
        mCtx.strokeStyle = 'white';
        mCtx.stroke(new Path2D(p.getAttribute('d')));
      });
      boundaryRef.current = mCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
      // Cache ref points - computed ONCE per letter
      let all = [];
      paths.forEach(p => { all = all.concat(samplePath(p, 80)); });
      refPointsCache.current = all;
      canvasRect.current = null;
    }, 50);
    return () => clearTimeout(timer);
  }, [currentIdx]);

  // Reset canvas on letter change
  useEffect(() => {
    clearAutoAdvance();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.lineWidth   = 18;
    ctx.strokeStyle = '#FF9F1C';
    ctx.shadowColor = '#FFD93D';
    ctx.shadowBlur  = 8;
    clearCanvas();
    drawnPoints.current = [];
    setResult(null);
    setProgress(0);
    setShowConfetti(false);
  }, [currentIdx]);

  const isInsideBoundary = (x, y) => {
    const mask = boundaryRef.current;
    if (!mask) return true;
    const px = Math.round(x), py = Math.round(y);
    if (px < 0 || py < 0 || px >= CANVAS_SIZE || py >= CANVAS_SIZE) return false;
    return mask[(py * CANVAS_SIZE + px) * 4 + 3] > 0;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  };

  const clearAutoAdvance = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const startAutoAdvance = () => {
    clearAutoAdvance();
    let secondsLeft = 5;
    setCountdown(secondsLeft);

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        setCountdown(secondsLeft);
      } else {
        clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        setCurrentIdx(prev => (prev + 1) % alphabet.length);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const resetAll = () => {
    clearAutoAdvance();
    clearCanvas();
    drawnPoints.current = [];
    setResult(null);
    setProgress(0);
    setShowConfetti(false);
  };

  // Cache rect - only recalculate on stroke start or resize
  const getPos = (e) => {
    if (!canvasRect.current) {
      canvasRect.current = canvasRef.current.getBoundingClientRect();
    }
    const rect  = canvasRect.current;
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    clearAutoAdvance();
    canvasRect.current = canvasRef.current.getBoundingClientRect();
    drawCount.current = 0;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(x, y);
    drawnPoints.current.push({ x, y });
    setIsDrawing(true); setResult(null);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    if (isInsideBoundary(x, y)) {
      ctx.lineTo(x, y); ctx.stroke();
      drawnPoints.current.push({ x, y });
    } else {
      ctx.beginPath(); ctx.moveTo(x, y);
    }
    // Throttle: recalculate progress every 8 points
    drawCount.current++;
    if (drawCount.current % 8 === 0) {
      const refPoints = refPointsCache.current;
      if (refPoints.length > 0) {
        const pts = drawnPoints.current;
        let covered = 0;
        for (const rp of refPoints) {
          for (const dp of pts) {
            if (Math.hypot(dp.x - rp.x, dp.y - rp.y) < PATH_TOLERANCE) { covered++; break; }
          }
        }
        setProgress(Math.min(100, Math.round((covered / refPoints.length) * 100)));
      }
    }
  };

  const stopDraw = (e) => {
    e?.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current.getContext('2d').closePath();
  };

  const checkAccuracy = async () => {
    const refPoints = refPointsCache.current;
    if (refPoints.length === 0 || drawnPoints.current.length === 0) return;

    const pts = drawnPoints.current;
    let covered = 0;
    for (const rp of refPoints) {
      for (const dp of pts) {
        if (Math.hypot(dp.x - rp.x, dp.y - rp.y) < PATH_TOLERANCE) { covered++; break; }
      }
    }
    const coverage = covered / refPoints.length;

    let onPath = 0;
    for (const dp of pts) {
      if (minDistToPath(dp.x, dp.y, refPoints) < PATH_TOLERANCE) onPath++;
    }
    const precision = pts.length > 0 ? onPath / pts.length : 0;
    const score = Math.round((coverage * 0.7 + precision * 0.3) * 100);

    let label = 'Keep Practising!';
    let emoji = '\u{1F4AA}'; // flexed bicep
    if      (score >= 80) { label = "Amazing! You're a Star!";  emoji = '\u{1F31F}'; }
    else if (score >= 60) { label = 'Great Job! Keep Going!';   emoji = '\u2B50'; }
    else if (score >= 40) { label = 'Nice Try! You Can Do It!'; emoji = '\u{1F4AA}'; }

    setResult({ score, label, emoji });
    if (score >= 60) {
      setShowConfetti(true);
      incrementDailyLetters(letter);
    }
    startAutoAdvance();

    const userId = getStoredUserId();
    if (userId) {
      setSaving(true);
      await Promise.all([
        logActivity(userId, 'alphabet_tracing', score, { letter }),
        updateStreak(userId),
      ]);

      try {
        const { newlyUnlocked } = await checkForNewBadges(userId, '1-4');
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          triggerBadgeCelebration(newlyUnlocked);
        }
      } catch (badgeErr) {
        console.warn('Error checking badges in AlphabetTracer:', badgeErr);
      }

      setSaving(false);
    }
  };

  const allStrokes = letterData.strokes.join(' ');
  const scoreColor = result
    ? result.score >= 80 ? '#FF9F1C'
      : result.score >= 60 ? '#FFD93D'
      : result.score >= 40 ? '#FF8AAE'
      : '#A29BFE'
    : '#FF9F1C';

  return (
    <div
      className="font-['Outfit',sans-serif] relative overflow-x-hidden overflow-y-auto md:overflow-hidden flex flex-col md:flex-row"
      style={{ width: '100vw', minHeight: '100dvh', height: '100dvh', background: 'linear-gradient(135deg,#0d2b1a,#1a0d2e,#0a1a2e)' }}
    >
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && Array.from({ length: 20 }).map((_, i) => (
          <ConfettiParticle key={i} delay={i * 0.08} />
        ))}
      </AnimatePresence>

      <div className='absolute left-4 top-4 z-50 cursor-pointer flex gap-1 items-center transition-all' onClick={() => navigate(-1)}>
        <ChevronLeft className='text-white w-8 h-8 md:w-10 md:h-10 ' /> 
        <span className='text-white text-base md:text-xl hover:text-[#FF9F1C] transition-all font-bold'>Back</span>
      </div>

      {/* LEFT: Drawing Canvas */}
      <div
        className="relative w-full md:flex-[65] md:h-full flex items-center justify-center pt-16 md:pt-0 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-white/5"
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle,#FF9F1C,transparent)' }} />
        </div>

        {/* Letter badge */}
        <motion.div
          key={letter}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 md:px-6 md:py-2 rounded-full font-black text-2xl md:text-4xl"
          style={{
            background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)',
            boxShadow: '0 4px 20px rgba(255,159,28,0.5)',
            color: '#4a2c00',
          }}
        >
          {letter}
        </motion.div>

        <div className="relative w-[min(70vw,280px)] md:w-[min(55vw,500px)] aspect-square">
          {/* SVG Guide */}
          <svg ref={svgRef}
            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
            className="absolute inset-0 w-full h-full rounded-3xl"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width={CANVAS_SIZE} height={CANVAS_SIZE} rx="24"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            {/* Ghost fill */}
            <path d={allStrokes} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth="60"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Dashed guide */}
            <path d={allStrokes} data-guide="true" fill="none"
              stroke="rgba(0,209,102,0.35)" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="10 8" />
            {/* Start dots */}
            {letterData.strokes.map((stroke, i) => {
              const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              tempPath.setAttribute('d', stroke);
              document.body.appendChild(tempPath);
              const startPt = tempPath.getPointAtLength(0);
              document.body.removeChild(tempPath);
              return (
                <g key={i}>
                  <circle cx={startPt.x} cy={startPt.y} r="10" fill="rgba(0,209,102,0.15)" />
                  <circle cx={startPt.x} cy={startPt.y} r="6"  fill="#00D166">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* Drawing Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-3xl"
            style={{ touchAction: 'none', cursor: 'crosshair' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />

          {/* Clear button */}
          <motion.button
            whileHover={{ scale: 1.12, rotate: -8 }}
            whileTap={{ scale: 0.9 }}
            onClick={resetAll}
            className="absolute -top-4 -right-4 p-2.5 text-white rounded-xl z-10 font-black text-sm flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)', boxShadow: '0 4px 16px rgba(255,107,107,0.4)' }}
          >
            <RefreshCcw size={15} /> Clear
          </motion.button>
        </div>

        <p className="absolute bottom-4 text-white/30 text-sm font-medium">
          Start from the <span className="text-[#00D166]/70 font-bold">green dots</span>
          {' '}&middot; draw inside the <span className="text-white/50 font-bold">dashed path</span>
        </p>
      </div>

      {/* RIGHT: Controls */}
      <div className="w-full md:flex-[35] md:h-full flex flex-col items-center p-4 md:p-5 gap-3 overflow-y-auto no-scrollbar pb-8 md:pb-5">

        {/* Navigation */}
        <div className="w-full flex-shrink-0 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            className="p-2.5 rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <ChevronLeft size={18} />
          </motion.button>

          <div className="text-center">
            <div className="text-white font-black text-sm">
              {currentIdx + 1} <span className="text-white/40">of</span> {alphabet.length}
            </div>
            <div className="text-[#FF9F1C] text-[10px] font-bold">letters</div>
          </div>

          {currentIdx < alphabet.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentIdx(i => i + 1)}
              className="p-2.5 rounded-xl text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <ChevronRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => { setCurrentIdx(0); resetAll(); }}
              className="p-2.5 rounded-xl"
              style={{ background: 'rgba(255,159,28,0.2)', border: '1px solid rgba(255,159,28,0.4)', color: '#FF9F1C' }}
            >
              <RotateCcw size={18} />
            </motion.button>
          )}
        </div>

        {/* Reference letter preview */}
        <div className="flex flex-col items-center justify-center gap-2 w-full" style={{ minHeight: '140px' }}>
          <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
            HOW IT LOOKS
          </p>
          <div
            className="w-full rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: '120px', minHeight: '120px' }}
          >
            <svg viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} className="w-[80%] h-[80%]" preserveAspectRatio="xMidYMid meet">
              <path d={allStrokes} fill="none"
                stroke="rgba(255,255,255,0.7)" strokeWidth="18"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full flex-shrink-0 space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-white/40">Progress</span>
            <span style={{ color: '#FF9F1C' }}>{progress}% &nbsp;&#x1F3AF;</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20 }}
              style={{ background: 'linear-gradient(90deg,#FF9F1C,#FFD93D,#FF8C00)' }}
            />
          </div>
        </div>

        {/* Check button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={checkAccuracy}
          disabled={drawnPoints.current.length < 5 || saving}
          className="w-full flex-shrink-0 py-3 font-black text-base rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{
            background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)',
            boxShadow: '0 4px 20px rgba(255,159,28,0.4)',
            color: '#4a2c00',
          }}
        >
          {saving
            ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>&#x23F3;</motion.span>
            : <><Star size={18} fill="currentColor" /> Check My Writing!</>}
        </motion.button>

        {/* Result - compact row */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="w-full flex-shrink-0 rounded-2xl p-3 flex items-center gap-3"
              style={{ background: `${scoreColor}12`, border: `1.5px solid ${scoreColor}35` }}
            >
              <motion.div
                animate={{ scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-3xl flex-shrink-0"
              >
                {result.emoji}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-black leading-none" style={{ color: scoreColor }}>
                  {result.score}<span className="text-base text-white/40">%</span>
                </div>
                <div className="text-xs font-black" style={{ color: scoreColor }}>{result.label}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <button onClick={resetAll}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-white/50 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  Retry
                </button>
                {countdown !== null && (
                  <button
                    onClick={() => {
                      clearAutoAdvance();
                      setCurrentIdx(prev => (prev + 1) % alphabet.length);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-black text-white transition-all flex items-center gap-1 hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)',
                      boxShadow: '0 2px 10px rgba(255,159,28,0.3)',
                      color: '#4a2c00'
                    }}
                  >
                    Next ({countdown}s)
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
