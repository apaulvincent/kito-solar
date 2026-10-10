// src/components/home/__tests__/appNavigationAndAuth.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';

describe('App Navigation & Supabase Authentication Suite', () => {
  it('manages auth state and provides full authentication methods', () => {
    const authState = useAuthStore.getState();
    expect(authState.user).toBeNull();
    expect(typeof authState.signInWithEmail).toBe('function');
    expect(typeof authState.signUpWithEmail).toBe('function');
    expect(typeof authState.signInWithGoogle).toBe('function');
    expect(typeof authState.signOut).toBe('function');
  });

  it('manages views between home, tool, login, register, and account', () => {
    const store = useCalculatorStore.getState();

    store.setActiveView('home');
    expect(useCalculatorStore.getState().activeView).toBe('home');

    store.setActiveView('tool');
    expect(useCalculatorStore.getState().activeView).toBe('tool');

    store.setActiveView('login');
    expect(useCalculatorStore.getState().activeView).toBe('login');

    store.setActiveView('register');
    expect(useCalculatorStore.getState().activeView).toBe('register');

    store.setActiveView('account');
    expect(useCalculatorStore.getState().activeView).toBe('account');
  });

  it('verifies AuthPage contains Google OAuth and Email options', () => {
    const authPagePath = path.resolve(process.cwd(), 'src/components/auth/AuthPage.tsx');
    const content = fs.readFileSync(authPagePath, 'utf-8');

    expect(content).toContain('Continue with Google');
    expect(content).toContain('signInWithGoogle');
    expect(content).toContain('signInWithEmail');
    expect(content).toContain('signUpWithEmail');
    expect(content).toContain('Create your account');
    expect(content).toContain('Welcome back');
  });

  it('verifies AccountPage renders profile, security, and project status', () => {
    const accountPagePath = path.resolve(process.cwd(), 'src/components/account/AccountPage.tsx');
    const content = fs.readFileSync(accountPagePath, 'utf-8');

    expect(content).toContain('Sign in to view your account');
    expect(content).toContain('Current Workspace Configuration');
    expect(content).toContain('Array Capacity');
    expect(content).toContain('Launch Tool');
  });

  it('verifies HomePage provides direct links to the tool and account', () => {
    const homePagePath = path.resolve(process.cwd(), 'src/components/home/HomePage.tsx');
    const content = fs.readFileSync(homePagePath, 'utf-8');

    expect(content).toContain('Open Solar Tool');
    expect(content).toContain('Your tools, all in one place.');
    expect(content).toContain('3D Solar CAD Studio');
  });
});
