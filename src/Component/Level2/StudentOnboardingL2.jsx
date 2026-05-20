import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ArrowLeft, ArrowRight, User } from 'lucide-react';

const AVATARS = ['\u{1F9D4}', '\u{1F469}\u{200D}\u{1F4BB}', '\u{1F468}\u{200D}\u{1F4BB}', '\u{1F9D1}\u{200D}\u{1F393}', '\u{1F9D1}\u{200D}\u{1F4BB}', '\u{1F680}', '\u{1F9BE}', '\u{1F9E0}', '\u{1F4BB}', '\u{1F392}'];
const BG_EMOJIS = ['\u2699\uFE0F', '\u{1F4D6}', '\u{1F4A1}', '\u2728', '\u{1F680}', '\u{1F4BB}', '\u{1F393}', '\u269B\uFE0F'];

export default function StudentOnboardingL2({ onComplete }) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleNameNext = () => {
    if (name.trim().length >= 2) setStep(2);
  };

  const handleDone = async () => {
    setLoading(true);
    // Explicitly target Level 2 Adventurers (Grades 5-8)
    await onComplete({ name: name.trim(), avatar: selectedAvatar, gradeGroup: '5-8' });
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0a0f1e] select-none"
    >
      {/* ── BACKGROUND GLOWS (Monochromatic Violet-Blue) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vh] rounded-full blur-[120px] opacity-15 bg-[#6666ff]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] rounded-full blur-[120px] opacity-10 bg-[#6666ff]" />
      </div>

      {/* Floating background emojis */}
      {BG_EMOJIS.map((e, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl pointer-events-none select-none opacity-5 text-[#6666ff]"
          style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 25}%` }}
          animate={{ y: [0, -15, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.3 }}
        >
          {e}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="rounded-[2.5rem] p-8 text-center shadow-2xl bg-white/5 border border-white/10 backdrop-blur-xl">

          <AnimatePresence mode="wait">
            {/* Step 1 — Enter Name */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 25 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }} 
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#6666ff]/10 flex items-center justify-center border border-[#6666ff]/25 mb-4 animate-bounce">
                  <User size={30} className="text-[#6666ff]" />
                </div>
                
                <h1 className="text-2xl font-black text-white mb-1.5 tracking-tight">Create Adventurer Profile</h1>
                <p className="text-white/40 text-xs mb-6 font-semibold leading-normal">
                  To get started, what should we call you?
                </p>
                
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                  autoFocus
                  maxLength={24}
                  className="w-full px-5 py-3.5 rounded-2xl text-base font-black text-white text-center outline-none border border-white/10 bg-black/35 focus:border-[#6666ff]/60 focus:ring-1 focus:ring-[#6666ff]/60 transition-all placeholder-white/20"
                />
                
                <motion.button
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNameNext}
                  disabled={name.trim().length < 2}
                  className="mt-5 w-full py-3.5 rounded-2xl text-[#0a0f1e] text-sm font-black disabled:opacity-20 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#6666ff] shadow-[0_4px_16px_rgba(102,102,255,0.25)] hover:bg-[#5252e0]"
                >
                  Next Step <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {/* Step 2 — Pick Avatar */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 25 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }} 
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6666ff] to-[#4d4dff] text-[#0a0f1e] shadow-lg shadow-[#6666ff]/25 flex items-center justify-center text-4xl mb-4">
                  {selectedAvatar}
                </div>
                
                <h2 className="text-xl font-black text-white mb-1.5 tracking-tight">
                  Welcome aboard, {name}!
                </h2>
                <p className="text-white/40 text-xs mb-5 font-semibold leading-normal">Pick your premium academic companion avatar.</p>

                <div className="grid grid-cols-5 gap-2.5 mb-6 w-full justify-items-center">
                  {AVATARS.map(av => (
                    <motion.button
                      key={av}
                      whileHover={{ scale: 1.15 }} 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAvatar(av)}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl transition-all border cursor-pointer ${
                        selectedAvatar === av
                          ? 'bg-[#6666ff]/20 border-[#6666ff] text-white'
                          : 'bg-white/5 border-white/5 text-white/45 hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDone}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-[#0a0f1e] text-sm font-black flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer bg-[#6666ff] shadow-[0_4px_16px_rgba(102,102,255,0.25)] hover:bg-[#5252e0]"
                >
                  {loading ? (
                    <motion.span 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="text-lg"
                    >
                      {'\u23F3'}
                    </motion.span>
                  ) : (
                    <>Initialize Profile <Rocket size={16} /></>
                  )}
                </motion.button>

                <button 
                  onClick={() => setStep(1)}
                  className="mt-4 text-white/30 hover:text-white/70 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={12} /> Go back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
