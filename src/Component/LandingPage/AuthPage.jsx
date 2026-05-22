import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ArrowLeft, Sparkles, AlertCircle, Search, PlusCircle, Check, Eye, EyeOff } from 'lucide-react';
import { signInStudent, signUpStudent } from '../../lib/auth';

const AVATARS = ['\u{1F9D4}', '\u{1F469}\u{200D}\u{1F4BB}', '\u{1F468}\u{200D}\u{1F4BB}', '\u{1F9D1}\u{200D}\u{1F393}', '\u{1F9D1}\u{200D}\u{1F4BB}', '\u{1F680}', '\u{1F9BE}', '\u{1F9E0}', '\u{1F4BB}', '\u{1F392}'];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Find redirect destination (defaults to Level 2)
  const fromPath = location.state?.from || '/level2';

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle Login: Sign in via Supabase Auth & verify profile
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { profile } = await signInStudent({
        email: email.trim(),
        password: password.trim(),
      });

      if (!profile) {
        throw new Error('Unable to load student profile after signing in.');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(fromPath);
      }, 1200);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup: Create a new profile with password in Supabase
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    if (password.trim().length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const targetGrade = fromPath.includes('level1') ? '1-4' : fromPath.includes('level2') ? '5-8' : fromPath.includes('level3') ? '9-10' : '11-12';
      const { profile, needsEmailConfirmation } = await signUpStudent({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        avatar: selectedAvatar,
        gradeGroup: targetGrade,
      });

      if (!profile) {
        throw new Error('Failed to create profile. Please try again.');
      }

      if (needsEmailConfirmation) {
        setErrorMsg('Account created. Please confirm your email, then sign in.');
        setMode('login');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(fromPath);
      }, 1200);
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-screen w-screen flex flex-col text-white bg-[#0a0f1e] overflow-hidden justify-center items-center relative select-none">
      
      {/* ── BACKGROUND GLOWS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vh] rounded-full blur-[120px] opacity-15 bg-[#6666ff]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] rounded-full blur-[120px] opacity-10 bg-[#6666ff]" />
      </div>

      <header className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-white/5 border border-white/8 text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
      </header>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        <div className="rounded-[2.5rem] p-8 bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center">
          
          <div className="w-14 h-14 rounded-2xl bg-[#6666ff]/10 flex items-center justify-center border border-[#6666ff]/25 mb-4 animate-pulse">
            <Sparkles size={26} className="text-[#6666ff]" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-2">Student Authentication</h2>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider text-center mb-6">
            Access your verified study profiles
          </p>

          {/* Tab Selection */}
          <div className="flex bg-black/30 rounded-xl p-1 w-full mb-6 border border-white/5">
            <button
              onClick={() => {
                setMode('login');
                setPassword('');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                mode === 'login' 
                  ? 'bg-[#6666ff] text-[#0a0f1e] shadow' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setPassword('');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                mode === 'signup' 
                  ? 'bg-[#6666ff] text-[#0a0f1e] shadow' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="w-full flex flex-col gap-4">
            
            {/* Success state overlay */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[#0a0f1e]/90 backdrop-blur-md flex flex-col items-center justify-center z-20"
                >
                  <div className="w-14 h-14 rounded-full bg-[#6666ff]/20 border border-[#6666ff]/50 flex items-center justify-center mb-3">
                    <Check size={26} className="text-[#6666ff]" />
                  </div>
                  <div className="text-white font-black text-base">Authentication Successful</div>
                  <div className="text-white/40 text-[10px] font-medium tracking-wide mt-1">Redirecting to workspace...</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-left">
                <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-red-400 text-xs font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Input Name field */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-white/40 text-[10px] font-black uppercase tracking-wider pl-1">Student Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter full profile name..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full bg-black/25 border border-white/5 focus:border-[#6666ff]/40 outline-none rounded-xl py-3 pl-4 pr-10 text-xs font-semibold text-white placeholder-white/20"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20">
                    <PlusCircle size={14} />
                  </div>
                </div>
              </div>
            )}

            {/* input email field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-white/40 text-[10px] font-black uppercase tracking-wider pl-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-black/25 border border-white/5 focus:border-[#6666ff]/40 outline-none rounded-xl py-3 pl-4 pr-10 text-xs font-semibold text-white placeholder-white/20"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20">
                  {mode === 'login' && <Search size={14} />}
                </div>
              </div>
            </div>

            {/* Secure Password field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-white/40 text-[10px] font-black uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter access password..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-black/25 border border-white/5 focus:border-[#6666ff]/40 outline-none rounded-xl py-3 pl-4 pr-12 text-xs font-semibold text-white placeholder-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Signup extra fields */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-2.5 text-left mt-1">
                <label className="text-white/40 text-[10px] font-black uppercase tracking-wider pl-1">Choose Companion Avatar</label>
                <div className="grid grid-cols-5 gap-2.5">
                  {AVATARS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-11 h-11 text-2xl rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        selectedAvatar === av 
                          ? 'bg-[#6666ff]/20 border-[#6666ff] text-white' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim() || (mode === 'signup' && !name.trim())}
              className="w-full mt-3 py-3 rounded-2xl text-[#0a0f1e] font-black text-xs hover:bg-[#5252e0] bg-[#6666ff] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_16px_rgba(102,102,255,0.25)] disabled:opacity-20 disabled:pointer-events-none"
            >
              {loading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                  {'\u23F3'}
                </motion.span>
              ) : (
                <>{mode === 'login' ? 'Sign In & Enter' : 'Register Profile & Enter'} <Rocket size={14} /></>
              )}
            </button>

          </form>

        </div>
      </motion.div>
    </div>
  );
}
