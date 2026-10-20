// src/components/ai/SolarCopilotDrawer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { aiCopilotService, CopilotMessage } from '@/services/aiCopilotService';
import { SetupProposalCard } from './SetupProposalCard';
import { ChatMessageContent } from './ChatMessageContent';
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
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const ALL_QUICK_SIZING_PROMPTS: string[] = [
  // Original starter prompts
  '₱12,000/mo bill in San Pablo Laguna, daytime AC + brownout backup (Hybrid)',
  '₱8,000/mo bill in Metro Manila, daytime office use only (Grid-Tie)',
  'What if we keep the 8kW hybrid inverter, drop battery to 5kWh and use 10 panels?',
  "Why can't I put all 16 of these 580W panels into a single string?",

  // Realistic Philippine Residential & Commercial Sizing
  '₱5,500/mo bill in Cavite, 2-bedroom home with daytime inverter refrigerator (Grid-Tie)',
  '₱15,000/mo bill in Cebu City, heavy nighttime aircon + essential brownout backup (Hybrid)',
  '₱22,000/mo bill in Davao, residential bakery running daytime ovens and freezers',
  '₱3,500/mo electric bill in Batangas, starter 3kW grid-tie system to zero out daytime power',
  '₱18,000/mo bill in Quezon City, 2-storey house wanting 100% solar daytime coverage',
  '₱35,000/mo commercial warehouse in Bulacan with 3-phase connection (Grid-Tie)',
  '₱9,500/mo bill in Iloilo, frequent typhoon brownouts needing 10kWh battery storage',
  '₱14,000/mo bill in Pampanga with 4 split-type inverter ACs running during the afternoon',
  '₱6,000/mo bill in Rizal, GI sheet roof with limited 30 sqm space, maximize kWp',
  '₱28,000/mo bill in Tagaytay, villa with pool pump and induction cooking (Hybrid)',
  '₱7,500/mo bill in Baguio, cold-climate string voltage verification with 550W panels',
  '₱11,000/mo bill in Cagayan de Oro, hybrid system with Deye 6kW and 100Ah battery',
  '₱16,500/mo bill in Bacolod, farm office with daytime heavy water pump loads',
  '₱4,800/mo bill in Antipolo, compact grid-tie setup with net metering preparation',
  '₱25,000/mo cold storage facility in General Santos, daytime solar offset sizing',
  '₱10,500/mo bill in Naga Camarines Sur, typhoon resilience with essential loads backup',
  '₱30,000/mo bill in Pasig, commercial restaurant with walk-in chillers (Grid-Tie)',

  // Technical & Electrical Engineering Inquiries
  'How many hours of backup will a 10kWh battery give my 800W essential load in a brownout?',
  'Can I parallel two strings of 8 panels into a single MPPT on a Deye 6kW inverter?',
  'How do I size DC circuit breakers and surge protection (SPD) under PEC 6.90?',
  'What is the difference in payback between pure Grid-Tie vs Hybrid with 10kWh battery?',
  'How much roof area in square meters do I need for a 10kWp solar array?',
  'How does Meralco net-metering credit excess solar power generated on weekends?',
  'Can I start with a 5kW grid-tie system now and add batteries later?',
];

