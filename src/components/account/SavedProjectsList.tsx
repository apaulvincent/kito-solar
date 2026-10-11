// src/components/account/SavedProjectsList.tsx
import { useState, useEffect } from 'react';
import {
  Folder,
  Trash2,
  ExternalLink,
  Plus,
  Search,
  Calendar,
  Layers,
  Battery,
  Shield,
  AlertCircle,
  Check,
  Edit2,
  X,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { projectService } from '@/services/projectService';
import { SavedProject, MAX_PROJECTS_PER_USER } from '@/types/project';
import { sanitizeProjectTitle, sanitizeProjectNotes } from '@/lib/sanitization';

export function SavedProjectsList() {
  const user = useAuthStore((s) => s.user);
  const loadProject = useCalculatorStore((s) => s.loadProject);
  const clearActiveProject = useCalculatorStore((s) => s.clearActiveProject);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const activeProjectId = useCalculatorStore((s) => s.activeProjectId);

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProject, setEditingProject] = useState<SavedProject | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await projectService.getProjects(user.id);
      setProjects(data);
    } catch (err) {
      console.warn('Failed to fetch saved projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleOpenProject = (project: SavedProject) => {
    loadProject(project);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingId) return;
    setIsDeleting(true);
    try {
      const res = await projectService.deleteProject(user.id, deletingId);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== deletingId));
        setDeletingId(null);
      }
    } catch (err) {
      console.warn('Error deleting project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEdit = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setEditNotes(project.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingProject) return;

    const cleanedName = sanitizeProjectTitle(editName);
    const cleanedNotes = sanitizeProjectNotes(editNotes);
    if (!cleanedName) return;

    try {
      const res = await projectService.updateProject(user.id, editingProject.id, {
        name: cleanedName,
        notes: cleanedNotes,
      });
      if (res.success && res.project) {
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? res.project! : p))
        );
        setEditingProject(null);
      }
    } catch (err) {
      console.warn('Error updating project:', err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.inverter_model.toLowerCase().includes(q) ||
      p.module_model.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Deck: Quota Badge & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Saved Solar Projects
            </h3>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                projects.length >= MAX_PROJECTS_PER_USER
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {projects.length} / {MAX_PROJECTS_PER_USER} Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select any saved sizing configuration to open in the tool, modify parameters, and re-run engineering calculations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {projects.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-44 sm:w-56 transition-all"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              clearActiveProject();
              setActiveView('tool');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Design</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500">Loading saved projects...</p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs">
            <Folder className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No Saved Projects Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When configuring an array in the Solar Tool, click &ldquo;Save Project&rdquo; to store your sizing and electrical schedules here. You can store up to {MAX_PROJECTS_PER_USER} configurations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearActiveProject();
              setActiveView('tool');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Open Solar Tool to Create Design</span>
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* No Search Results */
        <div className="p-10 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No projects matched &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Grid of Project Cards (Linear-Style Minimalist Technical Design) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const isActive = activeProjectId === project.id;
            return (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project)}
                className={`group relative flex flex-col justify-between p-5 rounded-3xl border transition-all cursor-pointer space-y-4 ${
                  isActive
                    ? 'border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] shadow-md ring-1 ring-amber-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400/80 dark:hover:border-amber-500/80 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Title, Active Badge, Short GUID, and Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {project.system_type}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            Active in Tool
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDate(project.updated_at)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded" title={`Route: /projects/${project.id}`}>
                          projects/{project.id}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug mt-1.5 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {project.name}
                      </h4>

                      {project.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {project.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(project, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit name and notes"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(project.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* High-Density Key Sizing Spec Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Array Size</span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {project.total_kwp} kWp
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {project.panel_count} Panels
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Inverter</span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                        {project.inverter_kw} kW
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block truncate" title={project.inverter_model}>
                        {project.inverter_model}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Storage</span>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 block truncate">
                        {project.battery_model ? `${project.battery_count}× Battery` : 'Grid-Tied'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {project.battery_kwh ? `${project.battery_kwh} kWh` : 'No ESS'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Breakers</span>
                      <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        DC {project.dc_breaker_a}A
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        AC {project.ac_breaker_a}A
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action: Launch & Edit in Studio */}
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="text-[11px] font-mono text-slate-500 font-normal">
                    Click to load configuration
                  </span>
                  <div className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open in Tool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div
          onClick={() => setDeletingId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 id="delete-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                Delete Saved Project?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This action cannot be undone. This sizing configuration will be permanently removed from your account.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name & Notes Modal */}
      {editingProject && (
        <div
          onClick={() => setEditingProject(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h4 id="edit-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                Edit Project Details
              </h4>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
