import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  Copy,
  Check,
  Sun,
  Building2,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  LucideIcon,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Autocomplete } from '@/components/common/Autocomplete';
import { useTimedFlag } from '@/hooks/useTimedFlag';

type InquiryCategory = 'sizing' | 'quotes' | 'feedback' | 'general';

interface FormState {
  fullName: string;
  email: string;
  category: InquiryCategory;
  systemScope: string;
  subject: string;
  message: string;
  honeypot: string;
}

const CATEGORIES: { id: InquiryCategory; label: string; icon: LucideIcon; desc: string }[] = [
  {
    id: 'sizing',
    label: 'System Sizing',
    icon: Sun,
    desc: 'Help calculating panels, inverters, or battery backup',
  },
  {
    id: 'quotes',
    label: 'Installation & Quotes',
    icon: Building2,
    desc: 'Net metering, equipment, or finding an installer',
  },
  {
    id: 'feedback',
    label: 'App Feedback',
    icon: MessageSquare,
    desc: 'Feature suggestions, improvements, or bug reports',
  },
  {
    id: 'general',
    label: 'General Inquiry',
    icon: HelpCircle,
    desc: 'General questions, partnerships, or advisory',
  },
];

const SYSTEM_TOPICS = [
  'Grid-Tie Solar (Net Metering)',
  'Grid-Tie Solar (Zero-Export)',
  'Hybrid Solar (Solar + Battery)',
  'Off-Grid Solar System',
  'Commercial / Business Solar',
  'General Inquiry / Other',
];

// Dynamically assembled at runtime to avoid exposing a plaintext address literal in client bundles.
function getSecureTargetRecipient(): string {
  const bytes = [107, 105, 116, 111, 100, 97, 100, 100, 117, 109, 100, 117, 109, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];
  return String.fromCharCode(...bytes);
}

