// src/components/header/Header.tsx
import {
  RotateCcw,
  Zap,
  Sun,
  Moon,
  Coffee,
  LogOut,
  Box,
  Home,
  Folder,
  User as UserIcon,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';

export function Header() {
  const resetToDefaults = useCalculatorStore((s) => s.resetToDefaults);
  const theme = useCalculatorStore((s) => s.theme);
  const toggleTheme = useCalculatorStore((s) => s.toggleTheme);
  const activeView = useCalculatorStore((s) => s.activeView);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md shadow-xs transition-colors duration-200">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                KITO SOLAR
              </span>
            </button>

            {/* Navigation Links: Home, Tool, Account */}
            <nav className="flex items-center gap-1 font-sans text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeView === 'home'
                    ? 'text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('tool')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeView === 'tool'
                    ? 'text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-amber-500" />
                <span>Solar Tool</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('projects')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeView === 'projects'
                    ? 'text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>Projects</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => setActiveView('account')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeView === 'account'
                      ? 'text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Account</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* When on Tool page: Reset Button */}
            {activeView === 'tool' && (
              <button
                onClick={resetToDefaults}
                title="Reset to Default Configuration"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden xl:inline">Reset</span>
              </button>
            )}

            {/* Coffee Support */}
            <a
              href="https://ko-fi.com/mepapap"
              target="_blank"
              rel="noopener noreferrer"
              title="Support development on Ko-fi"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-mono font-medium text-amber-800 dark:text-amber-300 shadow-xs transition-colors"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Buy me Coffee</span>
            </a>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>

            {/* Auth Buttons / Profile Indicator */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveView('account')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  title="View your account"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate hidden sm:inline">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>
                <button
                  onClick={signOut}
                  title="Sign out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Log in
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('register')}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm active:scale-95 transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
  );
}
