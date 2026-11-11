import type { SystemType as WorkbenchSystemType } from '@/types/calculator';
import type { SystemType as AiSystemType } from '@/types/solar-ai';
import type { SavedProject } from '@/types/project';

export type NormalizedTopology = 'grid_tie' | 'hybrid' | 'off_grid';

export function normalizeSystemTopology(value: string): NormalizedTopology {
  const lower = value.toLowerCase();
  if (lower === 'hybrid') return 'hybrid';
  if (lower === 'off-grid' || lower === 'off_grid') return 'off_grid';
  return 'grid_tie';
}

export function toWorkbenchSystemType(value: string): WorkbenchSystemType {
  return normalizeSystemTopology(value) === 'grid_tie' ? 'ongrid' : 'hybrid';
}

export function toAiSystemType(value: string): AiSystemType {
  const norm = normalizeSystemTopology(value);
  if (norm === 'grid_tie') return 'grid-tie';
  if (norm === 'off_grid') return 'off-grid';
  return 'hybrid';
}

export function toProjectSystemType(value: string): SavedProject['system_type'] {
  return normalizeSystemTopology(value) === 'grid_tie' ? 'ON-GRID' : 'HYBRID';
}

export function isGridTieTopology(value: string): boolean {
  return normalizeSystemTopology(value) === 'grid_tie';
}
