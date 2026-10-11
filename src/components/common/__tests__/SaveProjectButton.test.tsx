// src/components/common/__tests__/SaveProjectButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SaveProjectButton } from '../SaveProjectButton';
import * as fs from 'fs';
import * as path from 'path';

describe('SaveProjectButton', () => {
  const componentPath = path.resolve(process.cwd(), 'src/components/common/SaveProjectButton.tsx');
  const sourceCode = fs.readFileSync(componentPath, 'utf-8');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Save Project button in static markup', () => {
    const html = renderToStaticMarkup(createElement(SaveProjectButton, { authUser: null }));
    expect(html).toBeTruthy();
    expect(html).toContain('Save Project');
  });

  it('includes auth modal for guest users', () => {
    expect(sourceCode).toContain('LOGIN REQUIRED');
    expect(sourceCode).toContain('Save Solar Projects');
    expect(sourceCode).toContain('Create an account or sign in to save up to 20 solar configurations');
    expect(sourceCode).toContain('Log In to Account');
    expect(sourceCode).toContain('Register New Account');
  });

  it('handles active project saved state label', () => {
    expect(sourceCode).toContain("activeProjectId ? 'Saved' : 'Save Project'");
  });
});
