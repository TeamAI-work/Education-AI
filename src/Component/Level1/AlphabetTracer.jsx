import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ChevronLeft, ChevronRight, Star, RotateCcw } from 'lucide-react';

import { LETTER_PATHS, alphabet } from '../../data/letterPaths';

const CANVAS_SIZE = 300;
const PATH_TOLERANCE = 22; // Max distance (px) from path center to count as "on path"

/** 
 * Samples N evenly spaced points along an SVG path element.
 */
function samplePath(pathEl, count = 80) {
  const len = pathEl.getTotalLength();
  const points = [];
  for (let i = 0; i <= count; i++) {
    const p = pathEl.getPointAtLength((i / count) * len);
    points.push({ x: p.x, y: p.y });
  }
  return points;
}

/**
 * Returns the minimum distance from point P to a polyline defined by `points`.
 */
function minDistToPath(px, py, points) {
  let minDist = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const ax = points[i].x,   ay = points[i].y;
    const bx = points[i+1].x, by = points[i+1].y;
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx*dx + dy*dy;
    let t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / lenSq));
    const closestX = ax + t*dx;
    const closestY = ay + t*dy;
    const d = Math.hypot(px - closestX, py - closestY);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

export default function AlphabetTracer() {
  const canvasRef    = useRef(null);
  const svgRef       = useRef(null);
  const boundaryRef  = useRef(null);   // Off-screen mask: pixel is set if inside letter
  const drawnPoints  = useRef([]);     // All points the user has drawn
  const [isDrawing, setIsDrawing]       = useState(false);
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [result, setResult]             = useState(null); // null | { score, label }
  const [progress, setProgress]         = useState(0);    // 0-100 real-time fill %

  const letter = alphabet[currentIdx];
  const letterData = LETTER_PATHS[letter];

  // --- Get sampled reference points from the SVG paths ---
  const getRefPoints = useCallback(() => {
    if (!svgRef.current) return [];
    const paths = svgRef.current.querySelectorAll('path[data-guide]');
    let all = [];
    paths.forEach(p => { all = all.concat(samplePath(p, 100)); });
    return all;
  }, [letter]);

  // --- Build off-screen boundary mask from the SVG strokes ---
  // We wait a tick so the SVG has rendered and guide paths are queryable.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!svgRef.current) return;

      // Render all letter strokes (with generous thickness) into an off-screen canvas
      const mask = document.createElement('canvas');
      mask.width  = CANVAS_SIZE;
      mask.height = CANVAS_SIZE;
      const mCtx = mask.getContext('2d');
      mCtx.lineCap  = 'round';
      mCtx.lineJoin = 'round';

      const paths = svgRef.current.querySelectorAll('path[data-guide]');
      paths.forEach(p => {
        const d = p.getAttribute('d');
        const path2d = new Path2D(d);
        mCtx.lineWidth   = 55; // Allowed writing zone width
        mCtx.strokeStyle = 'white';
        mCtx.stroke(path2d);
      });

      // Store raw pixel data for fast lookup
      boundaryRef.current = mCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    }, 50);
    return () => clearTimeout(timer);
  }, [currentIdx]);

  // --- Canvas setup ---
  useEffect(() => {
    const canvas = canvasRef.current;
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
  }, [currentIdx]);

  /** Returns true if (x, y) lies within the letter boundary mask */
  const isInsideBoundary = (x, y) => {
    const mask = boundaryRef.current;
    if (!mask) return true; // If mask not ready yet, allow drawing
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= CANVAS_SIZE || py >= CANVAS_SIZE) return false;
    const idx = (py * CANVAS_SIZE + px) * 4;
    return mask[idx + 3] > 0; // Alpha channel: white pixels are the allowed zone
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  };

  const resetAll = () => {
    clearCanvas();
    drawnPoints.current = [];
    setResult(null);
    setProgress(0);
  };

  // --- Drawing handlers ---
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawnPoints.current.push({ x, y });
    setIsDrawing(true);
    setResult(null);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');

    if (isInsideBoundary(x, y)) {
      // Inside the letter — draw and record
      ctx.lineTo(x, y);
      ctx.stroke();
      drawnPoints.current.push({ x, y });
    } else {
      // Outside the letter — lift pen silently (no mark left)
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    // Real-time progress calculation
    const refPoints = getRefPoints();
    if (refPoints.length > 0) {
      const covered = refPoints.filter(rp =>
        drawnPoints.current.some(dp => Math.hypot(dp.x - rp.x, dp.y - rp.y) < PATH_TOLERANCE)
      ).length;
      setProgress(Math.min(100, Math.round((covered / refPoints.length) * 100)));
    }
  };

  const stopDraw = (e) => {
    e?.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current.getContext('2d').closePath();
  };

  // --- Accuracy Calculation ---
  const checkAccuracy = () => {
    const refPoints = getRefPoints();
    if (refPoints.length === 0 || drawnPoints.current.length === 0) return;

    // 1. Coverage: How many ref points did the student's stroke pass near?
    let covered = 0;
    for (const rp of refPoints) {
      const dist = Math.min(...drawnPoints.current.map(dp => Math.hypot(dp.x - rp.x, dp.y - rp.y)));
      if (dist < PATH_TOLERANCE) covered++;
    }
    const coverage = covered / refPoints.length;

    // 2. Precision: How many of the student's points are ON the letter path?
    let onPath = 0;
    for (const dp of drawnPoints.current) {
      const dist = minDistToPath(dp.x, dp.y, refPoints);
      if (dist < PATH_TOLERANCE) onPath++;
    }
    const precision = onPath / drawnPoints.current.length;

    // Final score: 60% coverage + 40% precision
    const score = Math.round((coverage * 60 + precision * 40));
    
    let label, emoji;
    if (score >= 80) { label = "Excellent!"; emoji = "🌟"; }
    else if (score >= 60) { label = "Great Job!"; emoji = "⭐"; }
    else if (score >= 40) { label = "Keep Trying!"; emoji = "💪"; }
    else { label = "Try Again!"; emoji = "❤️"; }

    setResult({ score, label, emoji });
  };

  const allStrokes = letterData.strokes.join(' ');

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0f1e] flex font-['Outfit',sans-serif]">

      {/* ════════════════════════════════════════
          LEFT PANEL — 65% — Drawing Canvas
      ════════════════════════════════════════ */}
      <div className="relative flex-[65] h-full bg-[#080d1a] border-r border-white/5 flex items-center justify-center">

        {/* Subtle radial glow behind canvas */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[420px] h-[420px] bg-[#00D166]/5 rounded-full blur-3xl" />
        </div>

        {/* The drawing area grows to fill the left panel */}
        <div className="relative w-[min(65vw,580px)] aspect-square">

          {/* SVG Guide Layer */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
            className="absolute inset-0 w-full h-full rounded-3xl"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width={CANVAS_SIZE} height={CANVAS_SIZE} rx="24"
              fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Ghost letter fill */}
            <path d={allStrokes} fill="none"
              stroke="rgba(255,255,255,0.04)" strokeWidth="60"
              strokeLinecap="round" strokeLinejoin="round" />

            {/* Dashed guide path */}
            <path d={allStrokes} data-guide="true" fill="none"
              stroke="rgba(255,255,255,0.2)" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="10 8" />

            {/* Pulsing start dots */}
            {letterData.strokes.map((stroke, i) => {
              const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              tempPath.setAttribute('d', stroke);
              document.body.appendChild(tempPath);
              const startPt = tempPath.getPointAtLength(0);
              document.body.removeChild(tempPath);
              return (
                <circle key={i} cx={startPt.x} cy={startPt.y} r="7" fill="#00D166" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              );
            })}
          </svg>

          {/* Canvas Drawing Layer */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-3xl cursor-crosshair"
            style={{ touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />

          {/* Clear button — top-right of canvas */}
          <button
            onClick={resetAll}
            className="absolute -top-4 -right-4 p-2.5 bg-red-500/80 backdrop-blur-md text-white rounded-xl
                       shadow-lg hover:bg-red-600 transition-all border border-white/10 z-10"
          >
            <RefreshCcw size={18} />
          </button>
        </div>

        {/* Bottom hint */}
        <p className="absolute bottom-5 text-gray-600 text-xs font-medium tracking-wide">
          Draw inside the <span className="text-white/50">dashed path</span> · start from the <span className="text-[#00D166]/70">green dots</span>
        </p>
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — 35% — Control & Info
      ════════════════════════════════════════ */}
      <div className="flex-[35] h-full flex flex-col items-center justify-between p-6 gap-4">

        {/* ── Letter Navigation ── */}
        <div className="w-full flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs text-[#00D166] font-bold tracking-widest">
            {currentIdx + 1} / {alphabet.length}
          </span>

          {/* Next → or Restart if on Z */}
          {currentIdx < alphabet.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(i => i + 1)}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => { setCurrentIdx(0); resetAll(); }}
              className="p-2 rounded-2xl bg-[#00D166]/20 border border-[#00D166]/40 text-[#00D166] hover:bg-[#00D166]/30 transition-all"
              title="Start Over from A"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>

        {/* ── Z Completion Banner ── */}
        <AnimatePresence>
          {currentIdx === alphabet.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full rounded-2xl bg-[#00D166]/10 border border-[#00D166]/25 px-4 py-3 flex flex-col items-center gap-1"
            >
              <span className="text-xl">🎉</span>
              <p className="text-[#00D166] font-black text-sm text-center leading-tight">You finished the alphabet!</p>
              <button
                onClick={() => { setCurrentIdx(0); resetAll(); }}
                className="mt-1 px-5 py-1.5 bg-[#00D166] text-white text-xs font-black rounded-xl
                           shadow-[0_0_12px_rgba(0,209,102,0.3)] hover:shadow-[0_0_20px_rgba(0,209,102,0.5)] transition-all"
              >
                Start Over from A
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reference Letter ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 w-full">
          <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase">Reference</p>
          <div
            className="w-full aspect-square max-w-[200px] rounded-3xl flex items-center justify-center
                       bg-white/3 border border-white/8 relative overflow-hidden"
          >
            {/* Reference SVG — solid, readable */}
            <svg
              viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
              className="w-[85%] h-[85%]"
              preserveAspectRatio="xMidYMid meet"
            >
              <path d={allStrokes} fill="none"
                stroke="rgba(255,255,255,0.65)" strokeWidth="18"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute inset-0 rounded-3xl border border-[#00D166]/10" />
          </div>

          {/* Big letter label */}
          {/* <div className="text-8xl font-black text-white/5 select-none leading-none tracking-tighter mt-1">
            {letter}
          </div> */}
        </div>

        {/* ── Completion Bar ── */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-500">Completion</span>
            <span className="text-[#00D166]">{progress}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00D166] to-[#00FF88] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
        </div>

        {/* ── Check Button ── */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={checkAccuracy}
          disabled={drawnPoints.current.length < 5}
          className="w-full py-4 bg-[#00D166] text-white font-black text-base rounded-2xl
                     shadow-[0_0_25px_rgba(0,209,102,0.3)] hover:shadow-[0_0_40px_rgba(0,209,102,0.5)]
                     transition-all disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Star size={20} />
          Check My Writing!
        </motion.button>

        {/* ── Result Panel ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="w-full rounded-3xl bg-white/4 border border-white/8 p-5 flex flex-col items-center gap-2 backdrop-blur-sm"
            >
              <div className="text-3xl">{result.emoji}</div>
              <div className="text-5xl font-black text-white leading-none">
                {result.score}<span className="text-xl text-[#00D166]">%</span>
              </div>
              <div className="text-base font-bold text-[#00D166]">{result.label}</div>
              <p className="text-gray-500 text-xs text-center">Keep practicing — you're doing great!</p>
              <button
                onClick={resetAll}
                className="mt-1 px-6 py-2 bg-white/8 border border-white/10 text-white/70 text-sm font-bold rounded-xl hover:bg-white/15 hover:text-white transition-all"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer when no result */}
        {!result && <div className="h-4" />}
      </div>
    </div>
  );
}
