import {
  Mail,
  Shield,
  Calendar,
  LogOut,
  Fingerprint,
  Clock,
  ArrowLeft,
  Box,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { formatDisplayDate } from '@/lib/timeFormat';
import { LoginRequiredPrompt } from '@/components/common/LoginRequiredPrompt';

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#090D16]">
        <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <LoginRequiredPrompt
            title="Sign in to view your account"
            description="Access your profile details, verified authentication status, and personal preferences."
            registerLabel="Create New Account"
          />
        </div>
      </div>
    );
  }

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Solar Engineer';
  const provider = user.app_metadata?.provider || 'email';
  const createdAt = formatDisplayDate(
    user.created_at,
    { year: 'numeric', month: 'long', day: 'numeric' },
    'Recent Member'
  );
  const lastSignInAt = formatDisplayDate(
    user.last_sign_in_at,
    { year: 'numeric', month: 'short', day: 'numeric' },
    'Current Session'
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#090D16] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
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
            <span>Solar Tool</span>
          </button>
        </div>

        {/* Profile Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 p-8 text-slate-950 dark:text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-slate-950/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black text-white shadow-inner">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/20 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-white mb-1.5">
                  <Shield className="w-3 h-3 text-amber-300" />
                  Solar Studio Account
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{fullName}</h1>
                <p className="text-xs text-amber-100 font-mono mt-0.5">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4 text-amber-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                PROFILE & IDENTITY
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Account Details
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
              Account Verified
            </span>
          </div>

          <div className="space-y-4">
            {/* Email Address */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Email Address</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {user.email}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>

            {/* Authentication Provider */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Auth Provider</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white capitalize mt-0.5">
                    {provider === 'google' ? 'Google OAuth' : 'Email / Password'}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Creation Date */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Member Since</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {createdAt}
                  </div>
                </div>
              </div>
            </div>

            {/* Last Active Session */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Last Sign In</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {lastSignInAt}
                  </div>
                </div>
              </div>
            </div>

            {/* Account ID / UID */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Account ID</div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                    {user.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
