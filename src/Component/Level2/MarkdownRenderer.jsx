import React, { useContext, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import TableBlock from "./TableBlock";

export const TableContext = React.createContext(false);

export function useMarkdownComponents() {
  return useMemo(
    () => ({
      code({ node, inline, className, children, ...props }) {
        const inTable = useContext(TableContext);
        const match = /language-(\w+)/.exec(className || "");
        const lang = match ? match[1] : null;
        const content = String(children).replace(/\n$/, "");
        const isOneLine = !content.includes("\n");
        const isShort = content.length < 60;

        // Force inline rendering for short content even if markdown said it's a block
        // We do this for plain text, null language, or explicitly marked "text" blocks.
        const isPlain = !lang || lang === "text" || lang === "markdown" || lang === "txt";
        const shouldBeInline = inline || (isOneLine && isShort && isPlain);

        // If it's a multi-line block, or a long block, or a labeled language block (not plain),
        // we use the full CodeBlock.
        if (!shouldBeInline && (inTable || !inline)) {
          return <CodeBlock language={lang || "text"}>{children}</CodeBlock>;
        }

        return (
          <code
            className="font-mono text-[0.875em] bg-[#6666ff]/15 text-[#8c8cff] px-1.5 py-0.5 rounded-md font-medium break-all"
            {...props}
          >
            {content}
          </code>
        );
      },
      ul({ children }) {
        return (
          <ul className="my-2 p-0 list-none flex flex-col gap-1.5 [&_ul]:mt-1 [&_ul]:mb-1 [&_ul]:ml-2 [&_ul]:pl-3 [&_ul]:border-l-2 [&_ul]:border-[#6666ff]/20">
            {children}
          </ul>
        );
      },
      ol({ children }) {
        return (
          <ol className="my-2 p-0 list-none flex flex-col gap-1.5 [&_ol]:mt-1 [&_ol]:mb-1 [&_ol]:ml-2 [&_ol]:pl-3 [&_ol]:border-l-2 [&_ol]:border-[#6666ff]/20">
            {children}
          </ol>
        );
      },
      li({ children, index, ordered }) {
        return (
          <li className="flex items-start gap-2.5 px-2.5 py-[5px] rounded-lg list-none transition-colors">
            {ordered ? (
              <span className="shrink-0 min-w-[22px] h-[22px] flex items-center justify-center text-[11px] font-semibold text-[#6666ff] bg-[#6666ff]/15 border border-[#6666ff]/20 rounded-md font-mono tracking-[-0.3px] mt-px">
                {`${(index ?? 0) + 1}.`}
              </span>
            ) : (
              <span className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-[#6666ff] shadow-[0_0_6px_rgba(102,102,255,0.4)]" />
            )}
            <span className="flex-1 leading-[1.6] text-white/80">{children}</span>
          </li>
        );
      },
      table({ children }) {
        return (
          <TableContext.Provider value={true}>
            <TableBlock>{children}</TableBlock>
          </TableContext.Provider>
        );
      },
      tr({ children }) {
        return <tr className="border-b border-white/10 last:border-b-0">{children}</tr>;
      },
      td({ children }) {
        return <td className="px-3 py-2 text-left border-r border-white/10 last:border-r-0 text-white/80">{children}</td>;
      },
      th({ children }) {
        return <th className="px-3 py-2 text-left border-r border-white/10 last:border-r-0 bg-white/5 font-black text-[#6666ff] tracking-wide uppercase text-[10px]">{children}</th>;
      },
    }),
    []
  );
}

export default function MarkdownRenderer({ content }) {
  const mdComponents = useMarkdownComponents();
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {content}
    </ReactMarkdown>
  );
}
