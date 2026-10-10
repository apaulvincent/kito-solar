// src/components/account/AccountPage.tsx
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  LogOut,
  Box,
  Layers,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#090D16]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign in to view your account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your saved solar configurations, profile details, and cloud calculations.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveView('login')}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Log In to Account
            </button>
            <button
              type="button"
              onClick={() => setActiveView('register')}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Solar Engineer';
  const provider = user.app_metadata?.provider || 'email';
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent Member';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#090D16] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-500 p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black text-white shadow-inner">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
                  <Shield className="w-3 h-3 text-amber-300" />
                  Solar Studio Account
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{fullName}</h1>
                <p className="text-xs text-indigo-100 font-mono mt-0.5">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2-Column Info Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: Account Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                ACCOUNT DETAILS
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Email</div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Auth Provider</div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white capitalize">
                        {provider === 'google' ? 'Google OAuth' : 'Email / Password'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Joined Date</div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {createdAt}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Active Project & Quick Tool Launch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase font-bold">
                    ACTIVE SOLAR DESIGN
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Current Workspace Configuration
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('tool')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                >
                  <Box className="w-4 h-4" />
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid of Key System Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Array Capacity</div>
                  <div className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {calculationResult.summary.totalArrayPowerKw} kWp
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {calculationResult.summary.totalPanels} Modules
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Inverter</div>
                  <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                    {calculationResult.summary.inverterPowerKw} kW
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    {calculationResult.summary.inverterModel}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">DC Isolator</div>
                  <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                    {calculationResult.dc.isolatorRatingA} A
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">1000V DC Rotary</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">DC Breaker</div>
                  <div className="text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                    {calculationResult.dc.breakerRatingA} A
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">125% Continuous</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">AC Breaker</div>
                  <div className="text-base font-black font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                    {calculationResult.ac.breakerRatingA} A
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">2-Pole 230V MCB</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Grounding</div>
                  <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Bare Cu
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">UL 467 Listed</div>
                </div>
              </div>

              {/* Direct Studio Call-to-action */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Ready to adjust your design?
                  </h4>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                    Navigate to the 3D CAD studio to inspect wall equipment and mounting hardware.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('tool')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
                >
                  Launch Tool
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