export function getRandomPrompts(pool: string[] = ALL_QUICK_SIZING_PROMPTS, count = 4): string[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export const STARTER_PROMPTS = ALL_QUICK_SIZING_PROMPTS;

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
        "Hi! I'm Jenny, your solar assistant. Enter your **monthly electric bill** (in ₱) and **location**, and I'll size a complete setup for you (including panels, inverter, and battery backup).",
      createdAt: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number>(0);
  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>(() =>
    getRandomPrompts(ALL_QUICK_SIZING_PROMPTS, 4)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCopilotOpen) {
      scrollToBottom();
    }
  }, [messages, isCopilotOpen]);

  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

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
      if (assistantReply.rateLimited && assistantReply.retryAfter) {
        setRateLimitCooldown(assistantReply.retryAfter);
      }
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
    setDisplayedPrompts(getRandomPrompts(ALL_QUICK_SIZING_PROMPTS, 4));
  };

  return (
    <aside
      aria-label="Ask Jenny Solar Assistant"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] md:w-[620px] lg:w-[680px] bg-slate-950/40 backdrop-blur-2xl p-2 sm:p-4 flex flex-col justify-end transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-2xl"
    >
      <div className="h-full w-full rounded-[2.25rem] p-2 bg-gradient-to-b from-white/90 via-slate-100/80 to-slate-200/60 dark:from-white/10 dark:via-white/[0.03] dark:to-black/50 ring-1 ring-slate-300/80 dark:ring-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden">
        <div className="h-full w-full rounded-[calc(2.25rem-0.5rem)] bg-white/95 dark:bg-[#070B14]/95 flex flex-col overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
          <header className="px-6 py-4.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm sm:text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Ask Jenny · Solar Assistant
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
                    Online
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {aiCopilotService.getActiveEngineName()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCopilotOpen(false)}
                title="Close Copilot"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scroll-smooth">
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
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 ring-1 ring-slate-200 dark:ring-white/10 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4 text-amber-500" />
                    </div>
                  )}

                  <div className={`max-w-[88%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {isUser ? (
                      <div className="px-5 py-3.5 rounded-[1.75rem] rounded-tr-sm bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 text-white font-medium text-[15px] sm:text-[16px] leading-[1.6] shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30 whitespace-pre-wrap">
                        <ChatMessageContent content={message.content} isUser={true} />
                      </div>
                    ) : (
                      <div className="p-1 rounded-[1.75rem] rounded-tl-sm bg-gradient-to-b from-slate-200/70 to-slate-100/40 dark:from-white/10 dark:to-white/[0.02] ring-1 ring-slate-200/80 dark:ring-white/5 shadow-sm">
                        <div className="px-5 py-4 rounded-[calc(1.75rem-0.25rem)] rounded-tl-sm bg-white/95 dark:bg-[#0B1120]/95 text-slate-800 dark:text-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                          <ChatMessageContent content={message.content} isUser={false} />
                        </div>
                      </div>
                    )}

                    {!isUser && message.engine && (
                      <div className="flex items-center gap-1.5 px-2">
                        <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">
                          {message.engine.startsWith('gemini')
                            ? '⚡ Powered by Gemini Flash'
                            : '⚙️ Powered by Deterministic PV Engine'}
                        </span>
                      </div>
                    )}

                    {proposalResult && proposalResult.engineeringSpecs && (
                      <SetupProposalCard proposal={proposalResult} />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 ring-1 ring-slate-200 dark:ring-white/10 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-amber-500 animate-spin" />
                </div>
                <div className="px-5 py-3.5 rounded-[1.5rem] rounded-tl-sm bg-slate-100/90 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 ring-1 ring-slate-200/60 dark:ring-white/5 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs sm:text-sm font-mono ml-2 text-slate-500 dark:text-slate-400">
                    Sizing system & matching hardware...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 block">
                  Quick Sizing Prompts:
                </span>
                <button
                  type="button"
                  onClick={() => setDisplayedPrompts(getRandomPrompts(ALL_QUICK_SIZING_PROMPTS, 4))}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors px-2 py-0.5 rounded-full hover:bg-amber-500/10 cursor-pointer active:scale-95"
                  title="Shuffle 4 new prompts"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Shuffle</span>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {displayedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs sm:text-[13px] px-4 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] hover:bg-amber-500/10 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 ring-1 ring-slate-200/70 dark:ring-white/5 hover:ring-amber-500/40 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] line-clamp-1 font-medium cursor-pointer"
                  >
                    ✨ {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 space-y-2">
            {rateLimitCooldown > 0 && (
              <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-spin [animation-duration:4s]" />
                  <span className="font-medium">Rate limit active. Please wait for cooldown.</span>
                </div>
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/30">
                  {rateLimitCooldown}s
                </span>
              </div>
            )}

            <div className="p-1 rounded-full bg-gradient-to-r from-slate-200/80 to-slate-100/50 dark:from-white/10 dark:to-white/[0.03] ring-1 ring-slate-200 dark:ring-white/10 shadow-inner">
              <div className="flex items-center rounded-full bg-white dark:bg-[#050811] px-2 py-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping || rateLimitCooldown > 0}
                  placeholder={
                    rateLimitCooldown > 0
                      ? `Cooldown active. Available in ${rateLimitCooldown}s...`
                      : "Ask e.g. ₱15,000 bill in Cebu with battery backup..."
                  }
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm sm:text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping || rateLimitCooldown > 0}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/25 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 group/send shrink-0"
                >
                  <Send className="w-4 h-4 transition-transform duration-200 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-3 pt-0.5">
              <span>Grounded in Philippine Electrical Code Article 6.90</span>
              <span>Press Enter to size</span>
            </div>
          </footer>
        </div>
      </div>
    </aside>
  );
};
