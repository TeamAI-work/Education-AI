import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Settings, 
  ChevronLeft, 
  User, 
  Music, 
  Zap, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getStoredUserId } from '../../lib/useStudentProfile';
import { getDailyLettersCount } from '../../lib/cookieUtils';

const AVATARS = ['🧒', '👧', '👦', '🎓', '🚀', '🌟', '🦄', '🦁', '🦖', '🐼'];
const GRADES = [
  { value: '1-4', label: 'Grade 1-4 (Explorers)' },
  { value: '5-8', label: 'Grade 5-8 (Focus & Habit)' },
  { value: '9-10', label: 'Grade 9-10 (Strategic Prep)' },
  { value: '11-12', label: 'Grade 11-12 (Pathway & Weightage)' }
];

export default function SettingsPage() {
  const navigate = useNavigate();

  const dailyLettersCount = getDailyLettersCount();
  
  // Lock Screen States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mathQuestion, setMathQuestion] = useState({ n1: 0, n2: 0, ans: 0 });
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Settings Dashboard States
  const [studentName, setStudentName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧒');
  const [selectedGrade, setSelectedGrade] = useState('1-4');
  const [streakVal, setStreakVal] = useState(0);
  const [isNarratorEnabled, setIsNarratorEnabled] = useState(true);
  const [isHighPerfMode, setIsHighPerfMode] = useState(true);
  const [stats, setStats] = useState({ totalActivities: 0, alphabetCount: dailyLettersCount, mathCount: 0 });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const inputRef = useRef(null);

  // Parent Gate Math Generator
  const generateMathQuestion = () => {
    const n1 = Math.floor(Math.random() * 8) + 12; // 12 to 19
    const n2 = Math.floor(Math.random() * 7) + 3;  // 3 to 9
    setMathQuestion({ n1, n2, ans: n1 * n2 });
    setInputVal('');
    setError(false);
  };

  useEffect(() => {
    generateMathQuestion();
  }, []);

  useEffect(() => {
    if (!isUnlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isUnlocked]);

  // Handle parent verification
  const handleVerify = (e) => {
    e.preventDefault();
    if (parseInt(inputVal, 10) === mathQuestion.ans) {
      setIsUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      generateMathQuestion();
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Hydrate states once unlocked
  useEffect(() => {
    if (isUnlocked) {
      const loadProfile = async () => {
        const userId = getStoredUserId();
        if (userId) {
          // Local Storage load
          const localProfile = localStorage.getItem('edu_ai_profile');
          if (localProfile) {
            try {
              const parsed = JSON.parse(localProfile);
              setStudentName(parsed.full_name || '');
              setSelectedAvatar(parsed.avatar_url || '🧒');
              setSelectedGrade(parsed.grade_group || '1-4');
            } catch (e) {
              console.warn(e);
            }
          }

          // Supabase load
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (dbProfile) {
            setStudentName(dbProfile.full_name || '');
            setSelectedAvatar(dbProfile.avatar_url || '🧒');
            setSelectedGrade(dbProfile.grade_group || '1-4');
          }

          // Streak load
          const { data: streakData } = await supabase
            .from('user_streaks')
            .select('current_streak')
            .eq('user_id', userId)
            .single();

          if (streakData) {
            setStreakVal(streakData.current_streak);
          }

          // Stats load
          const { data: logs } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId);

          if (logs) {
            const alphabetLogs = logs.filter(a => a.activity_type === 'alphabet_tracing');
            const mathLogs = logs.filter(a => a.activity_type === 'living_math');
            setStats({
              totalActivities: logs.length,
              alphabetCount: dailyLettersCount,
              mathCount: mathLogs.length
            });
          }
        }
      };
      loadProfile();

      // Local preferences hydration
      const localNarrator = localStorage.getItem('edu_ai_narrator_enabled') !== 'false';
      setIsNarratorEnabled(localNarrator);
      const localHighPerf = localStorage.getItem('edu_ai_high_perf_mode') !== 'false';
      setIsHighPerfMode(localHighPerf);
    }
  }, [isUnlocked]);

  // Save Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMsg('');
    const userId = getStoredUserId();
    if (userId) {
      const updatedProfile = {
        full_name: studentName,
        avatar_url: selectedAvatar,
        grade_group: selectedGrade,
      };

      // Save locally
      const localProfile = localStorage.getItem('edu_ai_profile');
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          localStorage.setItem('edu_ai_profile', JSON.stringify({ ...parsed, ...updatedProfile }));
        } catch (e) {
          localStorage.setItem('edu_ai_profile', JSON.stringify(updatedProfile));
        }
      } else {
        localStorage.setItem('edu_ai_profile', JSON.stringify(updatedProfile));
      }

      // Save to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: studentName,
          avatar_url: selectedAvatar,
          grade_group: selectedGrade,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating db profile:', error.message);
      }

      // Save local preferences
      localStorage.setItem('edu_ai_narrator_enabled', String(isNarratorEnabled));
      localStorage.setItem('edu_ai_high_perf_mode', String(isHighPerfMode));

      setSuccessMsg('Settings saved successfully! \u2705');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setSaving(false);
  };

  // Streak Booster (+5 days)
  const handleBoostStreak = async () => {
    setSaving(true);
    const userId = getStoredUserId();
    if (userId) {
      const today = new Date().toISOString().slice(0, 10);
      
      // 1. Load local streak baseline
      let localStreak = { current_streak: 0, longest_streak: 0, last_active_date: null };
      try {
        const cached = localStorage.getItem('edu_ai_streak');
        if (cached) {
          localStreak = JSON.parse(cached);
        }
      } catch (e) {
        console.error(e);
      }

      // 2. Increment by 5 days
      const newStreak = (localStreak.current_streak || 0) + 5;
      const newLongest = Math.max(localStreak.longest_streak || 0, newStreak);
      const updatedStreak = {
        user_id: userId,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
        updated_at: new Date().toISOString()
      };

      // 3. Save locally immediately
      localStorage.setItem('edu_ai_streak', JSON.stringify(updatedStreak));
      setStreakVal(newStreak);

      // 4. Sync to Supabase in the background
      try {
        const { data: existing } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existing) {
          await supabase
            .from('user_streaks')
            .update({
              current_streak: newStreak,
              longest_streak: newLongest,
              last_active_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } else {
          await supabase.from('user_streaks').insert(updatedStreak);
        }
      } catch (err) {
        console.warn('Boost streak Supabase write failed, using local baseline:', err);
      }

      setSuccessMsg('Parent Boost: +5 Day Streak Added! \u{1F525}');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setSaving(false);
  };

  // Complete Reset progress
  const handleResetProgress = async () => {
    setSaving(true);
    const userId = getStoredUserId();
    if (userId) {
      // 1. Delete all remote activity logs if online
      try {
        await supabase
          .from('activity_logs')
          .delete()
          .eq('user_id', userId);
      } catch (e) {
        console.warn('Remote logs reset failed:', e);
      }

      // 2. Reset remote user streak if online
      try {
        await supabase
          .from('user_streaks')
          .update({
            current_streak: 0,
            longest_streak: 0,
            last_active_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } catch (e) {
        console.warn('Remote streak reset failed:', e);
      }

      // 3. Clear states, cookie & local storage baseline streak
      document.cookie = "daily_letters_done=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      localStorage.removeItem('edu_ai_streak');
      setStreakVal(0);
      setStats({ totalActivities: 0, alphabetCount: 0, mathCount: 0 });
      setShowResetConfirm(false);
      setSuccessMsg('Student progress has been completely reset! \u{1F5D1}');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setSaving(false);
  };

  return (
    <div 
      className="font-['Outfit',sans-serif] relative overflow-hidden w-screen h-screen flex flex-col items-center justify-center p-6 text-white"
      style={{ background: 'linear-gradient(135deg,#0c1020,#111730,#080b18)' }}
    >
      {/* Background visual gloss blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full blur-[100px] opacity-15"
          style={{ background: 'radial-gradient(circle,#FF9F1C,transparent)' }} />
        <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] rounded-full blur-[100px] opacity-15"
          style={{ background: 'radial-gradient(circle,#a29bfe,transparent)' }} />
      </div>

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          /* PARENT GATE MATH LOCK SCREEN */
          <motion.div
            key="lock-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-md p-8 rounded-3xl relative z-10 glass border border-white/10 text-center flex flex-col items-center gap-6 shadow-2xl ${
              shake ? 'animate-shake' : ''
            }`}
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.03)' }}
          >
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Lock size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Parent Gate {'\u{1F512}'}</h2>
              <p className="text-sm font-medium text-white/50 px-2 leading-relaxed">
                Settings are locked for student safety. Please prove you are a parent by solving this multiplication problem.
              </p>
            </div>

            <div className="w-full py-5 rounded-2xl bg-white/5 border border-white/8 flex flex-col items-center justify-center">
              <div className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">
                PARENTS ONLY MATH LOCK
              </div>
              <div className="text-4xl font-black tracking-widest text-[#FF9F1C]">
                {mathQuestion.n1} &times; {mathQuestion.n2} = ?
              </div>
            </div>

            <form onSubmit={handleVerify} className="w-full space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="Enter your answer"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ''))}
                  className={`w-full py-3.5 px-5 rounded-2xl bg-black/40 border text-center text-xl font-bold transition-all focus:outline-none focus:ring-2 ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-[#FF9F1C] focus:ring-[#FF9F1C]'
                  }`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 px-5 rounded-2xl text-sm font-bold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 rounded-2xl text-sm font-black text-white hover:brightness-110 shadow-lg flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)',
                    boxShadow: '0 4px 15px rgba(255,159,28,0.3)',
                    color: '#4a2c00'
                  }}
                >
                  Unlock <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* PARENT SETTINGS DASHBOARD */
          <motion.div
            key="dashboard-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-4xl h-full max-h-[90dvh] flex flex-col relative z-10 glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.02)' }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <h1 className="text-xl font-black flex items-center gap-2 tracking-tight">
                    <Settings size={20} className="text-[#FF9F1C]" /> Parent Settings Dashboard
                  </h1>
                  <p className="text-xs font-semibold text-white/40">Secure administrative portal for AuraEdu customization</p>
                </div>
              </div>
              
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-[#FF9F1C]/15 border border-[#FF9F1C]/30 text-[#FF9F1C] text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              
              {/* Profile Configuration */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-white/50 tracking-wider uppercase border-b border-white/5 pb-2">
                  <User size={16} /> Student Profile settings
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest">Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Yash"
                      className="w-full py-3 px-4 rounded-xl bg-black/30 border border-white/10 focus:border-[#FF9F1C] focus:ring-1 focus:ring-[#FF9F1C] focus:outline-none font-bold text-sm"
                    />
                  </div>

                  {/* Level selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/50 uppercase tracking-widest">Active Grade Level</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full py-3 px-4 rounded-xl bg-black/30 border border-white/10 focus:border-[#FF9F1C] focus:ring-1 focus:ring-[#FF9F1C] focus:outline-none font-bold text-sm text-white"
                      style={{ colorScheme: 'dark' }}
                    >
                      {GRADES.map((g) => (
                        <option key={g.value} value={g.value} className="bg-[#111730] text-white">
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Avatar select */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/50 uppercase tracking-widest block">Choose Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((avatar) => {
                      const isSelected = selectedAvatar === avatar;
                      return (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-[#FF9F1C]/20 border-2 border-[#FF9F1C] scale-105' 
                              : 'bg-white/5 hover:bg-white/10 border border-white/8 hover:scale-102'
                          }`}
                        >
                          {avatar}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Preferences Configuration */}
              <section className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-sm font-black text-white/50 tracking-wider uppercase border-b border-white/5 pb-2">
                  <Music size={16} /> Audio & Visual preferences
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Speech engine narration */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-black">Enable TTS Narration</div>
                      <div className="text-[10px] font-bold text-white/40 leading-tight">Narrate lesson texts using Web Speech API</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNarratorEnabled(!isNarratorEnabled)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-all relative ${
                        isNarratorEnabled ? 'bg-[#FF9F1C]' : 'bg-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-md ${
                        isNarratorEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Graphics / high performance mode */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-black">Premium Animations</div>
                      <div className="text-[10px] font-bold text-white/40 leading-tight">Enable floating decorative background elements</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHighPerfMode(!isHighPerfMode)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-all relative ${
                        isHighPerfMode ? 'bg-[#FF9F1C]' : 'bg-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-md ${
                        isHighPerfMode ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </section>

              {/* Parent Supercharger & Administration */}
              <section className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-sm font-black text-white/50 tracking-wider uppercase border-b border-white/5 pb-2">
                  <Zap size={16} /> Parent Supercharger (Administrative)
                </div>
                
                {/* Stats panel */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/8 text-center">
                    <div className="text-white/30 text-[9px] font-black uppercase tracking-widest">Total Activities</div>
                    <div className="text-2xl font-black mt-1 text-[#a29bfe]">{stats.totalActivities}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/8 text-center">
                    <div className="text-white/30 text-[9px] font-black uppercase tracking-widest">Day Streak</div>
                    <div className="text-2xl font-black mt-1 text-orange-400">{streakVal} days</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/8 text-center">
                    <div className="text-white/30 text-[9px] font-black uppercase tracking-widest">Letters Traced</div>
                    <div className="text-2xl font-black mt-1 text-[#FF9F1C]">{stats.alphabetCount}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Streak boost button */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/8 flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black flex items-center gap-1">
                        <Sparkles size={16} className="text-orange-400" /> Parent Motivation Booster
                      </h3>
                      <p className="text-[10px] font-bold text-white/40 leading-tight">
                        Inject +5 days to streak counts to reward students for off-platform studies.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBoostStreak}
                      className="py-2.5 px-4 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
                      style={{
                        background: 'linear-gradient(135deg,#FF8E53,#FF4E50)',
                        boxShadow: '0 2px 10px rgba(255,142,83,0.3)'
                      }}
                    >
                      Boost Student Streak +5 Days!
                    </button>
                  </div>

                  {/* Reset statistics button */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/8 flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black flex items-center gap-1 text-red-400">
                        <ShieldAlert size={16} /> Delete Student History
                      </h3>
                      <p className="text-[10px] font-bold text-white/40 leading-tight">
                        Hard deletion of all tracing, math, and daily activity logs from Supabase.
                      </p>
                    </div>
                    {!showResetConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="py-2.5 px-4 rounded-xl text-xs font-black bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <RotateCcw size={14} /> Clear Student Progress
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="flex-1 py-2 px-3 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetProgress}
                          className="flex-1 py-2 px-3 rounded-xl text-[10px] font-black bg-red-600 hover:bg-red-500 border border-red-700 transition-all text-white"
                        >
                          Confirm Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

            </div>

            {/* Bottom Actions footer */}
            <div className="p-5 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => navigate(-1)}
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="py-2.5 px-6 rounded-xl text-xs font-black text-white hover:brightness-110 shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#FF9F1C,#FFD93D)',
                  boxShadow: '0 4px 15px rgba(255,159,28,0.3)',
                  color: '#4a2c00'
                }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
