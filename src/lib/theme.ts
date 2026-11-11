import { STORAGE_KEYS, safeStorage } from './storage';

export type ThemeMode = 'dark' | 'light';

export function getInitialTheme(): ThemeMode {
  return safeStorage.getItem(STORAGE_KEYS.theme) === 'dark' ? 'dark' : 'light';
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function persistAndApplyTheme(theme: ThemeMode): ThemeMode {
  safeStorage.setItem(STORAGE_KEYS.theme, theme);
  applyThemeToDocument(theme);
  return theme;
}
