import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bookmark,
  Check,
  AlertCircle,
  FolderPlus,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { projectService } from '@/services/projectService';
import { CreateProjectInput, MAX_PROJECTS_PER_USER, SavedProject } from '@/types/project';
import { sanitizeProjectTitle, sanitizeProjectNotes } from '@/lib/sanitization';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (project: SavedProject) => void;
}

export function SaveProjectModal({ isOpen, onClose, onSaved }: SaveProjectModalProps) {
  const user = useAuthStore((s) => s.user);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const selectedModule = useCalculatorStore((s) => s.selectedModule);
  const selectedBattery = useCalculatorStore((s) => s.selectedBattery);
  const batteryCount = useCalculatorStore((s) => s.batteryCount);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);
  const panelCountOverride = useCalculatorStore((s) => s.panelCountOverride);
  const activeProjectId = useCalculatorStore((s) => s.activeProjectId);
  const activeProjectName = useCalculatorStore((s) => s.activeProjectName);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const [projectName, setProjectName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedProject, setSavedProject] = useState<SavedProject | null>(null);
  const [existingProjectsCount, setExistingProjectsCount] = useState<number>(0);
  const [saveMode, setSaveMode] = useState<'update' | 'new'>('new');

  // Load project count when opened
  useEffect(() => {
    if (isOpen && user) {
      setError(null);
      setSavedProject(null);
      setIsSubmitting(false);

      // Default name suggestion
      const kwp = calculationResult.summary.totalArrayPowerKw;
      const inv = calculationResult.summary.inverterModel;
      const defaultName = activeProjectName || `${kwp} kWp Solar Setup (${inv})`;
      setProjectName(defaultName);
      setProjectNotes('');
      setSaveMode(activeProjectId ? 'update' : 'new');

      projectService.getProjects(user.id).then((projects) => {
        setExistingProjectsCount(projects.length);
      });
    }
  }, [isOpen, user, calculationResult, activeProjectId, activeProjectName]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLimitReached = existingProjectsCount >= MAX_PROJECTS_PER_USER && saveMode === 'new';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to save projects.');
      return;
    }

    const cleanedTitle = sanitizeProjectTitle(projectName);
    const cleanedNotes = sanitizeProjectNotes(projectNotes);

    if (!cleanedTitle) {
      setError('Please provide a project name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const projectPayload: CreateProjectInput = {
      name: cleanedTitle,
      notes: cleanedNotes,
      inverter_model: selectedInverter.model,
      module_model: selectedModule.model,
      battery_model: selectedBattery?.model || null,
      battery_count: batteryCount,
      grid_voltage_v: gridVoltageV,
      main_breaker_a: mainBreakerA,
      panel_count_override: panelCountOverride,

      total_kwp: calculationResult.summary.totalArrayPowerKw,
      inverter_kw: calculationResult.summary.inverterPowerKw,
      panel_count: calculationResult.summary.totalPanels,
      battery_kwh: calculationResult.battery?.hasBattery
        ? Number((calculationResult.battery.totalEnergyWh / 1000).toFixed(2))
        : null,
      dc_breaker_a: calculationResult.dc.breakerRatingA,
      ac_breaker_a: calculationResult.ac.breakerRatingA,
      system_type: calculationResult.systemType === 'hybrid' ? 'HYBRID' : 'ON-GRID',
      custom_prices: useCalculatorStore.getState().customPrices,
    };

    try {
      if (saveMode === 'update' && activeProjectId) {
        const res = await projectService.updateProject(user.id, activeProjectId, projectPayload);
        if (res.success && res.project) {
          setSavedProject(res.project);
          useCalculatorStore.getState().setActiveProjectId(res.project.id, res.project.name);
          if (onSaved) onSaved(res.project);
        } else {
          setError(res.error || 'Failed to update project.');
        }
      } else {
        const res = await projectService.saveProject(user.id, projectPayload);
        if (res.success && res.project) {
          setSavedProject(res.project);
          setExistingProjectsCount((prev) => prev + 1);
          useCalculatorStore.getState().setActiveProjectId(res.project.id, res.project.name);
          if (onSaved) onSaved(res.project);
        } else {
          setError(res.error || 'Failed to save project.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToProjects = () => {
    onClose();
    setActiveView('projects');
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-project-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                PROJECT WORKSPACE
              </span>
              <h3 id="save-project-title" className="text-base font-bold text-slate-900 dark:text-white">
                {savedProject ? 'Project Saved Successfully' : 'Save Solar Project Setup'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {savedProject ? (
            /* Success State */
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 mx-auto flex items-center justify-center">
                <Check className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  &ldquo;{savedProject.name}&rdquo;
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your project is securely saved in your account. You can reopen, edit, or generate technical PDF schedules anytime from your account dashboard.
                </p>
              </div>

              {/* Snapshot confirmation pill box */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-left">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Capacity</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {savedProject.total_kwp} kWp
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Inverter</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {savedProject.inverter_kw} kW
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Topology</span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {savedProject.system_type}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Stay in Studio
                </button>
                <button
                  type="button"
                  onClick={handleGoToProjects}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span>View in Projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Save Form */
            <form onSubmit={handleSave} className="space-y-4">
              {/* Limit Counter Pill */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Storage Allocation:
                </span>
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded-md font-bold ${
                    existingProjectsCount >= MAX_PROJECTS_PER_USER
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {existingProjectsCount} / {MAX_PROJECTS_PER_USER} Saved
                </span>
              </div>

              {/* Update vs Save As New Option (if previously loaded) */}
              {activeProjectId && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSaveMode('update')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      saveMode === 'update'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Update Current
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveMode('new')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      saveMode === 'new'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Save as New Copy
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Limit Reached Warning */}
              {isLimitReached && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    20 Projects Maximum Limit Reached
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                    Your account has reached the maximum of 20 projects. Please delete an older design from your Account page to save a new project.
                  </p>
                </div>
              )}

              {/* Current Design Quick Summary Box */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Sizing Summary
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Capacity:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {calculationResult.summary.totalArrayPowerKw} kWp
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Modules:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {calculationResult.summary.totalPanels} pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Inverter:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {calculationResult.summary.inverterPowerKw} kW
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Storage:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {selectedBattery ? `${batteryCount}× Battery` : 'Grid-Tied'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Metro Heights Residential 6kW"
                  disabled={isSubmitting || isLimitReached}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Optional Client / Site Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Site Reference <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="e.g. 2-story metal roof, 200A main service panel, North array orientation"
                  disabled={isSubmitting || isLimitReached}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isLimitReached}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 transition-all shadow-sm ${
                    isLimitReached
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveMode === 'update' ? (
                    <>
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                      <span>Update Project</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Save Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
