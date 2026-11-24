// src/components/header/Header.tsx
import { useState, useRef } from 'react';
import {
  RotateCcw,
  Zap,
  Sun,
  Moon,
  Coffee,
  LogOut,
  Box,
  Calculator,
  Home,
  MapPin,
  TrendingUp,
  Activity,
  Folder,
  Mail,
  Menu,
  X,
  WifiOff,
  Keyboard,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDismissable } from '@/hooks/useDismissable';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal';
import { ActiveView } from '@/types/calculator';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  view: ActiveView;
  requiresAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, view: 'home' },
  { id: 'tool', label: 'Solar Tool', icon: Box, view: 'tool' },
  { id: 'load-calculator', label: 'Load Calculator', icon: Calculator, view: 'load-calculator' },
  { id: 'solar-mapper', label: 'Roof Mapper', icon: MapPin, view: 'solar-mapper', requiresAuth: true },
  { id: 'financial-roi', label: 'ROI Simulator', icon: TrendingUp, view: 'financial-roi', requiresAuth: true },
  { id: 'yield-simulator', label: 'Yield Monitor', icon: Activity, view: 'yield-simulator', requiresAuth: true },
  { id: 'projects', label: 'Projects', icon: Folder, view: 'projects' },
  { id: 'contact', label: 'Contact', icon: Mail, view: 'contact' },
];

export function Header() {
  const resetToDefaults = useCalculatorStore((s) => s.resetToDefaults);
  const theme = useCalculatorStore((s) => s.theme);
  const toggleTheme = useCalculatorStore((s) => s.toggleTheme);
  const activeView = useCalculatorStore((s) => s.activeView);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isOnline = useNetworkStatus();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const {
    isOpen: isShortcutsOpen,
    open: openShortcuts,
    close: closeShortcuts,
    shortcuts,
  } = useKeyboardShortcuts();

  useDismissable({
    isOpen: isMobileMenuOpen,
    onClose: () => setIsMobileMenuOpen(false),
    containerRef: mobileMenuRef,
    closeOnEscape: true,
    closeOnOutsideClick: true,
  });

  const handleNavClick = (item: NavItem) => {
    setActiveView(item.requiresAuth && !user ? 'login' : item.view);
    setIsMobileMenuOpen(false);
  };

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

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden xl:flex items-center gap-1 font-sans text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.id === 'home' ? '' : 'text-amber-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline Mode Indicator */}
          {!isOnline && (
            <div
              role="status"
              aria-label="Offline Mode"
              title="You are currently offline. Calculations and CAD schematic run locally."
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono font-medium"
            >
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

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

          {/* Keyboard Shortcuts Button */}
          <button
            type="button"
            onClick={openShortcuts}
            title="Studio Keyboard Shortcuts (Press ?)"
            aria-label="Studio Keyboard Shortcuts"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 shadow-xs transition-colors hidden sm:flex items-center gap-1.5"
          >
            <Keyboard className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="hidden lg:inline text-[10px] text-slate-500 dark:text-slate-400 font-mono">?</span>
          </button>

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

          {/* Mobile Navigation Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            className="xl:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#090D16]/98 shadow-xl backdrop-blur-md px-4 py-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <nav
            aria-label="Mobile navigation"
            className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-sans text-xs font-semibold"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              return (
                <button
                  key={`mobile-${item.id}`}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-between text-left ${
                    isActive
                      ? 'text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.id === 'home' ? '' : 'text-amber-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.requiresAuth && !user && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Auth
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Quick Utility Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            {activeView === 'tool' ? (
              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-amber-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Configuration</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                Kito Solar v1.0
              </span>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openShortcuts();
                }}
                className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-amber-600 transition-colors"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Shortcuts</span>
              </button>

              <a
                href="https://ko-fi.com/mepapap"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 hover:underline"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Ko-fi</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={closeShortcuts}
        shortcuts={shortcuts}
      />
    </header>
  );
}
