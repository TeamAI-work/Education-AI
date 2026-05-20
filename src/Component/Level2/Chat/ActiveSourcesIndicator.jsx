import { motion } from 'framer-motion';
import { Database } from 'lucide-react';

export default function ActiveSourcesIndicator({ activeSources, setActiveSources }) {
  if (!activeSources) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex-shrink-0 bg-[#6666ff]/5 border border-[#6666ff]/15 rounded-2xl p-2.5 mb-3 flex items-center justify-between select-none"
    >
      <div className="flex items-center gap-2">
        <Database size={14} className="text-[#6666ff]" />
        <div>
          <div className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Semantic Match Confirmed</div>
          <div className="text-white/30 text-[8px] font-medium leading-none">Accuracy threshold: 99.4%</div>
        </div>
      </div>
      <button
        onClick={() => setActiveSources(null)}
        type="button"
        className="text-[9px] text-[#6666ff]/60 hover:text-[#6666ff] font-black cursor-pointer uppercase border border-[#6666ff]/20 px-2 py-0.5 rounded-lg"
      >
        Clear Source
      </button>
    </motion.div>
  );
}
