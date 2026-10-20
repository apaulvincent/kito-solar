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
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[560px] lg:w-[600px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl transition-all duration-300"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ask Jenny
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Solar Assistant & System Sizer · <span className="font-mono text-[11px]">{aiCopilotService.getActiveEngineName()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetChat}
            title="Reset conversation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCopilotOpen(false)}
            title="Close Copilot"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scroll-smooth">
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
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-amber-500" />
                </div>
              )}

              <div className={`max-w-[88%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                {isUser ? (
                  <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-amber-500 text-white text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
                    <ChatMessageContent content={message.content} isUser={true} />
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-100">
                    <ChatMessageContent content={message.content} isUser={false} />
                  </div>
                )}

                {!isUser && message.engine && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
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
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            </div>
            <div className="px-3.5 py-2 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs font-mono ml-1.5 text-slate-500 dark:text-slate-400">
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
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 dark:text-slate-500 block">
              Quick Sizing Prompts
            </span>
            <button
              type="button"
              onClick={() => setDisplayedPrompts(getRandomPrompts(ALL_QUICK_SIZING_PROMPTS, 4))}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors px-2 py-0.5 rounded-md hover:bg-amber-500/10 cursor-pointer"
              title="Shuffle 4 new prompts"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Shuffle</span>
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {displayedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-left text-xs px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors line-clamp-1 cursor-pointer"
              >
                ✨ {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {rateLimitCooldown > 0 && (
          <div className="px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-spin" />
              <span>Rate limit active. Please wait for cooldown.</span>
            </div>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-100">
              {rateLimitCooldown}s
            </span>
          </div>
        )}

        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping || rateLimitCooldown > 0}
            placeholder={
              rateLimitCooldown > 0
                ? `Cooldown active (${rateLimitCooldown}s)...`
                : "Ask e.g. ₱15,000 bill in Cebu with battery backup..."
            }
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isTyping || rateLimitCooldown > 0}
            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
          <span>PEC Article 6.90 Compliance</span>
          <span>Press Enter to send</span>
        </div>
      </footer>
    </aside>
  );
};
