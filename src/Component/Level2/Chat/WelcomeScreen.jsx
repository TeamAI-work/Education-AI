import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Lightbulb, MessageCircle, FileText, Globe } from 'lucide-react';

const suggestions = [
  { icon: <BookOpen size={16} />, text: 'How does photosynthesis work?', topic: 'photo' },
  { icon: <Globe size={16} />, text: 'Tell me about the solar system', topic: 'space' },
  { icon: <FileText size={16} />, text: 'What was the legacy of Ancient Rome?', topic: 'rome' },
  { icon: <Lightbulb size={16} />, text: 'How do fractions work in math?', topic: 'fractions' },
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 select-none">
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6666ff] to-[#4d4dff] flex items-center justify-center shadow-[0_8px_32px_rgba(102,102,255,0.4)]">
          <Sparkles size={36} className="text-[#0a0f1e]" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-4 border border-dashed border-[#6666ff]/20 rounded-3xl"
        />
      </motion.div>

      {/* Welcome text */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-2xl font-black text-white mb-2"
      >
        Welcome to Aura
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-sm text-white/50 text-center max-w-sm mb-8"
      >
        Ask to your own Books
      </motion.p>

      {/* Suggestion cards */}
      {/* <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-left transition-all cursor-pointer group"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#6666ff]/10 border border-[#6666ff]/20 flex items-center justify-center text-[#6666ff] group-hover:bg-[#6666ff]/20 transition-all">
              {suggestion.icon}
            </div>
            <span className="text-sm text-white/80 group-hover:text-white transition-all line-clamp-2">
              {suggestion.text}
            </span>
          </motion.button>
        ))}
      </motion.div> */}

      {/* Feature hints */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="mt-8 flex items-center gap-6 text-white/30"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={14} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Smart Replies</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen size={14} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Verified Sources</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={14} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Save Notes</span>
        </div>
      </motion.div> */}
    </div>
  );
}
