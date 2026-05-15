import { motion, useAnimation } from 'framer-motion';
import { Rocket, Compass, Brain, GraduationCap, Star, Zap, BookOpen, FlaskConical, Calculator, Lightbulb, Trophy, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const icons = {
  1: Rocket,
  2: Compass,
  3: Brain,
  4: GraduationCap
};

// Floating icons that slide out from behind the card on hover
const floatingIcons = {
  1: [Star, Zap, BookOpen],
  2: [Calculator, Lightbulb, FlaskConical],
  3: [Target, BookOpen, Trophy],
  4: [Trophy, Lightbulb, Star],
};

const colorVars = {
  1: { text: 'text-[#00D166]', bg: 'bg-[#00D166]', glow: 'rgba(0,209,102,0.3)' },
  2: { text: 'text-[#4ECDC4]', bg: 'bg-[#4ECDC4]', glow: 'rgba(78,205,196,0.3)' },
  3: { text: 'text-[#45B7D1]', bg: 'bg-[#45B7D1]', glow: 'rgba(69,183,209,0.3)' },
  4: { text: 'text-[#6C5CE7]', bg: 'bg-[#6C5CE7]', glow: 'rgba(108,92,231,0.3)' },
};


const cardVariants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -12, scale: 1.03, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  tap: { scale: 0.97, transition: { duration: 0.1 } },
};

// Each floating icon slides from behind the card to a different side
const floatPositions = [
  { initial: { x: 0, y: 0, opacity: 0, scale: 0.4 }, hover: { x: -52, y: -20, opacity: 1, scale: 1 } },
  { initial: { x: 0, y: 0, opacity: 0, scale: 0.4 }, hover: { x: 52, y: -36, opacity: 1, scale: 1 } },
  { initial: { x: 0, y: 0, opacity: 0, scale: 0.4 }, hover: { x: -38, y: 48, opacity: 1, scale: 1 } },
];

export default function LevelCard({ level, title, description, range, path }) {
  const nav = useNavigate()

  const Icon = icons[level];
  const FloatIcons = floatingIcons[level];
  const color = colorVars[level];
  const controls = useAnimation();

  const handleHoverStart = () => controls.start('hover');
  const handleHoverEnd = () => controls.start('rest');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: level * 0.12 }}
      className="relative group cursor-pointer"
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onClick={()=>{nav(path)}}
    >
      {/* Ambient outer glow */}
      <div
        className="absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-60 transition-all duration-500"
        style={{ background: color.glow }}
      />

      {/* Main Card */}
      <motion.div
        variants={cardVariants}
        initial="rest"
        animate={controls}
        whileTap="tap"
        className="relative glass glass-hover p-8 rounded-3xl h-full flex flex-col items-center text-center overflow-visible border border-white/10"
        style={{ position: 'relative' }}
      >
        {/* Subtle inner glow blob */}
        <div
          className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
          style={{ background: color.glow }}
        />

        {/* Main Icon with floating decorative icons */}
        <div className="relative mb-6 flex items-center justify-center w-20 h-20">
          {/* Floating orbit icons — slide from center behind the main icon */}
          {FloatIcons.map((FloatIcon, i) => (
            <motion.div
              key={i}
              variants={{
                rest: floatPositions[i].initial,
                hover: {
                  ...floatPositions[i].hover,
                  transition: {
                    duration: 0.45,
                    delay: i * 0.07,
                    ease: [0.34, 1.56, 0.64, 1], // spring-like overshoot
                  },
                },
              }}
              initial="rest"
              animate={controls}
              className="absolute p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <FloatIcon className={`w-4 h-4 ${color.text}`} />
            </motion.div>
          ))}

          {/* Main icon container */}
          <motion.div
            variants={{
              rest: { scale: 1, rotate: 0 },
              hover: { scale: 1.15, rotate: -8, transition: { duration: 0.35, ease: 'easeOut' } },
            }}
            initial="rest"
            animate={controls}
            className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <Icon className={`w-10 h-10 ${color.text}`} />
          </motion.div>
        </div>

        <span className={`text-xs font-bold tracking-widest uppercase mb-2 ${color.text} opacity-70`}>
          Level {level}
        </span>

        <h3 className="text-2xl font-bold mb-3 text-white">
          {title}
        </h3>

        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {description}
        </p>

        <div className="mt-auto pt-6 border-t border-white/5 w-full flex items-center justify-between">
          <motion.span 
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.05, transition: { duration: 0.2 } }
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider uppercase ${color.text} border border-current/20 shadow-lg`}
            style={{ backgroundColor: color.glow }}
          >
            {range}
          </motion.span>
          
          <motion.span
            variants={{
              rest: { x: -4, opacity: 0 },
              hover: { x: 0, opacity: 1, transition: { duration: 0.3, delay: 0.1 } },
            }}
            initial="rest"
            animate={controls}
            className={`text-xs font-bold ${color.text} flex items-center gap-1`}
          >
            Start →
          </motion.span>
        </div>

      </motion.div>
    </motion.div>
  );
}
