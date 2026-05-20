import MarkdownRenderer from '../MarkdownRenderer';
import { FileSearch, CornerDownRight } from 'lucide-react';

export default function MessageItem({ msg }) {
  const isBot = msg.sender === 'bot';
  return (
    <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} w-full`}>
      <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black text-white/35 uppercase tracking-wider select-none">
        <span>{msg.time}</span>
      </div>

      <div
        className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed break-words font-medium select-text
          ${isBot
            ? 'bg-white/5 text-white/90 border border-white/5 rounded-tl-sm shadow-md'
            : 'bg-[#6666ff]/10 text-[#6666ff] border border-[#6666ff]/20 rounded-tr-sm shadow-[0_2px_10px_rgba(102,102,255,0.05)]'
          }`}
      >
        {isBot ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0">
            <MarkdownRenderer content={msg.text} />
          </div>
        ) : (
          msg.text.split('\n').map((line, lIdx) => (
            <span key={lIdx} className="block">{line}</span>
          ))
        )}

        {isBot && msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
          <div className="mt-3.5 pt-2.5 border-t border-white/5 select-none">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              <FileSearch size={10} className="text-[#6666ff]" />
              <span>Citations:</span>
            </div>
            <div className="flex flex-col gap-1">
              {msg.sources.map((src, sIdx) => (
                <div key={sIdx} className="flex items-center gap-1 text-[10px] text-white/50 font-medium">
                  <CornerDownRight size={10} className="text-[#6666ff]/70" />
                  <span className="italic">{src}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
