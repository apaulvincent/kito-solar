import { ActiveView } from '@/types/calculator';

const VIEW_ALIASES: ReadonlyArray<{
  view: ActiveView;
  canonicalPath: string;
  aliases: readonly string[];
}> = [
  { view: 'home', canonicalPath: '/', aliases: ['home', ''] },
  { view: 'tool', canonicalPath: '/tool', aliases: ['tool', 'studio'] },
  {
    view: 'load-calculator',
    canonicalPath: '/calculator',
    aliases: ['load-calculator', 'calculator', 'sizing', 'appliances'],
  },
  {
    view: 'solar-mapper',
    canonicalPath: '/solar-mapper',
    aliases: ['solar-mapper', 'mapper', 'roof-mapper', 'irradiance', 'roof'],
  },
  {
    view: 'financial-roi',
    canonicalPath: '/financial-roi',
    aliases: ['financial-roi', 'roi', 'roi-simulator', 'tariff'],
  },
  {
    view: 'yield-simulator',
    canonicalPath: '/yield-simulator',
    aliases: ['yield-simulator', 'simulator', 'yield', 'monitoring'],
  },
  { view: 'projects', canonicalPath: '/projects', aliases: ['projects'] },
  { view: 'login', canonicalPath: '/login', aliases: ['login'] },
  { view: 'register', canonicalPath: '/register', aliases: ['register'] },
  { view: 'account', canonicalPath: '/account', aliases: ['account'] },
  {
    view: 'contact',
    canonicalPath: '/contact',
    aliases: ['contact', 'contact-us', 'inquiry', 'support'],
  },
];

function matchAlias(token: string): ActiveView | null {
  const normalized = token.toLowerCase();
  for (const entry of VIEW_ALIASES) {
    if (entry.aliases.includes(normalized)) {
      return entry.view;
    }
  }
  return null;
}

export function extractProjectIdFromUrl(pathname: string, search?: string): string | null {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const parts = cleanPath.split('/');
  if (parts.length >= 2) {
    const prefix = parts[0].toLowerCase();
    if (prefix === 'projects' || prefix === 'project' || prefix === 'tool') {
      const candidate = parts[1];
      if (candidate && candidate.toLowerCase() !== 'new') {
        return candidate;
      }
    }
  }
  if (search) {
    try {
      const params = new URLSearchParams(search);
      const p = params.get('project') || params.get('id');
      if (p) return p;
    } catch {
      return null;
    }
  }
  return null;
}

export function isOAuthHash(hash: string): boolean {
  return hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('error=');
}

export function pathToView(pathname: string, hash?: string): ActiveView {
  const cleanPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const parts = cleanPath.split('/');

  if ((parts[0] === 'projects' || parts[0] === 'project') && parts.length >= 2 && parts[1]) {
    return 'tool';
  }

  if (cleanPath !== 'home' && cleanPath !== '') {
    return matchAlias(cleanPath) ?? 'home';
  }

  if (hash) {
    const cleanHash = hash.replace(/^#+/, '').toLowerCase();
    return matchAlias(cleanHash) ?? 'home';
  }

  return 'home';
}

export function viewToPath(view: ActiveView, projectId?: string | null): string {
  if (view === 'tool') {
    return projectId ? `/projects/${projectId}` : '/tool';
  }
  const entry = VIEW_ALIAS_MAP.get(view);
  return entry ?? `/${view}`;
}

const VIEW_ALIAS_MAP = new Map<ActiveView, string>(
  VIEW_ALIASES.map((entry) => [entry.view, entry.canonicalPath])
);

export function syncUrlForView(
  view: ActiveView,
  projectId: string | null = null,
  mode: 'push' | 'replace' = 'push'
): void {
  if (typeof window === 'undefined' || !window.history) return;
  try {
    const targetPath = viewToPath(view, projectId);
    const shouldReplaceHash = Boolean(window.location.hash) && !isOAuthHash(window.location.hash);
    if (window.location.pathname !== targetPath || shouldReplaceHash) {
      const fn = mode === 'replace' ? window.history.replaceState : window.history.pushState;
      fn.call(window.history, { view, projectId }, '', targetPath);
    }
  } catch {
    // Non-browser or sandboxed history API
  }
}

export function getInitialViewFromLocation(): ActiveView {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash;
  const view = pathToView(window.location.pathname, hash);
  const projectId = extractProjectIdFromUrl(window.location.pathname, window.location.search);
  // Preserve Supabase OAuth tokens in the hash until the auth client finishes exchanging them.
  if (hash && !isOAuthHash(hash)) {
    syncUrlForView(view, projectId, 'replace');
  }
  return view;
}

export function cleanOAuthHashFromUrl(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    const cleanPath = window.location.pathname || '/';
    window.history.replaceState({}, document.title, cleanPath);
  } catch {
    // Non-browser or sandboxed history API
  }
}
