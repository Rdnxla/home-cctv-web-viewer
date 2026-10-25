import {useCallback, useState} from 'react';

type Theme = 'light' | 'dark';

// Ключ и классы совпадают с inline-скриптом в index.html: он выставляет тему на <html> до первой отрисовки,
// а здесь её только читают и переключают. Radix Themes берёт оформление из этого класса.
const STORAGE_KEY = 'theme';

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }, [theme]);

  return {theme, toggleTheme};
}
