import {useCallback, useSyncExternalStore} from 'react';

type Theme = 'light' | 'dark';

// Ключ и классы совпадают с inline-скриптом в index.html: он выставляет тему на <html> до первой отрисовки,
// а здесь её только читают и переключают. Radix Themes берёт оформление из этого класса.
const STORAGE_KEY = 'theme';

// Общее хранилище: ThemeToggle и ThemeModeControl, смонтированные одновременно, видят одно значение
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  localStorage.setItem(STORAGE_KEY, theme);
  for (const listener of listeners) listener();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme);

  const toggleTheme = useCallback(() => {
    applyTheme(readTheme() === 'dark' ? 'light' : 'dark');
  }, []);

  return {setTheme: applyTheme, theme, toggleTheme};
}
