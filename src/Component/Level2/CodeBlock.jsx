import React from 'react';

export default function CodeBlock({ children, language = 'text' }) {
  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-white/10 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 select-none">
        <span className="text-[10px] font-black tracking-wide uppercase font-mono text-[#6666ff]">
          {language}
        </span>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-white/90 font-mono bg-black/20 m-0">
        <code className="bg-transparent p-0 break-normal">{children}</code>
      </pre>
    </div>
  );
}
