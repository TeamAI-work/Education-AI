import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ChevronLeft, ChevronRight, Star, RotateCcw } from 'lucide-react';
import { LETTER_PATHS, alphabet } from '../../data/letterPaths';
import { logActivity, updateStreak } from '../../lib/gamification';
import { getStoredUserId } from '../../lib/useStudentProfile';

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.lineWidth   = 18;
    ctx.strokeStyle = '#00D166';
    ctx.shadowColor = '#00FF88';
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

  const resetAll = () => {
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
    if (score >= 60) setShowConfetti(true);

    const userId = getStoredUserId();
    if (userId) {
      setSaving(true);
      await Promise.all([
        logActivity(userId, 'alphabet_tracing', score),
        updateStreak(userId),
      ]);
      setSaving(false);
    }
  };

  const allStrokes = letterData.strokes.join(' ');
  const scoreColor = result
    ? result.score >= 80 ? '#00D166'
      : result.score >= 60 ? '#FFD93D'
      : result.score >= 40 ? '#FF8AAE'
      : '#A29BFE'
    : '#00D166';

  return (
    <div
      className="font-['Outfit',sans-serif] relative overflow-hidden flex"
      style={{ width: '100vw', height: '100dvh', background: 'linear-gradient(135deg,#0d2b1a,#1a0d2e,#0a1a2e)' }}
    >
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && Array.from({ length: 20 }).map((_, i) => (
          <ConfettiParticle key={i} delay={i * 0.08} />
        ))}
      </AnimatePresence>

      {/* LEFT: Drawing Canvas */}
      <div
        className="relative flex-[65] h-full flex items-center justify-center"
        style={{ borderRight: '1.5px solid rgba(255,255,255,0.08)' }}
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle,#00D166,transparent)' }} />
        </div>

        {/* Letter badge */}
        <motion.div
          key={letter}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-black text-4xl"
          style={{
            background: 'linear-gradient(135deg,#00D166,#00FF88)',
            boxShadow: '0 4px 20px rgba(0,209,102,0.5)',
            color: '#004d25',
          }}
        >
          {letter}
        </motion.div>

        <div className="relative w-[min(55vw,500px)] aspect-square">
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
      <div className="flex-[35] h-full flex flex-col items-center p-5 gap-3 overflow-hidden">

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
            <div className="text-[#00D166] text-[10px] font-bold">letters</div>
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
              style={{ background: 'rgba(0,209,102,0.2)', border: '1px solid rgba(0,209,102,0.4)', color: '#00D166' }}
            >
              <RotateCcw size={18} />
            </motion.button>
          )}
        </div>

        {/* Reference letter preview - flex-1 fills remaining space */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 w-full">
          <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
            HOW IT LOOKS
          </p>
          <div
            className="w-full rounded-2xl flex items-center justify-center overflow-hidden flex-1 min-h-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
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
            <span style={{ color: '#00D166' }}>{progress}% &nbsp;&#x1F3AF;</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20 }}
              style={{ background: 'linear-gradient(90deg,#00D166,#00FF88,#FFD93D)' }}
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
            background: 'linear-gradient(135deg,#00D166,#00FF88)',
            boxShadow: '0 4px 20px rgba(0,209,102,0.4)',
            color: '#004d25',
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
              <button onClick={resetAll}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black text-white/50 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
