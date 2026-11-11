import React, { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatMessageContentProps {
  content: string;
  isUser?: boolean;
}

export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content, isUser }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="chat-markdown text-[15px] sm:text-[16px] leading-[1.7] tracking-[-0.01em] break-words text-slate-800 dark:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white mt-5 mb-2.5 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white mt-4.5 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[16px] sm:text-[17px] font-bold text-amber-600 dark:text-amber-400 mt-4 mb-2 first:mt-0 flex items-center gap-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-3.5 last:mb-0 leading-[1.7] text-slate-800 dark:text-slate-100 font-normal">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-950 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 mb-3.5 text-slate-800 dark:text-slate-100 marker:text-amber-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 mb-3.5 text-slate-800 dark:text-slate-100 marker:font-semibold marker:text-amber-600 dark:marker:text-amber-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.7] pl-1">
              {children}
            </li>
          ),
          hr: () => (
            <hr className="border-t border-slate-200/80 dark:border-white/10 my-4.5" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-amber-500 pl-4 py-1.5 my-3.5 bg-amber-500/5 rounded-r-xl text-slate-700 dark:text-slate-300 italic text-[15px]">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => {
            if (inline) {
              return (
                <code
                  className="bg-slate-200/80 dark:bg-white/10 px-2 py-0.5 rounded-md text-[13px] sm:text-[14px] font-mono font-medium text-amber-700 dark:text-amber-300 ring-1 ring-black/5 dark:ring-white/10"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-slate-950 text-slate-100 p-4 rounded-2xl overflow-x-auto my-3.5 text-[13px] sm:text-[14px] font-mono ring-1 ring-white/10 shadow-lg">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3.5 rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 shadow-sm">
              <table className="w-full text-[14px] border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left font-semibold text-slate-900 dark:text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-t border-slate-200/80 dark:border-white/5 text-slate-800 dark:text-slate-200">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
