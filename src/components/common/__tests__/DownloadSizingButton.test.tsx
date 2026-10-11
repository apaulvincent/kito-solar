// src/components/common/__tests__/DownloadSizingButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DownloadSizingButton } from '../DownloadSizingButton';
import * as fs from 'fs';
import * as path from 'path';

describe('DownloadSizingButton', () => {
  const componentPath = path.resolve(process.cwd(), 'src/components/common/DownloadSizingButton.tsx');
  const sourceCode = fs.readFileSync(componentPath, 'utf-8');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders enabled button with no tooltip even when user is not logged in', () => {
    const html = renderToStaticMarkup(createElement(DownloadSizingButton, { authUser: null }));
    expect(html).toBeTruthy();
    expect(html).toContain('Download Sizing');
    // Button is enabled and clickable
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('cursor-not-allowed');
    expect(html).not.toContain('opacity-50');
    expect(html).toContain('cursor-pointer');
    // Tooltip removed
    expect(html).not.toContain('role="tooltip"');
  });

  it('renders enabled button when user is logged in', () => {
    const mockUser = {
      id: 'usr_test_123',
      email: 'engineer@kitosolar.com',
      app_metadata: {},
      user_metadata: { full_name: 'Solar Engineer' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;

    const html = renderToStaticMarkup(createElement(DownloadSizingButton, { authUser: mockUser }));
    expect(html).toBeTruthy();
    expect(html).toContain('Download Sizing');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('cursor-pointer');
    expect(html).toContain('bg-emerald-600');
  });

  it('contains auth modal with login and register links when logged out', () => {
    expect(sourceCode).toContain('isAuthModalOpen');
    expect(sourceCode).toContain('Account Required');
    expect(sourceCode).toContain('You need to have an account to download');
    expect(sourceCode).toContain("setActiveView('login')");
    expect(sourceCode).toContain("setActiveView('register')");
    expect(sourceCode).toContain('Log In to Account');
    expect(sourceCode).toContain('Register New Account');
  });
});
