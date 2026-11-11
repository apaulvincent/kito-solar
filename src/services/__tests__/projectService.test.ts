import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { projectService, generateShortId } from '../projectService';
import { CreateProjectInput, MAX_PROJECTS_PER_USER } from '@/types/project';
import { installMockLocalStorage } from '@/test/mockLocalStorage';

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('projectService Suite', () => {
  const mockUserId = 'usr_test_12345';
  let storageHandle: ReturnType<typeof installMockLocalStorage>;

  beforeAll(() => {
    storageHandle = installMockLocalStorage();
  });

  afterAll(() => {
    storageHandle.restore();
  });

  beforeEach(() => {
    storageHandle.reset();
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

  it('saves and retrieves projects with 20-character short GUID for an authenticated user', async () => {
    const shortId = generateShortId();
    expect(shortId.length).toBe(20);
    expect(shortId).toMatch(/^[a-zA-Z0-9]{20}$/);

    const res = await projectService.saveProject(mockUserId, sampleInput);
    expect(res.success).toBe(true);
    expect(res.project).toBeDefined();
    expect(res.project?.name).toBe('Sample Villa 6kW');
    expect(res.project?.id.length).toBe(20);
    expect(res.project?.id).toMatch(/^[a-zA-Z0-9]{20}$/);

    const list = await projectService.getProjects(mockUserId);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(res.project?.id);
    expect(list[0].inverter_model).toBe('SUN-6K-SG05LP1-EU');

    const byId = await projectService.getProjectById(mockUserId, res.project!.id);
    expect(byId).toBeDefined();
    expect(byId?.id).toBe(res.project?.id);
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

  it('sanitizes injection payloads, HTML tags, and control characters in name and notes', async () => {
    const maliciousInput: CreateProjectInput = {
      ...sampleInput,
      name: '<script>alert("XSS")</script>Commercial Solar 10kW\x00',
      notes: '<img src=x onerror=steal()/>2-story metal roof\n\n\n\n\nNotes line 2',
    };

    const res = await projectService.saveProject(mockUserId, maliciousInput);
    expect(res.success).toBe(true);
    expect(res.project).toBeDefined();

    // Verify script tags and null characters are stripped
    expect(res.project?.name).toBe('alert("XSS")Commercial Solar 10kW');
    expect(res.project?.name).not.toContain('<script>');
    expect(res.project?.name).not.toContain('\x00');

    // Verify img tag is stripped and excessive newlines normalized
    expect(res.project?.notes).toBe('2-story metal roof\n\nNotes line 2');
    expect(res.project?.notes).not.toContain('<img');

    // Test updates with injection payloads
    const updateRes = await projectService.updateProject(mockUserId, res.project!.id, {
      name: '<iframe src="evil.com"></iframe>New Name',
      notes: '<svg onload="alert(1)">Notes</svg>',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.project?.name).toBe('New Name');
    expect(updateRes.project?.name).not.toContain('<iframe');
    expect(updateRes.project?.notes).toBe('Notes');
    expect(updateRes.project?.notes).not.toContain('<svg');
  });

  it('enforces character limits on title (80 chars) and notes (250 chars)', async () => {
    const longName = 'A'.repeat(120);
    const longNotes = 'B'.repeat(300);

    const res = await projectService.saveProject(mockUserId, {
      ...sampleInput,
      name: longName,
      notes: longNotes,
    });

    expect(res.success).toBe(true);
    expect(res.project?.name.length).toBe(80);
    expect(res.project?.notes?.length).toBe(250);
  });
});
