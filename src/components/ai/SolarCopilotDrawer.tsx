// src/components/ai/SolarCopilotDrawer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { aiCopilotService, CopilotMessage } from '@/services/aiCopilotService';
import { SetupProposalCard } from './SetupProposalCard';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  BookOpen,
  Zap,
  CheckCircle2,
  Bot,
  User,
} from 'lucide-react';

const STARTER_PROMPTS = [
  '₱12,000/mo bill in San Pablo Laguna, daytime AC + brownout backup (Hybrid)',
  '₱8,000/mo bill in Metro Manila, daytime office use only (Grid-Tie)',
  'What if we keep the 8kW hybrid inverter, drop battery to 5kWh and use 10 panels?',
  "Why can't I put all 16 of these 580W panels into a single string?",
];

export const SolarCopilotDrawer: React.FC = () => {
  const isCopilotOpen = useCalculatorStore((state) => state.isCopilotOpen);
  const setIsCopilotOpen = useCalculatorStore((state) => state.setIsCopilotOpen);
  const activeProjectId = useCalculatorStore((state) => state.activeProjectId);
  const activeProjectName = useCalculatorStore((state) => state.activeProjectName);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Welcome to Kito Solar AI Copilot. Enter your **monthly electric bill** (in ₱) and **location** to automatically generate a code-compliant PV design, or ask technical questions regarding string voltages and PEC standards.",
      createdAt: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCopilotOpen) {
      scrollToBottom();
    }
  }, [messages, isCopilotOpen]);

  if (!isCopilotOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: CopilotMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const assistantReply = await aiCopilotService.sendMessage(nextMessages, activeProjectId);
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      console.error('Copilot send error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Unable to reach the sizing assistant at this moment. Please try again shortly.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content:
          "Conversation reset. What monthly bill and Philippine location should we size today?",
        createdAt: new Date(),
      },
    ]);
  };

  return (
    <aside
      aria-label="Solar Engineering AI Copilot"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[540px] bg-slate-100/80 dark:bg-black/60 backdrop-blur-2xl p-2 sm:p-4 flex flex-col justify-end transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-2xl"
    >
      {/* Double-Bezel Shell */}
      <div className="h-full w-full rounded-[2rem] p-1.5 bg-gradient-to-b from-white/80 via-slate-100/70 to-slate-200/50 dark:from-slate-800/80 dark:via-slate-900/60 dark:to-[#070B14]/80 ring-1 ring-slate-300/80 dark:ring-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Inner Core Enclosure */}
        <div className="h-full w-full rounded-[calc(2rem-0.375rem)] bg-white/95 dark:bg-[#080D1A]/95 flex flex-col overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* Header */}
          <header className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-100">
                    Kito AI Sales Engineer
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-[0.2em] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
                    Online
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {aiCopilotService.getActiveEngineName()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCopilotOpen(false)}
                title="Close Copilot"
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs scroll-smooth">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const proposalResult = message.toolInvocations?.find(
                (t) =>
                  t.toolName === 'generateSolarSetup' ||
                  t.toolName === 'generateSolarSetupFromBill' ||
                  t.toolName === 'modifyExistingProjectSetup'
              )?.result as any;

              return (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-tr-none shadow-md shadow-amber-500/10 font-medium'
                          : 'bg-slate-100/90 dark:bg-white/[0.04] text-slate-800 dark:text-slate-200 rounded-tl-none ring-1 ring-slate-200/60 dark:ring-white/5'
                      }`}
                    >
                      {message.content}
                    </div>

                    {!isUser && message.engine && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500">
                          {message.engine === 'gemini-2.5-flash'
                            ? '⚡ Powered by Gemini 2.5 Flash'
                            : '⚙️ Powered by Deterministic PV Engine'}
                        </span>
                      </div>
                    )}

                    {/* Generative UI Proposal Card */}
                    {proposalResult && proposalResult.engineeringSpecs && (
                      <SetupProposalCard proposal={proposalResult} />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 rounded-tl-none ring-1 ring-slate-200/60 dark:ring-white/5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] font-mono ml-2">Calculating system & matching catalog...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1.5">
                Quick Sizing Prompts:
              </span>
              <div className="flex flex-col gap-1.5">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] hover:bg-amber-500/10 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 ring-1 ring-slate-200/60 dark:ring-white/5 hover:ring-amber-500/30 transition-all duration-200 line-clamp-1"
                  >
                    ✨ {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Machined Input Enclosure */}
          <footer className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
            <div className="relative flex items-center rounded-full bg-white dark:bg-[#050811] ring-1 ring-slate-200 dark:ring-white/10 p-1 shadow-inner">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask e.g. ₱15,000 bill in Cebu with battery backup..."
                className="flex-1 bg-transparent px-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-center hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 px-3 pt-2">
              <span>Grounded in Philippine Electrical Code Article 6.90</span>
              <span>Press Enter to size</span>
            </div>
          </footer>
        </div>
      </div>
    </aside>
  );
};
