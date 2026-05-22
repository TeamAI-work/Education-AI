import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function ChatHeader({ isNotebook, setIsNotebook }) {
  const navigate = useNavigate();
  return (
    <header className="relative z-20 flex-shrink-0 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/level2')}
          className="p-2 rounded-lg bg-white/5 border border-white/8 text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-xl font-black tracking-tight leading-none text-white">Academic Chatbot</h1>
            <span className="hidden md:block text-[9px] bg-[#6666ff]/10 border border-[#6666ff]/30 text-[#6666ff] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              RAG Engine Active
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsNotebook(!isNotebook)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 select-none ${
          isNotebook
            ? 'bg-[#6666ff]/20 border-[#6666ff]/40 text-[#6666ff]'
            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
        }`}
      >
        <BookOpen size={14} className={isNotebook ? "text-[#6666ff]" : ""} />
        <span className="hidden sm:inline">{isNotebook ? 'Close Notebook' : 'Open Notebook'}</span>
        <span className="sm:hidden">{isNotebook ? 'Notebook' : 'Notebook'}</span>
      </button>
    </header>
  );
}
