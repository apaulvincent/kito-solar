import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateRandomSolarName } from '@/lib/solarNames';
import { sanitizeProjectTitle } from '@/lib/sanitization';
import { cleanOAuthHashFromUrl } from '@/lib/urlSync';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  clearError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ success: boolean; error?: string; message?: string; isAwaitingConfirmation?: boolean }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  signInWithEmail: async (email, password) => {
    if (!supabase || !isSupabaseConfigured) {
      const err = 'Supabase credentials are not configured in your environment.';
      set({ error: err });
      return { success: false, error: err };
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  signUpWithEmail: async (email, password, fullName) => {
    if (!supabase || !isSupabaseConfigured) {
      const err = 'Supabase credentials are not configured in your environment.';
      set({ error: err });
      return { success: false, error: err };
    }

    set({ isLoading: true, error: null });
    const resolvedFullName = fullName?.trim()
      ? sanitizeProjectTitle(fullName, 60)
      : generateRandomSolarName();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: resolvedFullName,
          },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      const isAwaitingConfirmation = !data.session && Boolean(data.user);
      
      // When email confirmation is required, the user is unconfirmed and has no active session.
      // Do not store as active logged-in user until they verify their email!
      set({
        user: isAwaitingConfirmation ? null : data.user,
        session: isAwaitingConfirmation ? null : data.session,
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        isAwaitingConfirmation,
        message: isAwaitingConfirmation
          ? 'Registration successful! Please check your email to confirm your account.'
          : 'Registration successful! You are now signed in.',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  resendVerificationEmail: async (email) => {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: 'Supabase credentials are not configured in your environment.' };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend confirmation email';
      return { success: false, error: message };
    }
  },

  signInWithGoogle: async () => {
    if (!supabase || !isSupabaseConfigured) {
      const err = 'Supabase credentials are not configured in your environment.';
      set({ error: err });
      return { success: false, error: err };
    }

    set({ isLoading: true, error: null });
    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectOrigin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initiate Google sign-in';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ user: null, session: null, error: null });
  },

  initAuth: () => {
    if (!supabase || !isSupabaseConfigured) {
      set({ isLoading: false });
      return () => {};
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isLoading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false });
      if (typeof window !== 'undefined' && (event === 'SIGNED_IN' || session)) {
        if (window.location.hash.includes('access_token')) {
          cleanOAuthHashFromUrl();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },
}));
