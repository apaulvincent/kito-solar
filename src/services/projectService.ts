// src/services/projectService.ts
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SavedProject, CreateProjectInput, MAX_PROJECTS_PER_USER } from '@/types/project';
import { sanitizeProjectTitle, sanitizeProjectNotes } from '@/lib/sanitization';

const getLocalStorageKey = (userId: string) => `kito_saved_projects_${userId}`;

function readFromLocalStorage(userId: string): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLocalStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read projects from localStorage:', err);
    return [];
  }
}

function writeToLocalStorage(userId: string, projects: SavedProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(projects));
  } catch (err) {
    console.warn('Failed to write projects to localStorage:', err);
  }
}

const SHORT_ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateShortId(length = 20): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += SHORT_ID_ALPHABET[bytes[i] % SHORT_ID_ALPHABET.length];
    }
    return result;
  }
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SHORT_ID_ALPHABET[Math.floor(Math.random() * SHORT_ID_ALPHABET.length)];
  }
  return result;
}

export const projectService = {
  /**
   * Fetch all saved projects for the authenticated user (max 20).
   */
  async getProjects(userId: string): Promise<SavedProject[]> {
    if (!userId) return [];

    // If Supabase is configured, attempt fetch from cloud first
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_projects')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(MAX_PROJECTS_PER_USER);

        if (!error && Array.isArray(data)) {
          // Sync cloud projects to local storage cache
          writeToLocalStorage(userId, data as SavedProject[]);
          return data as SavedProject[];
        }
      } catch (err) {
        console.warn('Supabase projects query fallback to localStorage:', err);
      }
    }

    // Fallback to local storage
    return readFromLocalStorage(userId);
  },

  /**
   * Fetch a single project by ID for the user.
   */
  async getProjectById(userId: string | null | undefined, projectId: string): Promise<SavedProject | null> {
    if (!projectId) return null;

    if (userId) {
      const all = await this.getProjects(userId);
      const found = all.find((p) => p.id === projectId);
      if (found) return found;
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (!error && data) {
          if (userId) {
            const existing = readFromLocalStorage(userId);
            const merged = [data as SavedProject, ...existing.filter((p) => p.id !== projectId)].slice(
              0,
              MAX_PROJECTS_PER_USER
            );
            writeToLocalStorage(userId, merged);
          }
          return data as SavedProject;
        }
      } catch (err) {
        console.warn('Supabase getProjectById fallback:', err);
      }
    }

    // Fallback: search localStorage across all keys
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('kito_saved_projects_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const hit = list.find((p: SavedProject) => p.id === projectId);
                if (hit) return hit;
              }
            }
          }
        }
      } catch (e) {}
    }

    return null;
  },

  /**
   * Save a new project for the user, enforcing the 20-project limit.
   */
  async saveProject(
    userId: string,
    input: CreateProjectInput
  ): Promise<{ success: boolean; project?: SavedProject; error?: string }> {
    if (!userId) {
      return { success: false, error: 'User must be authenticated to save projects.' };
    }

    // Check project count limit
    const existing = await this.getProjects(userId);
    if (existing.length >= MAX_PROJECTS_PER_USER) {
      return {
        success: false,
        error: `Maximum project limit reached (${MAX_PROJECTS_PER_USER} projects). Please delete an older project to save a new one.`,
      };
    }

    const now = new Date().toISOString();
    const sanitizedName = sanitizeProjectTitle(input.name);
    const sanitizedNotes = sanitizeProjectNotes(input.notes);

    const newProject: SavedProject = {
      id: generateShortId(20),
      user_id: userId,
      ...input,
      name: sanitizedName,
      notes: sanitizedNotes,
      created_at: now,
      updated_at: now,
    };

    // Attempt cloud insert
    let savedToCloud = false;
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_projects')
          .insert([newProject])
          .select()
          .single();

        if (error && (error.message?.includes('custom_prices') || error.message?.includes('layout_3d'))) {
          const { custom_prices: cp, layout_3d: _l3d, ...baseCloudPayload } = newProject;
          const retryPayload = error.message?.includes('custom_prices')
            ? baseCloudPayload
            : { ...baseCloudPayload, custom_prices: cp };
          const retry = await supabase.from('user_projects').insert([retryPayload]).select().single();
          if (!retry.error && retry.data) {
            savedToCloud = true;
            newProject.id = retry.data.id;
          }
        } else if (!error && data) {
          savedToCloud = true;
          newProject.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase save project error, falling back to local storage:', err);
      }
    }

    // Always update local cache (ensures offline and fallback continuity)
    const updatedList = [newProject, ...existing.filter((p) => p.id !== newProject.id)].slice(
      0,
      MAX_PROJECTS_PER_USER
    );
    writeToLocalStorage(userId, updatedList);

    return { success: true, project: newProject };
  },

  /**
   * Update an existing project's settings or title.
   */
  async updateProject(
    userId: string,
    projectId: string,
    updates: Partial<CreateProjectInput>
  ): Promise<{ success: boolean; project?: SavedProject; error?: string }> {
    if (!userId || !projectId) {
      return { success: false, error: 'User ID and Project ID are required.' };
    }

    const existing = await this.getProjects(userId);
    const targetIndex = existing.findIndex((p) => p.id === projectId);
    if (targetIndex === -1) {
      return { success: false, error: 'Project not found.' };
    }

    const sanitizedUpdates: Partial<CreateProjectInput> = { ...updates };
    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeProjectTitle(updates.name);
    }
    if (updates.notes !== undefined) {
      sanitizedUpdates.notes = sanitizeProjectNotes(updates.notes);
    }

    const now = new Date().toISOString();
    const updatedProject: SavedProject = {
      ...existing[targetIndex],
      ...sanitizedUpdates,
      updated_at: now,
    };

    // Cloud update
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('user_projects')
          .update({ ...sanitizedUpdates, updated_at: now })
          .eq('id', projectId)
          .eq('user_id', userId);

        if (error && (error.message?.includes('custom_prices') || error.message?.includes('layout_3d'))) {
          const { custom_prices: cp, layout_3d: _l3d, ...baseCloudUpdates } = sanitizedUpdates;
          const retryUpdates = error.message?.includes('custom_prices')
            ? baseCloudUpdates
            : { ...baseCloudUpdates, custom_prices: cp };
          await supabase
            .from('user_projects')
            .update({ ...retryUpdates, updated_at: now })
            .eq('id', projectId)
            .eq('user_id', userId);
        }
      } catch (err) {
        console.warn('Supabase update project error:', err);
      }
    }

    existing[targetIndex] = updatedProject;
    existing.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    writeToLocalStorage(userId, existing);

    return { success: true, project: updatedProject };
  },

  /**
   * Delete a project.
   */
  async deleteProject(
    userId: string,
    projectId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId || !projectId) {
      return { success: false, error: 'User ID and Project ID are required.' };
    }

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('user_projects')
          .delete()
          .eq('id', projectId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete project error:', err);
      }
    }

    const existing = readFromLocalStorage(userId);
    const filtered = existing.filter((p) => p.id !== projectId);
    writeToLocalStorage(userId, filtered);

    return { success: true };
  },
};
