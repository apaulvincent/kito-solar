// src/components/projects/ProjectsPage.tsx
import { ArrowLeft, Box, Folder, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SavedProjectsList } from '@/components/account/SavedProjectsList';

export function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#090D16]">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs flex-shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                  LOGIN REQUIRED
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Sign in to view your projects
                </h3>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Access your saved solar configurations, sizing details, and electrical calculations.
          </p>

          {/* Actions (Consistent button size and font) */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveView('login')}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Log In to Account</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('register')}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Account</span>
            </button>
          </div>

          {/* Guest Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setActiveView('tool')}
              className="text-xs font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
            >
              Continue to Solar Tool as guest &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#090D16] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('tool')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-xs"
          >
            <Box className="w-3.5 h-3.5 text-amber-500" />
            <span>Open Solar Tool</span>
          </button>
        </div>

        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 p-8 text-slate-950 dark:text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-950/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Folder className="w-8 h-8 fill-current text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/20 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-white mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Cloud Project Hub
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  My Solar Projects
                </h1>
                <p className="text-xs text-amber-100 font-mono mt-0.5">
                  Saved equipment configurations, string sizing schedules, and installation BOMs.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('tool')}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Box className="w-4 h-4 text-amber-400" />
              <span>Launch Solar Tool</span>
            </button>
          </div>
        </div>

        {/* Saved Projects Dashboard */}
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <SavedProjectsList />
        </div>
      </div>
    </div>
  );
}
