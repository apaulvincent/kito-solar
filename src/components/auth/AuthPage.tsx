// src/components/auth/AuthPage.tsx
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  Sun,
  Mail,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthPageProps {
  defaultMode?: 'signin' | 'signup';
}

export function AuthPage({ defaultMode = 'signin' }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [awaitingConfirmationEmail, setAwaitingConfirmationEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    setValidationError(null);
    setSuccessMessage(null);
    clearError();
  }, [mode, clearError]);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.success) {
          if (res.isAwaitingConfirmation) {
            setAwaitingConfirmationEmail(email);
            setPassword('');
            setConfirmPassword('');
          } else {
            setActiveView('tool');
          }
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.success) {
          setActiveView('tool');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!awaitingConfirmationEmail || isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerificationEmail(awaitingConfirmationEmail);
      if (res.success) {
        setResendStatus('Verification email resent! Please check your inbox and spam folder.');
      } else {
        setResendStatus(res.error || 'Failed to resend confirmation email. Please try again shortly.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setValidationError(null);
    setSuccessMessage(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#090D16] transition-colors duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-in zoom-in-95 duration-200">
        {/* Left Column: Brand Preview (Matching PakiPrint Split Layout in screenshot 3) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-indigo-50/80 via-sky-50/60 to-amber-50/40 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-900 p-8 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800">
          <div>
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            {/* Mascot / Emblem */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center mb-6">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Sun className="w-8 h-8 text-amber-500 animate-spin-slow" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-3 border border-indigo-200 dark:border-indigo-800">
              <Shield className="w-3 h-3 text-indigo-500" />
              Easy Size your PV system
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              Everything your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-500">
                solar installation
              </span>{' '}
              needs in one place.
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              A comprehensive guide for building solar systems. KitoSolar gives engineers, installers, and project owners a modern workspace to simulate 3D equipment layouts, review recommended protection sequences, and prepare planning bills of materials.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Interactive 3D Wall CAD & Conduit Simulator</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Recommended DC Isolator → DC MCB Protection Sequence</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Accurate Mounting BOM & Hardware Specs</span>
            </div>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            {awaitingConfirmationEmail ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-inner">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Verify your email address
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                    We sent a confirmation link to{' '}
                    <span className="font-bold text-slate-900 dark:text-white font-mono break-all">
                      {awaitingConfirmationEmail}
                    </span>
                    . You must verify your email before accessing your account.
                  </p>
                </div>

                {/* Important notice about Spam folder */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>What to do next:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    <li>Check your Gmail / email inbox for an email from <strong>Supabase / KitoSolar</strong>.</li>
                    <li>If you don&apos;t see it within a couple minutes, please check your <strong>Spam or Junk</strong> folder.</li>
                    <li>Click the confirmation link in the email to activate your account.</li>
                  </ol>
                </div>

                {/* Resend Status Message */}
                {resendStatus && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 text-center font-medium">
                    {resendStatus}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setEmail(awaitingConfirmationEmail);
                      setAwaitingConfirmationEmail(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>I&apos;ve Verified — Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Sending...' : 'Resend verification email'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingConfirmationEmail(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 font-medium py-1 cursor-pointer"
                  >
                    Use a different email address
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isSignUp
                        ? 'Register to save your project planning configurations.'
                        : 'Sign in to access your saved solar projects.'}
                    </p>
                  </div>

                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setActiveView('home')}
                    className="md:hidden text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>
                </div>

                {/* Google OAuth Button with Official Google G Logo */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  <span className="absolute px-3 bg-white dark:bg-slate-900 text-[10px] font-mono tracking-widest uppercase text-slate-400 font-medium">
                    OR CONTINUE WITH EMAIL
                  </span>
                </div>

                {/* Error & Feedback Messages */}
                {(validationError || authError) && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {authError === 'Email not confirmed'
                          ? 'Email Not Confirmed Yet'
                          : authError?.toLowerCase().includes('rate limit')
                          ? 'Email Verification Limit Reached'
                          : validationError || authError}
                      </span>
                    </div>
                    {authError === 'Email not confirmed' && (
                      <div className="space-y-2 pl-6">
                        <p className="text-[11px] text-rose-600 dark:text-rose-300 leading-relaxed">
                          Your email address has not been confirmed yet. Please check your inbox (and Spam/Junk folder) and click the verification link.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAwaitingConfirmationEmail(email);
                            handleResendEmail();
                          }}
                          className="text-xs font-bold text-rose-700 dark:text-rose-300 underline hover:no-underline cursor-pointer block"
                        >
                          Resend verification email to {email}
                        </button>
                      </div>
                    )}
                    {authError?.toLowerCase().includes('rate limit') && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-300 pl-6 leading-relaxed">
                        Supabase rate-limits outgoing verification emails. Please wait a few minutes before trying again.
                      </p>
                    )}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Account Registered</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pl-6 leading-relaxed">
                      {successMessage}
                    </p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required={isSignUp}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Engr. Juan Dela Cruz"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 pr-10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={isSignUp}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  )}

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-indigo-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    )}
                  </button>
                </form>

                {/* Mode switch */}
                <div className="space-y-3 pt-2 text-center">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    After creating your account, your solar designs, calculations, and BOM exports are saved securely in the cloud.
                  </p>

                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {isSignUp ? (
                      <>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signin')}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Sign in
                        </button>
                      </>
                    ) : (
                      <>
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signup')}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Register
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
