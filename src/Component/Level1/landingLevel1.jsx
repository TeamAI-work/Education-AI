import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Rocket, Star, Sparkles, Cloud, Sun, Heart, Music, Ghost } from 'lucide-react';


const FloatingIcon = ({ icon: Icon, delay, x, y, color, size = 24 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.4, 0.8, 0.4],
      scale: [1, 1.2, 1],
      x: [0, 15, 0],
      y: [0, -15, 0],
    }}
    transition={{ 
      duration: 5 + Math.random() * 3, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut" 
    }}
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, color }}
  >
    <Icon size={size} />
  </motion.div>
);

const SmileyMascot = () => (
  <motion.div
    initial={{ scale: 0, rotate: -20 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
    className="relative w-32 h-32 mb-8 mx-auto"
  >
    <motion.div
      animate={{ 
        y: [0, -10, 0],
        rotate: [-2, 2, -2]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="w-full h-full bg-[#FFD93D] rounded-full border-4 border-white/20 shadow-2xl flex items-center justify-center relative overflow-hidden"
    >
      {/* Eyes */}
      <div className="absolute top-1/3 w-full flex justify-center gap-6">
        <motion.div 
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.95, 1] }}
          className="w-3 h-4 bg-[#1a1a2e] rounded-full" 
        />
        <motion.div 
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.95, 1] }}
          className="w-3 h-4 bg-[#1a1a2e] rounded-full" 
        />
      </div>
      {/* Mouth */}
      <motion.div 
        animate={{ scaleX: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-1/4 w-12 h-6 border-b-4 border-[#1a1a2e] rounded-full" 
      />
      
      {/* Rosy Cheeks */}
      <div className="absolute top-1/2 w-full flex justify-between px-4">
        <div className="w-4 h-2 bg-[#FF8AAE]/40 blur-sm rounded-full" />
        <div className="w-4 h-2 bg-[#FF8AAE]/40 blur-sm rounded-full" />
      </div>
    </motion.div>
    
    {/* Animated Halo/Sparkle */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      className="absolute -inset-4 border-2 border-dashed border-[#00D166]/30 rounded-full"
    />
  </motion.div>
);

export default function LandingLevel1() {
  const navigate = useNavigate();
  const decorations = [
    { icon: Star, x: 10, y: 15, color: '#FFD93D', size: 32 },
    { icon: Cloud, x: 80, y: 10, color: '#FFFFFF', size: 48 },
    { icon: Sparkles, x: 20, y: 70, color: '#00D166', size: 28 },
    { icon: Heart, x: 75, y: 65, color: '#FF8AAE', size: 24 },
    { icon: Sun, x: 50, y: 5, color: '#FFD93D', size: 64 },
    { icon: Music, x: 5, y: 80, color: '#4ECDC4', size: 30 },
    { icon: Rocket, x: 85, y: 80, color: '#00D166', size: 40 },
    { icon: Ghost, x: 40, y: 85, color: '#A29BFE', size: 24 },
  ];

  return (

    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Background Decorations */}
      {decorations.map((dec, i) => (
        <FloatingIcon key={i} {...dec} delay={i * 0.5} />
      ))}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-2xl"
      >
        <SmileyMascot />
        
        <motion.div
          animate={{ 
            rotate: [-2, 2, -2],
            scale: [1, 1.02, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight">
            <span className="text-[#00D166] drop-shadow-[0_0_15px_rgba(0,209,102,0.5)]">HEY</span>
            <br />
            <span className="text-white">EXPLORER!</span>
          </h1>
        </motion.div>


        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 font-medium"
        >
          Ready to discover amazing things and have super-duper fun?
        </motion.p>

        {/* Massive Action Button */}
        <div className="flex justify-center">
          <div className="relative group">
            {/* Button Glow Effect */}
            <div className="absolute inset-0 bg-[#00D166] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500 rounded-full scale-90" />
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                boxShadow: [
                  "0 0 0px rgba(0,209,102,0)",
                  "0 0 40px rgba(0,209,102,0.4)",
                  "0 0 0px rgba(0,209,102,0)"
                ]
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity }
              }}
              onClick={() => navigate('/level1/dashboard')}
              className="relative px-12 py-6 bg-[#00D166] hover:bg-[#00b357] text-white rounded-full text-3xl font-black shadow-2xl transition-colors duration-300 flex items-center gap-4 border-4 border-white/20"
            >
              LET'S GO!
              <Rocket className="w-10 h-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-300" />
            </motion.button>
          </div>
        </div>


        {/* Bottom Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 flex justify-center gap-8 text-white/20"
        >
          {/* <Sparkles size={32} />
          <Star size={32} />
          <Sparkles size={32} /> */}
        </motion.div>
      </motion.div>

      {/* Floating Rainbow Overlay (Subtle) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,209,102,0.2),_transparent_70%)]" />

    </div>
  );
}
