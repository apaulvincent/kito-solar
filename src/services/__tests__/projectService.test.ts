import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { projectService } from '../projectService';
import { CreateProjectInput, MAX_PROJECTS_PER_USER } from '@/types/project';

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));


describe('projectService Suite', () => {
  const storeMap: Record<string, string> = {};
  const mockUserId = 'usr_test_12345';

  beforeAll(() => {
    const mockStorage = {
      getItem: (key: string) => storeMap[key] ?? null,
      setItem: (key: string, value: string) => {
        storeMap[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storeMap[key];
      },
      clear: () => {
        for (const k of Object.keys(storeMap)) {
          delete storeMap[k];
        }
      },
      length: 0,
      key: () => null,
    };

    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
  });

  afterAll(() => {
    delete (globalThis as any).localStorage;
    delete (globalThis as any).window;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  const sampleInput: CreateProjectInput = {
    name: 'Sample Villa 6kW',
    notes: 'North facing array',
    inverter_model: 'SUN-6K-SG05LP1-EU',
    module_model: 'CS6R-585MS',
    battery_model: '51.2V-200 Ah',
    battery_count: 1,
    grid_voltage_v: 230,
    main_breaker_a: 100,
    panel_count_override: null,
    total_kwp: 6.43,
    inverter_kw: 6,
    panel_count: 11,
    battery_kwh: 10.24,
    dc_breaker_a: 20,
    ac_breaker_a: 32,
    system_type: 'HYBRID',
  };

  it('saves and retrieves projects for an authenticated user', async () => {
    const res = await projectService.saveProject(mockUserId, sampleInput);
    expect(res.success).toBe(true);
    expect(res.project).toBeDefined();
    expect(res.project?.name).toBe('Sample Villa 6kW');

    const list = await projectService.getProjects(mockUserId);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(res.project?.id);
    expect(list[0].inverter_model).toBe('SUN-6K-SG05LP1-EU');
  });

  it('enforces maximum limit of 20 projects per user', async () => {
    // Fill up to 20 projects
    for (let i = 1; i <= MAX_PROJECTS_PER_USER; i++) {
      const res = await projectService.saveProject(mockUserId, {
        ...sampleInput,
        name: `Project #${i}`,
      });
      expect(res.success).toBe(true);
    }

    const initialList = await projectService.getProjects(mockUserId);
    expect(initialList.length).toBe(MAX_PROJECTS_PER_USER);

    // Attempt to save 21st project
    const overflowRes = await projectService.saveProject(mockUserId, {
      ...sampleInput,
      name: 'Project #21 (Should Fail)',
    });

    expect(overflowRes.success).toBe(false);
    expect(overflowRes.error).toContain('Maximum project limit reached (20 projects)');

    // Ensure list count remains exactly 20
    const finalList = await projectService.getProjects(mockUserId);
    expect(finalList.length).toBe(MAX_PROJECTS_PER_USER);
  });

  it('updates an existing project name and notes without affecting other attributes', async () => {
    const saveRes = await projectService.saveProject(mockUserId, sampleInput);
    const projectId = saveRes.project!.id;

    const updateRes = await projectService.updateProject(mockUserId, projectId, {
      name: 'Renamed Commercial Solar Project',
      notes: 'Updated client requirement to 3-phase',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.project?.name).toBe('Renamed Commercial Solar Project');
    expect(updateRes.project?.notes).toBe('Updated client requirement to 3-phase');
    expect(updateRes.project?.total_kwp).toBe(6.43);

    const list = await projectService.getProjects(mockUserId);
    expect(list[0].name).toBe('Renamed Commercial Solar Project');
  });

  it('deletes a project and reflects in the saved list', async () => {
    const res1 = await projectService.saveProject(mockUserId, {
      ...sampleInput,
      name: 'Project Alpha',
    });
    const res2 = await projectService.saveProject(mockUserId, {
      ...sampleInput,
      name: 'Project Beta',
    });

    let list = await projectService.getProjects(mockUserId);
    expect(list.length).toBe(2);

    const deleteRes = await projectService.deleteProject(mockUserId, res1.project!.id);
    expect(deleteRes.success).toBe(true);

    list = await projectService.getProjects(mockUserId);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(res2.project!.id);
  });
});
