import { Send } from 'lucide-react';

export default function ChatInputForm({ inputText, setInputText, isTyping, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="relative flex-shrink-0 select-none">
      <input
        autoFocus
        type="text"
        placeholder="Ask Aura (e.g. 'Explain Photosynthesis')"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isTyping}
        className="w-full bg-black/20 border border-white/5 focus:border-[#6666ff]/40 focus:ring-1 focus:ring-[#6666ff]/40 outline-none rounded-2xl py-3 pl-4 pr-14 text-xs font-semibold text-white placeholder-white/20 transition-all disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!inputText.trim() || isTyping}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#6666ff] text-[#0a0f1e] flex items-center justify-center hover:bg-[#5252e0] transition-all disabled:opacity-20 disabled:hover:bg-[#6666ff] cursor-pointer"
      >
        <Send size={14} />
      </button>
    </form>
  );
}
