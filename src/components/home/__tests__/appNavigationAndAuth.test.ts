import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore, pathToView, extractProjectIdFromUrl } from '@/store/useCalculatorStore';
import { AuthPage } from '@/components/auth/AuthPage';
import { AccountPage } from '@/components/account/AccountPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { HomePage } from '@/components/home/HomePage';
import { Header } from '@/components/header/Header';
import { projectService } from '@/services/projectService';
import { createMockUser, mountIntoDom } from '@/test/domTestUtils';

describe('App Navigation & Supabase Authentication Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isLoading: false, error: null });
    useCalculatorStore.getState().setActiveView('home');
  });

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
    const views = [
      'home',
      'tool',
      'projects',
      'login',
      'register',
      'account',
      'load-calculator',
      'financial-roi',
      'contact',
    ] as const;

    for (const view of views) {
      store.setActiveView(view);
      expect(useCalculatorStore.getState().activeView).toBe(view);
    }
  });

  it('correctly maps URL pathnames to views without requiring hashes', () => {
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
    expect(pathToView('/contact')).toBe('contact');
    expect(pathToView('/inquiry')).toBe('contact');
    expect(pathToView('/support')).toBe('contact');

    expect(extractProjectIdFromUrl('/projects/RLPwns0Uqe8cJ1xvEbZp')).toBe('RLPwns0Uqe8cJ1xvEbZp');
    expect(extractProjectIdFromUrl('/project/RLPwns0Uqe8cJ1xvEbZp')).toBe('RLPwns0Uqe8cJ1xvEbZp');
    expect(extractProjectIdFromUrl('/projects')).toBeNull();
    expect(extractProjectIdFromUrl('/tool')).toBeNull();
    expect(extractProjectIdFromUrl('/tool', '?project=RLPwns0Uqe8cJ1xvEbZp')).toBe('RLPwns0Uqe8cJ1xvEbZp');

    expect(pathToView('/', '#tool')).toBe('tool');
    expect(pathToView('/', '#projects')).toBe('projects');
    expect(pathToView('', '#login')).toBe('login');
  });

  it('renders AuthPage with Google OAuth, email login, and optional Full Name in signup mode', () => {
    const signInHtml = renderToStaticMarkup(createElement(AuthPage, { defaultMode: 'signin' }));
    expect(signInHtml).toContain('Continue with Google');
    expect(signInHtml).toContain('Welcome back');

    const signUpHtml = renderToStaticMarkup(createElement(AuthPage, { defaultMode: 'signup' }));
    expect(signUpHtml).toContain('Create your account');
    expect(signUpHtml).toContain('Full Name');
    expect(signUpHtml).toContain('(optional)');
  });

  it('renders AccountPage guest gate and authenticated profile details', () => {
    const guestHtml = renderToStaticMarkup(createElement(AccountPage));
    expect(guestHtml).toContain('Sign in to view your account');
    expect(guestHtml).toContain('Log In to Account');

    useAuthStore.setState({ user: createMockUser(), isLoading: false });
    const mounted = mountIntoDom(createElement(AccountPage));
    try {
      expect(mounted.container.textContent).toContain('Account Details');
      expect(mounted.container.textContent).toContain('Auth Provider');
      expect(mounted.container.textContent).toContain('Account ID');
    } finally {
      mounted.unmount();
    }
  });

  it('renders ProjectsPage guest gate when signed out and workspace when signed in', async () => {
    const guestHtml = renderToStaticMarkup(createElement(ProjectsPage));
    expect(guestHtml).toContain('Sign in to view your projects');

    vi.spyOn(projectService, 'getProjects').mockResolvedValueOnce([]);
    useAuthStore.setState({ user: createMockUser(), isLoading: false });
    const mounted = mountIntoDom(createElement(ProjectsPage));
    try {
      await act(async () => {
        await Promise.resolve();
      });
      expect(mounted.container.textContent).toContain('My Solar Projects');
      expect(mounted.container.textContent).toContain('Saved Solar Projects');
    } finally {
      mounted.unmount();
    }
  });

  it('renders HomePage studio deck and Header navigation without duplicate Account nav tab', () => {
    const homeHtml = renderToStaticMarkup(createElement(HomePage));
    expect(homeHtml).toContain('Launch 3D Electrical Studio');
    expect(homeHtml).toContain('Appliance Load Studio');
    expect(homeHtml).toContain('3D Electrical Workbench');
    expect(homeHtml).toContain('Financial ROI Simulator');

    const headerHtml = renderToStaticMarkup(createElement(Header));
    expect(headerHtml).not.toContain('<span>Account</span>');
  });
});