export function ContactPage() {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    email: '',
    category: 'sizing',
    systemScope: 'Grid-Tie Solar (Net Metering)',
    subject: '',
    message: '',
    honeypot: '',
  });

  const [mountTimestamp, setMountTimestamp] = useState<number>(0);
  const [isHumanVerified, setIsHumanVerified] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'bot_detected' | 'error'>('idle');

  const [emailRevealed, setEmailRevealed] = useState<boolean>(false);
  const [hasCopiedEmail, triggerCopiedEmail] = useTimedFlag(2000);
  const formRef = useRef<HTMLFormElement>(null);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    setMountTimestamp(Date.now());
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
      if (hiddenLinkRef.current?.parentNode) {
        hiddenLinkRef.current.parentNode.removeChild(hiddenLinkRef.current);
      }
    };
  }, []);

  const getPublicDisplayEmail = () => {
    const user = 'support';
    const domain = 'kitosolar.ph';
    return `${user}@${domain}`;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(getPublicDisplayEmail());
    triggerCopiedEmail();
  };

  const buildMailtoDispatchUrl = () => {
    const to = getSecureTargetRecipient();
    const subject = encodeURIComponent(
      `[Kito Solar Inquiry] ${formData.subject ? formData.subject : formData.category}`
    );
    const body = encodeURIComponent(
      `Sender Name: ${formData.fullName}\n` +
      `Sender Email: ${formData.email}\n` +
      `System Scope: ${formData.systemScope}\n` +
      `Category: ${formData.category}\n\n` +
      `Message:\n${formData.message}`
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.honeypot.trim() !== '') {
      setSubmitStatus('bot_detected');
      return;
    }

    // Reject instant programmatic submissions (<1.2s after mount).
    if (Date.now() - mountTimestamp < 1200) {
      setSubmitStatus('bot_detected');
      return;
    }

    if (!isHumanVerified) {
      setSubmitStatus('error');
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);

    const hiddenLink = document.createElement('a');
    hiddenLink.href = buildMailtoDispatchUrl();
    hiddenLink.style.display = 'none';
    document.body.appendChild(hiddenLink);
    hiddenLinkRef.current = hiddenLink;
    hiddenLink.click();

    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }
    submitTimerRef.current = setTimeout(() => {
      submitTimerRef.current = null;
      if (hiddenLink.parentNode) {
        hiddenLink.parentNode.removeChild(hiddenLink);
      }
      hiddenLinkRef.current = null;
      setIsSubmitting(false);
      setSubmitStatus('success');
    }, 400);
  };

  return (
    <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] border border-slate-200/60 dark:border-white/[0.08] transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Studio</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <Mail className="w-3 h-3 fill-current" />
            Get in Touch • Manila (PHT)
          </span>
        </div>

        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Have questions about sizing your solar setup, equipment options, or software feedback? Send us a message and our team will get back to you within 24 hours.
          </p>
        </div>
      </div>

      {/* Grid: 5-Col Info / 7-Col Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Contact Details */}
        <div className="lg:col-span-5">
          <div className="rounded-[2rem] p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-slate-100/60 dark:bg-white/[0.03]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0B0F17] p-6 sm:p-7 shadow-xs space-y-6">
              <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 block">
                  CONTACT DETAILS
                </span>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Get in Touch
                </h2>
              </div>

              <div className="space-y-4 text-xs">
                {/* Scraper-Protected Direct Email Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      Contact Email
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Anti-Scrape Protected
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {emailRevealed ? (
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white select-all">
                        {getPublicDisplayEmail()}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-slate-400 select-none">
                        s•••••••@kitosolar.ph
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {!emailRevealed ? (
                        <button
                          type="button"
                          onClick={() => setEmailRevealed(true)}
                          className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                          Reveal Email
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/15 transition-colors cursor-pointer"
                        >
                          {hasCopiedEmail ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Operating Hours */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Location
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                        Metro Manila, Philippines
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/50 dark:border-white/[0.04]">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                        Business Hours
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 block font-mono text-[11px] mt-0.5">
                        Monday – Friday, 8:00 AM – 6:00 PM (PHT)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Privacy Guarantee Note */}
                <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Privacy Guarantee</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Your contact details and message remain strictly confidential in accordance with the Philippine Data Privacy Act (RA 10173).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Send us a message */}
        <div className="lg:col-span-7">
          <div className="rounded-[2rem] p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-slate-100/60 dark:bg-white/[0.03]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0B0F17] p-6 sm:p-9 shadow-xs space-y-7">
              <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400 font-bold block">
                  CONTACT FORM
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Send us a message
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Fill out the form below and our team will get in touch.
                </p>
              </div>

              {submitStatus === 'success' ? (
                <div className="p-6 sm:p-7 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Message Prepared &amp; Sent!
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        We will reply to <strong>{formData.email}</strong> shortly.
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Thank you, <strong>{formData.fullName}</strong>. If your email application did not open automatically, click the button below to complete sending:
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={buildMailtoDispatchUrl()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Email App to Send</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setSubmitStatus('idle');
                        setFormData({
                          fullName: '',
                          email: '',
                          category: 'sizing',
                          systemScope: 'Grid-Tie Solar (Net Metering)',
                          subject: '',
                          message: '',
                          honeypot: '',
                        });
                        setIsHumanVerified(false);
                        setMountTimestamp(Date.now());
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <span>Send Another Message</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  {/* Invisible Bot Honeypot */}
                  <div aria-hidden="true" className="opacity-0 absolute -z-50 pointer-events-none select-none h-0 w-0 overflow-hidden">
                    <label htmlFor="hp_company_website">Website URL (Leave blank)</label>
                    <input
                      id="hp_company_website"
                      type="text"
                      name="hp_company_website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    />
                  </div>

                  {/* 1. Category Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400 block">
                      How can we help?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {CATEGORIES.map((cat) => {
                        const isSelected = formData.category === cat.id;
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.id })}
                            className={`p-3.5 rounded-2xl text-left transition-all duration-300 cursor-pointer border ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500/[0.04] text-slate-900 dark:text-white font-bold'
                                : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-500' : 'text-slate-400'}`} />
                              <span className="text-xs font-bold">{cat.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                              {cat.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Contact Identity Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="full-name-input"
                        className="block text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400"
                      >
                        Your Name
                      </label>
                      <input
                        id="full-name-input"
                        type="text"
                        required
                        placeholder="Juan Dela Cruz"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="email-input"
                        className="block text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400"
                      >
                        Email Address
                      </label>
                      <input
                        id="email-input"
                        type="email"
                        required
                        placeholder="juan@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 3. System Scope Autocomplete & Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="scope-select"
                        className="block text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400"
                      >
                        System Type
                      </label>
                      <Autocomplete<string>
                        id="scope-select"
                        options={SYSTEM_TOPICS}
                        value={formData.systemScope}
                        onChange={(val) => setFormData({ ...formData, systemScope: val || '' })}
                        getOptionLabel={(opt) => opt}
                        placeholder="Select or search system type..."
                        clearable={true}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="subject-input"
                        className="block text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400"
                      >
                        Subject
                      </label>
                      <input
                        id="subject-input"
                        type="text"
                        required
                        placeholder="e.g. Sizing for a 5kW home solar system"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 4. Message Body */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="message-input"
                      className="block text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500 dark:text-slate-400"
                    >
                      Message
                    </label>
                    <textarea
                      id="message-input"
                      rows={4}
                      required
                      placeholder="Tell us about your project, questions, or what you need help with..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 text-xs font-medium rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none transition-colors leading-relaxed"
                    />
                  </div>

                  {/* 5. Human Verification Switch */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className={`w-4 h-4 ${isHumanVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <label htmlFor="human-verify-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Human Verification
                      </label>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="human-verify-toggle"
                        type="checkbox"
                        checked={isHumanVerified}
                        onChange={(e) => setIsHumanVerified(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                  </div>

                  {/* Error Banner */}
                  {submitStatus === 'bot_detected' && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Automated script detected. Please submit manually after reviewing your message.</span>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Please complete all fields and verify you are human before sending.</span>
                    </div>
                  )}

                  {/* Submit Button (Button-in-Button Architecture) */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isHumanVerified}
                      className="group inline-flex items-center gap-3 rounded-full pl-6 pr-2 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>{isSubmitting ? 'Sending...' : 'Send message'}</span>
                      <span className="w-7 h-7 rounded-full bg-slate-950/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-105">
                        {isSubmitting ? <Send className="w-3.5 h-3.5 animate-pulse" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
