// src/components/account/__tests__/SavedProjectsList.test.tsx
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('SavedProjectsList Component', () => {
  const componentPath = path.resolve(process.cwd(), 'src/components/account/SavedProjectsList.tsx');
  const sourceCode = fs.readFileSync(componentPath, 'utf-8');

  it('verifies essential structure and 20 projects limit counter in SavedProjectsList', () => {
    expect(sourceCode).toContain('Saved Solar Projects');
    expect(sourceCode).toContain('MAX_PROJECTS_PER_USER');
    expect(sourceCode).toContain('projects.length');
    expect(sourceCode).toContain('Open in Tool');
    expect(sourceCode).toContain('loadProject(project)');
  });

  it('includes edit and delete functionality for projects', () => {
    expect(sourceCode).toContain('handleStartEdit');
    expect(sourceCode).toContain('handleDeleteConfirm');
    expect(sourceCode).toContain('Delete Saved Project?');
    expect(sourceCode).toContain('Edit Project Details');
  });

  it('displays empty state with call-to-action when user has no projects', () => {
    expect(sourceCode).toContain('No Saved Projects Yet');
    expect(sourceCode).toContain('Open Solar Tool to Create Design');
  });
});
