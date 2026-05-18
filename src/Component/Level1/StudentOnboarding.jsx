import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket } from 'lucide-react';

// All emojis as Unicode escapes — 100% ASCII-safe, no encoding issues
const AVATARS = ['\u{1F9D2}','\u{1F467}','\u{1F98A}','\u{1F438}','\u{1F431}','\u{1F984}','\u{1F916}','\u{1F43C}','\u{1F98B}','\u{1F436}','\u{1F406}','\u{1F42F}'];
const BG_EMOJIS = ['\u2B50','\u{1F308}','\u{1F388}','\u{1F31F}','\u{1F4AB}','\u{1F389}','\u{1F38A}','\u2728'];

export default function StudentOnboarding({ onComplete }) {
  const [name, setName]                   = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [step, setStep]                   = useState(1);
  const [loading, setLoading]             = useState(false);

  const handleNameNext = () => { if (name.trim().length >= 2) setStep(2); };

  const handleDone = async () => {
    setLoading(true);
    await onComplete({ name: name.trim(), avatar: selectedAvatar });
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#FF9A9E,#FECFEF 25%,#FEE9B2 50%,#B2F0FB 75%,#C3F0CA)' }}
    >
      {/* Floating background emojis */}
      {BG_EMOJIS.map((e, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl pointer-events-none select-none opacity-30"
          style={{ left: `${10 + i * 12}%`, top: `${5 + (i % 3) * 30}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.4 }}
        >
          {e}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="rounded-[2rem] p-8 text-center shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)' }}>

          <AnimatePresence mode="wait">
            {/* Step 1 — Enter Name */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  {'\u{1F44B}'}
                </motion.div>
                <h1 className="text-3xl font-black text-gray-800 mb-2">Hello there, Explorer!</h1>
                <p className="text-gray-500 text-base mb-6 font-medium">
                  What&apos;s your name? Let&apos;s get you started!
                </p>
                <input
                  type="text"
                  placeholder="Type your name here..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                  autoFocus
                  maxLength={30}
                  className="w-full px-5 py-4 rounded-2xl text-xl font-bold text-gray-800 text-center outline-none border-4 border-transparent focus:border-[#00D166] transition-all"
                  style={{ background: 'rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.08)' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleNameNext}
                  disabled={name.trim().length < 2}
                  className="mt-5 w-full py-4 rounded-2xl text-white text-xl font-black disabled:opacity-30 transition-all"
                  style={{ background: 'linear-gradient(135deg,#00D166,#00FF88)', boxShadow: '0 4px 20px rgba(0,209,102,0.4)' }}
                >
                  Next &rarr;
                </motion.button>
              </motion.div>
            )}

            {/* Step 2 — Pick Avatar */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-3"
                >
                  {selectedAvatar}
                </motion.div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">
                  Hi, {name}! {'\u{1F389}'}
                </h2>
                <p className="text-gray-500 text-sm mb-5 font-medium">Pick your adventure buddy!</p>

                <div className="grid grid-cols-6 gap-2 mb-6">
                  {AVATARS.map(av => (
                    <motion.button
                      key={av}
                      whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedAvatar(av)}
                      className={`text-3xl p-2 rounded-2xl transition-all border-2 ${
                        selectedAvatar === av
                          ? 'bg-[#00D166]/20 border-[#00D166]'
                          : 'bg-gray-100 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {av}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleDone}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl text-white text-xl font-black flex items-center justify-center gap-3 disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(135deg,#00D166,#00FF88)', boxShadow: '0 4px 20px rgba(0,209,102,0.4)' }}
                >
                  {loading
                    ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>{'\u23F3'}</motion.span>
                    : <>LET&apos;S GO! <Rocket size={24} /></>}
                </motion.button>

                <button onClick={() => setStep(1)}
                  className="mt-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors">
                  &larr; Go back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
