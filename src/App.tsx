import { useEffect } from 'react';
import { useCalculatorStore, pathToView, isOAuthHash, extractProjectIdFromUrl } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { projectService } from '@/services/projectService';
import { Header } from '@/components/header/Header';
import { HomePage } from '@/components/home/HomePage';
import { AuthPage } from '@/components/auth/AuthPage';
import { AccountPage } from '@/components/account/AccountPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { ApplianceLoadCalculatorPage } from '@/components/load-calculator/ApplianceLoadCalculatorPage';
import { SolarMapperPage } from '@/features/solar-mapper/components/SolarMapperPage';
import { SystemSummary } from '@/components/summary/SystemSummary';
import { SolarDiagramCanvas } from '@/components/diagram/SolarDiagramCanvas';
import { DiagramComponentList } from '@/components/diagram/DiagramComponentList';
import { ConfigurationPanel } from '@/components/config/ConfigurationPanel';
import { CalculationWorkbench } from '@/components/results/CalculationWorkbench';
import { ComponentInspector } from '@/components/inspector/ComponentInspector';
import { EngineeringDisclaimer } from '@/components/common/EngineeringDisclaimer';
import { DownloadSizingButton } from '@/components/common/DownloadSizingButton';
import { SolarCopilotDrawer } from '@/components/ai/SolarCopilotDrawer';
import { SolarCopilotButton } from '@/components/ai/SolarCopilotButton';
import { ArrowLeft, Box } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

export function App() {
  const initializeCatalog = useCalculatorStore((state) => state.initializeCatalog);
  const activeView = useCalculatorStore((state) => state.activeView);
  const setActiveView = useCalculatorStore((state) => state.setActiveView);
  const loadProject = useCalculatorStore((state) => state.loadProject);
  const user = useAuthStore((state) => state.user);
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initializeCatalog();
    const unsubscribeAuth = initAuth();
    return () => {
      unsubscribeAuth();
    };
  }, [initializeCatalog, initAuth]);

  // Sync browser back/forward (popstate) with store view & strip legacy hash if any
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      const view = pathToView(window.location.pathname, hash);
      const projectId = extractProjectIdFromUrl(window.location.pathname, window.location.search);
      if (hash && !isOAuthHash(hash) && window.history?.replaceState) {
        const targetPath = projectId ? `/projects/${projectId}` : view === 'home' ? '/' : `/${view}`;
        window.history.replaceState({ view, projectId }, '', targetPath);
      }
      setActiveView(view, projectId);

      if (projectId) {
        const currentActiveId = useCalculatorStore.getState().activeProjectId;
        if (currentActiveId !== projectId) {
          projectService.getProjectById(useAuthStore.getState().user?.id, projectId).then((proj) => {
            if (proj) {
              loadProject(proj);
            }
          });
        }
      } else if (view === 'tool') {
        useCalculatorStore.getState().clearActiveProject();
      }
    };

    // If an initial load arrived with a legacy hash (not an OAuth callback), cleanly remove it
    if (typeof window !== 'undefined' && window.location.hash && !isOAuthHash(window.location.hash) && window.history?.replaceState) {
      const view = pathToView(window.location.pathname, window.location.hash);
      const projectId = extractProjectIdFromUrl(window.location.pathname, window.location.search);
      const targetPath = projectId ? `/projects/${projectId}` : view === 'home' ? '/' : `/${view}`;
      window.history.replaceState({ view, projectId }, '', targetPath);
      setActiveView(view, projectId);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveView, loadProject]);

  // Auto-load project if URL contains a project ID (e.g. /projects/:id)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlProjectId = extractProjectIdFromUrl(window.location.pathname, window.location.search);
    if (!urlProjectId) return;

    const currentActiveId = useCalculatorStore.getState().activeProjectId;
    if (currentActiveId === urlProjectId) return;

    let isCancelled = false;
    projectService.getProjectById(user?.id, urlProjectId).then((proj) => {
      if (!isCancelled && proj) {
        loadProject(proj);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [user, loadProject]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Header />

      {activeView === 'home' && <HomePage />}

      {activeView === 'login' && <AuthPage defaultMode="signin" />}

      {activeView === 'register' && <AuthPage defaultMode="signup" />}

      {activeView === 'projects' && <ProjectsPage />}

      {activeView === 'account' && <AccountPage />}

      {activeView === 'load-calculator' && <ApplianceLoadCalculatorPage />}

      {activeView === 'solar-mapper' && <SolarMapperPage />}

      {activeView === 'tool' && (
        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
          {/* Quick Breadcrumb back to Home & Tool Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <Box className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Solar Engineering Tool</span>
              </div>

              <DownloadSizingButton />
            </div>
          </div>

          {/* Step 1: Live System Summary Telemetry HUD */}
          <section aria-label="System Summary">
            <SystemSummary />
          </section>

          {/* Step 2: First-Class Interactive 3D Solar Diagram */}
          <section aria-label="Interactive 3D Solar Diagram" className="space-y-4">
            <SolarDiagramCanvas />
            <DiagramComponentList />
          </section>

          {/* Step 3: Equipment Configurator & Segmented Calculation Workbench (2-Column Studio with Independent Scrolling) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1 (lg: 4 cols): Configuration Workbench (Step 1) */}
            <section
              className="lg:col-span-4 lg:sticky lg:top-20"
              aria-label="Configuration Panel"
            >
              <ConfigurationPanel />
            </section>

            {/* Column 2 (lg: 8 cols): Segmented Engineering Calculation Workbench (Step 2) */}
            <section
              className="lg:col-span-8 lg:sticky lg:top-20"
              aria-label="Engineering Calculation Workbench"
            >
              <CalculationWorkbench />
            </section>
          </div>

          {/* Step 4: Engineering Disclaimer */}
          <EngineeringDisclaimer />
        </main>
      )}

      {/* Slide-out Component Inspector Modal */}
      <ComponentInspector />

      {/* Floating Ask Jenny Trigger */}
      <SolarCopilotButton />

      {/* Interactive AI Sizing Drawer & Generative Proposal Studio */}
      <SolarCopilotDrawer />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}

export default App;
