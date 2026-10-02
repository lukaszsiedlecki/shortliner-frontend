'use client';

import {useSyncExternalStore} from 'react';
import {Translation} from './locales';

type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'theme';

// Runs in <head> before first paint so a saved light theme doesn't flash dark (and vice versa).
export const themeInitScript = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light')document.documentElement.classList.remove('dark')}catch(e){}`;

// The .dark class on <html> is the single source of truth; watch it instead of mirroring it in state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  return () => observer.disconnect();
}

const getTheme = (): Theme => document.documentElement.classList.contains('dark') ? 'dark' : 'light';

// null on the server: it can't know the saved theme, so the icon renders client-side only.
const getServerTheme = (): Theme | null => null;

export function ThemeToggle({t}: {t: Translation}) {
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, getServerTheme);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode) — theme still applies for this page view
    }
  };

  const label = theme === 'dark' ? t.themeSwitchToLight : t.themeSwitchToDark;

  return (
      <button
          type="button"
          onClick={toggle}
          aria-label={label}
          title={label}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      >
        {theme === 'dark' && (
            // sun
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
        )}
        {theme === 'light' && (
            // moon
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        )}
      </button>
  );
}
