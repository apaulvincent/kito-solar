import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, createElement } from 'react';
import { SavedProjectsList } from '../SavedProjectsList';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { projectService } from '@/services/projectService';
import { MAX_PROJECTS_PER_USER, SavedProject } from '@/types/project';
import { createMockUser, mountIntoDom } from '@/test/domTestUtils';

const sampleProject: SavedProject = {
  id: 'ProjShortId123456789',
  user_id: 'usr_test_123',
  name: 'Manila Residence 6kW',
  notes: 'South roof array',
  inverter_model: 'SUN-6K-SG05LP1-EU',
  module_model: 'CS6R-585MS',
  battery_model: '51.2V-200 Ah',
  battery_count: 1,
  grid_voltage_v: 230,
  main_breaker_a: 100,
  panel_count_override: 10,
  total_kwp: 5.85,
  inverter_kw: 6,
  panel_count: 10,
  battery_kwh: 10.24,
  dc_breaker_a: 20,
  ac_breaker_a: 32,
  system_type: 'HYBRID',
  created_at: '2026-02-01T10:00:00.000Z',
  updated_at: '2026-02-10T10:00:00.000Z',
};

describe('SavedProjectsList Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: createMockUser(), isLoading: false });
    useCalculatorStore.getState().setActiveView('projects');
  });

  it('displays empty state with call-to-action when user has no saved projects', async () => {
    vi.spyOn(projectService, 'getProjects').mockResolvedValueOnce([]);
    const mounted = mountIntoDom(createElement(SavedProjectsList));
    try {
      await act(async () => {
        await Promise.resolve();
      });

      expect(mounted.container.textContent).toContain('Saved Solar Projects');
      expect(mounted.container.textContent).toContain(`0 / ${MAX_PROJECTS_PER_USER} Saved`);
      expect(mounted.container.textContent).toContain('No Saved Projects Yet');
      expect(mounted.container.textContent).toContain('Open Solar Tool to Create Design');
    } finally {
      mounted.unmount();
    }
  });

  it('renders project cards, opens edit/delete modals, and dismisses via Escape', async () => {
    vi.spyOn(projectService, 'getProjects').mockResolvedValueOnce([sampleProject]);
    const deleteSpy = vi
      .spyOn(projectService, 'deleteProject')
      .mockResolvedValueOnce({ success: true });

    const mounted = mountIntoDom(createElement(SavedProjectsList));
    try {
      await act(async () => {
        await Promise.resolve();
      });

      expect(mounted.container.textContent).toContain('Manila Residence 6kW');
      expect(mounted.container.textContent).toContain(`1 / ${MAX_PROJECTS_PER_USER} Saved`);
      expect(mounted.container.textContent).toContain('Open in Tool');

      const editBtn = mounted.container.querySelector<HTMLButtonElement>('button[title="Edit name and notes"]');
      expect(editBtn).not.toBeNull();
      act(() => {
        editBtn?.click();
      });
      expect(document.body.querySelector('#edit-dialog-title')?.textContent).toContain('Edit Project Details');

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(document.body.querySelector('#edit-dialog-title')).toBeNull();

      const deleteBtn = mounted.container.querySelector<HTMLButtonElement>('button[title="Delete project"]');
      expect(deleteBtn).not.toBeNull();
      act(() => {
        deleteBtn?.click();
      });
      expect(document.body.querySelector('#delete-dialog-title')?.textContent).toContain('Delete Saved Project?');

      const confirmDeleteBtn = Array.from(document.body.querySelectorAll('[role="dialog"] button')).find((b) =>
        b.textContent?.includes('Yes, Delete')
      ) as HTMLButtonElement | undefined;
      expect(confirmDeleteBtn).toBeDefined();

      await act(async () => {
        confirmDeleteBtn?.click();
        await Promise.resolve();
      });
      expect(deleteSpy).toHaveBeenCalledWith('usr_test_123', sampleProject.id);
      expect(mounted.container.textContent).toContain('No Saved Projects Yet');
    } finally {
      mounted.unmount();
    }
  });
});
