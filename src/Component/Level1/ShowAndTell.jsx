import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logActivity, updateStreak, checkForNewBadges } from '../../lib/gamification';
import { triggerBadgeCelebration } from '../Navigation/UnlockOverlay';
import { getStoredUserId } from '../../lib/useStudentProfile';

// All emojis as Unicode escapes
const SUGGESTIONS = [
  { emoji: '\u{1F338}', text: 'A flower' },
  { emoji: '\u{1F415}', text: 'Your pet' },
  { emoji: '\u{1F9F8}', text: 'A toy' },
  { emoji: '\u{1F34E}', text: 'Some food' },
  { emoji: '\u{1F3E0}', text: 'Your home' },
];

export default function ShowAndTell() {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      setPreview(e.target.result);
      const userId = getStoredUserId();
      if (userId) {
        Promise.all([
          logActivity(userId, 'show_and_tell'),
          updateStreak(userId)
        ]).then(() => {
          checkForNewBadges(userId, '1-4').then(({ newlyUnlocked }) => {
            if (newlyUnlocked && newlyUnlocked.length > 0) {
              triggerBadgeCelebration(newlyUnlocked);
            }
          });
        }).catch(err => console.warn('Error in ShowAndTell logging:', err));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="font-sans overflow-hidden flex flex-col relative"
      style={{ width: '100vw', height: '100dvh', background: 'linear-gradient(135deg,#1a0d2e,#2e0d1a,#0d1a2e)' }}
    >
      {/* Back button */}
      <div className="absolute left-4 top-4 md:left-6 md:top-5 z-50 cursor-pointer flex gap-1.5 items-center transition-all group" onClick={() => navigate(-1)}>
        <ChevronLeft className="text-white/60 group-hover:text-white transition-colors w-8 h-8 bg-white/5 rounded-xl border border-white/8 p-1" /> 
        <span className="text-white/60 group-hover:text-white font-bold text-xs md:text-sm transition-colors">Back</span>
      </div>

      {/* HEADER */}
      <div className="flex-shrink-0 text-center pt-14 md:pt-6 pb-3">
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-5xl mb-2"
        >
          {'\u{1F4F8}'}
        </motion.div>
        <h1 className="text-3xl font-black text-white">Show &amp; Tell</h1>
        <p className="text-white/45 text-sm font-medium mt-0.5">
          Upload a picture and let&apos;s explore together!
        </p>
      </div>

      {/* UPLOAD ZONE */}
      <div className="flex-1 flex flex-col px-8 gap-3 min-h-0">
        <motion.label
          whileHover={{ scale: 1.02 }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          className="flex-1 relative cursor-pointer rounded-3xl overflow-hidden min-h-0 block"
          style={{
            border: `2.5px dashed ${dragOver ? '#FF9F1C' : 'rgba(255,255,255,0.2)'}`,
            background: dragOver ? 'rgba(255,159,28,0.07)' : 'rgba(255,255,255,0.03)',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <input type="file" accept="image/*" className="hidden"
            onChange={e => handleFile(e.target.files?.[0])} />

          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div key="preview"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                <img src={preview} alt="Uploaded" className="w-full h-full object-contain" />
                <div className="absolute inset-x-0 bottom-0 h-16 flex items-end justify-center pb-3"
                  style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.65),transparent)' }}>
                  <p className="text-white font-black text-sm">{'\u{1F4F7}'} Tap to change photo</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="placeholder"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#FF8AAE,#FFB3C6)', boxShadow: '0 4px 18px rgba(255,138,174,0.4)', animation: 'pulseSlow 2s ease-in-out infinite' }}
                >
                  <Upload size={28} color="white" />
                </div>
                <div className="text-center px-4">
                  <p className="text-white font-black text-lg">Tap to Upload a Photo!</p>
                  <p className="text-white/35 text-xs mt-1">PNG, JPG, WEBP &middot; or drag &amp; drop</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.label>

        {/* Suggestions */}
        <div className="flex-shrink-0 flex gap-2 flex-wrap justify-center pb-1">
          {SUGGESTIONS.map((s, i) => (
            <div key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {s.emoji} {s.text}
            </div>
          ))}
        </div>
      </div>

      {/* COMING SOON BANNER */}
      <div className="flex-shrink-0 px-8 pb-5">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{ background: 'rgba(255,138,174,0.1)', border: '1.5px solid rgba(255,138,174,0.28)' }}>
          <motion.div
            animate={{ rotate: [0, 18, -18, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={20} color="#FF8AAE" />
          </motion.div>
          <div>
            <p className="text-[#FF8AAE] font-black text-sm">AI Fun Facts &mdash; Coming Soon! {'\u{1F680}'}</p>
            <p className="text-white/35 text-xs mt-0.5">Upload a photo and AI will tell you amazing things about it!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
