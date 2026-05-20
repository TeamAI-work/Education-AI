import React from 'react';
import { Table } from 'lucide-react';

export default function TableBlock({ children }) {
  return (
    <div
      className="rounded-lg overflow-hidden my-4 w-full max-w-full bg-white/5 border border-white/10
                 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-shadow duration-300"
    >
      {/* ── Terminal Title Bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 select-none border-b border-white/5 bg-white/5">

        {/* Table badge */}
        <div className="flex items-center gap-1.5 rounded-md border border-[#6666ff]/20 bg-[#6666ff]/10 px-2.5 py-[3px] text-[10px] font-black tracking-wide uppercase font-mono text-[#6666ff]">
          <Table size={12} className="text-[#6666ff]" />
          <span>Data Table</span>
        </div>
      </div>

      {/* ── Table Content ── */}
      <div
        className="relative overflow-x-auto overflow-y-auto max-h-[800px] p-5
                   [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2
                   [&::-webkit-scrollbar-track]:bg-transparent
                   [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full
                   hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
      >
        <table className="w-full border-collapse table-auto text-sm text-white/90">
          {children}
        </table>
      </div>
    </div>
  );
}
