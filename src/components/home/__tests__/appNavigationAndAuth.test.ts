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

  it('manages views between home, tool, projects, login, register, and account', () => {
    const store = useCalculatorStore.getState();

    store.setActiveView('home');
    expect(useCalculatorStore.getState().activeView).toBe('home');

    store.setActiveView('tool');
    expect(useCalculatorStore.getState().activeView).toBe('tool');

    store.setActiveView('projects');
    expect(useCalculatorStore.getState().activeView).toBe('projects');

    store.setActiveView('login');
    expect(useCalculatorStore.getState().activeView).toBe('login');

    store.setActiveView('register');
    expect(useCalculatorStore.getState().activeView).toBe('register');

    store.setActiveView('account');
    expect(useCalculatorStore.getState().activeView).toBe('account');

    store.setActiveView('load-calculator');
    expect(useCalculatorStore.getState().activeView).toBe('load-calculator');

    store.setActiveView('financial-roi');
    expect(useCalculatorStore.getState().activeView).toBe('financial-roi');
  });

  it('correctly maps URL pathnames to views without requiring hashes', async () => {
    const { pathToView, extractProjectIdFromUrl } = await import('@/store/useCalculatorStore');
    expect(pathToView('/')).toBe('home');
    expect(pathToView('/home')).toBe('home');
    expect(pathToView('/tool')).toBe('tool');
    expect(pathToView('/tool/')).toBe('tool');
    expect(pathToView('/studio')).toBe('tool');
    expect(pathToView('/projects')).toBe('projects');
    expect(pathToView('/projects/RLPwns0Uqe8cJ1xvEbZp')).toBe('tool');
    expect(pathToView('/project/RLPwns0Uqe8cJ1xvEbZp')).toBe('tool');
    expect(pathToView('/login')).toBe('login');
    expect(pathToView('/register')).toBe('register');
    expect(pathToView('/account')).toBe('account');
    expect(pathToView('/calculator')).toBe('load-calculator');
    expect(pathToView('/load-calculator')).toBe('load-calculator');
    expect(pathToView('/sizing')).toBe('load-calculator');
    expect(pathToView('/roi')).toBe('financial-roi');
    expect(pathToView('/financial-roi')).toBe('financial-roi');
    // Project ID extraction
    expect(extractProjectIdFromUrl('/projects/RLPwns0Uqe8cJ1xvEbZp')).toBe('RLPwns0Uqe8cJ1xvEbZp');
    expect(extractProjectIdFromUrl('/project/RLPwns0Uqe8cJ1xvEbZp')).toBe('RLPwns0Uqe8cJ1xvEbZp');
    expect(extractProjectIdFromUrl('/projects')).toBeNull();
    expect(extractProjectIdFromUrl('/tool')).toBeNull();
    expect(extractProjectIdFromUrl('/tool', '?project=RLPwns0Uqe8cJ1xvEbZp')).toBe('RLPwns0Uqe8cJ1xvEbZp');
    // Legacy hash support
    expect(pathToView('/', '#tool')).toBe('tool');
    expect(pathToView('/', '#projects')).toBe('projects');
    expect(pathToView('', '#login')).toBe('login');
  });

  it('verifies AuthPage contains Google OAuth, Email options, and optional Full Name label', () => {
    const authPagePath = path.resolve(process.cwd(), 'src/components/auth/AuthPage.tsx');
    const content = fs.readFileSync(authPagePath, 'utf-8');

    expect(content).toContain('Continue with Google');
    expect(content).toContain('signInWithGoogle');
    expect(content).toContain('signInWithEmail');
    expect(content).toContain('signUpWithEmail');
    expect(content).toContain('Create your account');
    expect(content).toContain('Welcome back');
    expect(content).toContain('Full Name <span className="text-slate-400 font-normal">(optional)</span>');
  });

  it('verifies AccountPage renders profile, identity, and account details', () => {
    const accountPagePath = path.resolve(process.cwd(), 'src/components/account/AccountPage.tsx');
    const content = fs.readFileSync(accountPagePath, 'utf-8');

    expect(content).toContain('Sign in to view your account');
    expect(content).toContain('Account Details');
    expect(content).toContain('Auth Provider');
    expect(content).toContain('Account ID');
  });

  it('verifies ProjectsPage renders saved projects list and guest gate', () => {
    const projectsPagePath = path.resolve(process.cwd(), 'src/components/projects/ProjectsPage.tsx');
    const content = fs.readFileSync(projectsPagePath, 'utf-8');

    expect(content).toContain('Sign in to view your projects');
    expect(content).toContain('SavedProjectsList');
    expect(content).toContain('My Solar Projects');
  });

  it('verifies HomePage provides direct links to the tool and account', () => {
    const homePagePath = path.resolve(process.cwd(), 'src/components/home/HomePage.tsx');
    const content = fs.readFileSync(homePagePath, 'utf-8');

    expect(content).toContain('Open Solar Tool');
    expect(content).toContain('Everything you need to size, wire, and lay out your solar install.');
    expect(content).toContain('3D Solar CAD Studio');
  });
});
