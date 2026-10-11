// src/components/common/__tests__/DownloadSizingButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DownloadSizingButton } from '../DownloadSizingButton';
import { useAuthStore } from '@/store/useAuthStore';
import * as fs from 'fs';
import * as path from 'path';

describe('DownloadSizingButton', () => {
  const componentPath = path.resolve(process.cwd(), 'src/components/common/DownloadSizingButton.tsx');
  const sourceCode = fs.readFileSync(componentPath, 'utf-8');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders disabled button with cursor-not-allowed when user is not logged in', () => {
    const html = renderToStaticMarkup(createElement(DownloadSizingButton, { authUser: null }));
    expect(html).toBeTruthy();
    expect(html).toContain('Download Sizing');
    expect(html).toContain('disabled=""');
    expect(html).toContain('opacity-50');
    expect(html).toContain('cursor-not-allowed');
    expect(html).toContain('Please sign in to download the sizing details PDF');
  });

  it('renders enabled interactive button when user is logged in', () => {
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

  it('contains download handler and hooks up pdfExportService', () => {
    expect(sourceCode).toContain('downloadSizingPdf');
    expect(sourceCode).toContain('useAuthStore');
    expect(sourceCode).toContain('useCalculatorStore');
    expect(sourceCode).toContain('isLoggedIn');
    expect(sourceCode).toContain('opacity-50 cursor-not-allowed');
  });
});
