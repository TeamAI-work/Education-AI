import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, Trophy, Flame, ChevronRight, PenTool, X } from 'lucide-react';
import { useStudentProfile } from '../../lib/useStudentProfile';
import { useNoteSelection } from '../../lib/useNoteSelection';
import StreakCalendar from './StreakCalendar';
import Notebook from './Notebook';
import AchievementIcons from './AchievementIcons';
import StudentOnboardingL2 from './StudentOnboardingL2';

export default function Level2Landing() {
  const navigate = useNavigate();
  const { profile, streak, loading, needsOnboarding, createProfile, refetch } = useStudentProfile();
  
  // State for active overlay panels ('notebook', 'badges', or null)
  const [activeOverlay, setActiveOverlay] = useState(null);
  
  // Note capturing state
  const [notes, setNotes] = useState([]);
  const [queryCount, setQueryCount] = useState(0);

  // Note selection highlight hook
  const { selectedText, coords, showTooltip, clearSelection } = useNoteSelection();

  // Load profile and notes
  useEffect(() => {
    const userId = localStorage.getItem('edu_ai_user_id');
    if (!userId) {
      navigate('/auth', { state: { from: '/level2' } });
      return;
    }

    refetch();
    const savedNotes = localStorage.getItem('auraedu_level2_notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        seedInitialNotes();
      }
    } else {
      seedInitialNotes();
    }
  }, []);

  const seedInitialNotes = () => {
    const seed = [
      {
        id: 'seed_init',
        title: 'Welcome to your Workspace!',
        content: 'Highlight any text inside Aura Study Helper chatbot responses, and a floating button will pop up to instantly save that text as a digital note in this Notebook!',
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'System Guide'
      }
    ];
    localStorage.setItem('auraedu_level2_notes', JSON.stringify(seed));
    setNotes(seed);
  };

  const handleUpdateNotes = (newNotes) => {
    localStorage.setItem('auraedu_level2_notes', JSON.stringify(newNotes));
    setNotes(newNotes);
  };

  const handleAddActivityMetric = () => {
    setQueryCount(prev => prev + 1);
  };

  const handleCaptureSelection = () => {
    if (!selectedText) return;

    const newNote = {
      id: `capture_${Date.now()}`,
      title: selectedText.substring(0, 24) + (selectedText.length > 24 ? '...' : ''),
      content: selectedText,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      source: 'Highlight capture'
    };

    const updated = [newNote, ...notes];
    handleUpdateNotes(updated);
    clearSelection();
    handleAddActivityMetric();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0f1e]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="text-4xl text-[#6666ff]"
        >
          {'\u2699\uFE0F'}
        </motion.div>
      </div>
    );
  }

  // Visual card configurations in high-quality electric indigo theme
  const CARDS = [
    {
      id: 'chatbot',
      title: 'Aura Study AI',
      desc: 'Ask questions & retrieve verified textbook answers.',
      icon: Sparkles,
      color: '#6666ff',
      bg: 'linear-gradient(135deg, #6666ff, #4d4dff)',
      shadow: 'rgba(102, 102, 255, 0.25)',
      emoji: '\u{1F9D1}\u{200D}\u{1F4BB}'
    },
    {
      id: 'notebook',
      title: 'Digital Notebook',
      desc: 'Organize study items and compile highlighted notes.',
      icon: BookOpen,
      color: '#7a7aff',
      bg: 'linear-gradient(135deg, #7a7aff, #6666ff)',
      shadow: 'rgba(102, 102, 255, 0.25)',
      emoji: '\u{1F4D3}'
    },
    {
      id: 'badges',
      title: 'Badges Book',
      desc: 'Track academic streaks and unlock persistent awards.',
      icon: Trophy,
      color: '#8c8cff',
      bg: 'linear-gradient(135deg, #8c8cff, #7a7aff)',
      shadow: 'rgba(102, 102, 255, 0.25)',
      emoji: '\u{1F3C6}'
    }
  ];

  return (
    <div 
      className="font-sans relative flex flex-col text-white bg-[#0a0f1e]"
      style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}
    >
      {/* Monochromatic Onboarding Overlay */}
      <AnimatePresence>
        {needsOnboarding && <StudentOnboardingL2 onComplete={createProfile} />}
      </AnimatePresence>

      {/* ── BACKGROUND GLOWS (Monochromatic Violet-Blue) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vh] rounded-full blur-[120px] opacity-15 bg-[#6666ff]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] rounded-full blur-[120px] opacity-10 bg-[#6666ff]" />
      </div>

      {/* ── HEADER ROW ── */}
      <header className="relative z-10 flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-white/5 border border-white/8 text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight leading-none text-white">Adventurers Dashboard</h1>
              <span className="text-[9px] bg-[#6666ff]/10 border border-[#6666ff]/30 text-[#6666ff] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Grades 5 - 8
              </span>
            </div>
            <p className="text-white/40 text-xs font-medium mt-0.5">Build study consistency and master academic habits</p>
          </div>
        </div>

        {/* Student Avatar Widget */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br from-[#6666ff] to-[#4d4dff] shadow-md">
            {profile?.avatar_url || '\u{1F9D4}'}
          </div>
          <div>
            <div className="text-white font-black text-xs leading-none">
              {profile?.full_name?.split(' ')[0] || 'Adventurer'}
            </div>
            <div className="text-[#6666ff] font-black text-[9px] uppercase tracking-wider leading-none mt-1">
              Active Session
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD VIEWPORT ── */}
      <main className="relative z-10 flex-1 min-h-0 p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN: GREETING & NAVIGATION CARDS (60% width) */}
        <section className="lg:col-span-3 flex flex-col gap-6 min-h-0 h-full">
          
          {/* Greeting Area */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <h2 className="text-2xl font-black text-white leading-tight">
              Hey {profile?.full_name?.split(' ')[0] || 'Adventurer'}! {'\u{1F44B}'}
            </h2>
            <p className="text-white/50 text-sm font-medium">
              Ready to learn? Access your specialized study toolbox below.
            </p>
          </div>

          {/* Features Navigation Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 items-center">
            {CARDS.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (card.id === 'chatbot') {
                      navigate('/level2/chatbot');
                    } else {
                      setActiveOverlay(card.id);
                    }
                  }}
                  className="h-[180px] p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between cursor-pointer border border-white/10 select-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    boxShadow: `0 8px 24px ${card.shadow}`,
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  {/* Decorative background glow */}
                  <div 
                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ background: card.bg }}
                  />

                  {/* Icon and Title */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{
                        background: card.bg,
                        boxShadow: `0 4px 14px ${card.shadow}`
                      }}
                    >
                      {card.emoji}
                    </div>
                    
                    <ChevronRight size={18} className="text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>

                  {/* Card Label and Description */}
                  <div className="flex flex-col gap-1 mt-auto">
                    <h3 className="text-white font-black text-base leading-tight">{card.title}</h3>
                    <p className="text-white/40 text-[11px] font-semibold leading-normal leading-tight">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: INTEGRATED DAILY STREAK CALENDAR (40% width) */}
        <section className="lg:col-span-2 min-h-0 h-full">
          <StreakCalendar activitiesCount={queryCount} />
        </section>
      </main>

      {/* ── STUNNING OVERLAY POPUP SHELLS ── */}
      <AnimatePresence>
        {activeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-5"
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden border border-white/10 bg-[#0a0f1e]/90 shadow-2xl flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveOverlay(null);
                  clearSelection();
                }}
                className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Renders the specific target component */}
              <div className="flex-1 min-h-0">
                {activeOverlay === 'notebook' && (
                  <div className="p-5 h-full min-h-0">
                    <Notebook notes={notes} onUpdateNotes={handleUpdateNotes} onAddActivity={handleAddActivityMetric} />
                  </div>
                )}
                
                {activeOverlay === 'badges' && (
                  <div className="p-5 h-full min-h-0">
                    <AchievementIcons 
                      streakCount={streak?.current_streak ?? 4} 
                      notesCount={notes.filter(n => n.id.startsWith('capture_') || n.id.startsWith('manual_')).length} 
                      queryCount={queryCount} 
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOAT-MORPHIC HIGHLIGHT TOOLTIP BUTTON ── */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute z-50 pointer-events-auto select-none note-tooltip-btn"
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <button
              onClick={handleCaptureSelection}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6666ff] to-[#4d4dff] text-[#0a0f1e] font-black text-xs shadow-[0_4px_18px_rgba(102,102,255,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border border-[#8c8cff]/30"
            >
              <PenTool size={12} /> Add to Notebook
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}