import { motion } from 'framer-motion';
import { Camera, Upload, Lightbulb, Sparkles } from 'lucide-react';

export default function ShowAndTell() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0f1e] flex items-center justify-center font-['Outfit',sans-serif]">
      <div className="text-center space-y-6 max-w-md p-8">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-8xl"
        >
          📸
        </motion.div>
        <h1 className="text-4xl font-black text-white">Show & Tell</h1>
        <p className="text-gray-400 text-lg">Upload a picture and learn fun facts about it!</p>
        
        <motion.label
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex flex-col items-center gap-4 p-10 border-2 border-dashed border-[#00D166]/30
                     rounded-3xl cursor-pointer hover:border-[#00D166]/60 hover:bg-[#00D166]/5 transition-all"
        >
          <Upload size={40} className="text-[#00D166]" />
          <span className="text-white font-bold text-lg">Tap to upload a photo!</span>
          <span className="text-gray-500 text-sm">PNG, JPG, or WEBP</span>
          <input type="file" accept="image/*" className="hidden" />
        </motion.label>

        <div className="flex items-center gap-3 p-4 bg-[#00D166]/10 border border-[#00D166]/20 rounded-2xl">
          <Sparkles className="text-[#00D166]" size={20} />
          <p className="text-[#00D166] text-sm font-bold text-left">
            AI-powered fun facts coming soon! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
