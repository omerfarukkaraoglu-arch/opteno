export type Theme = 'dark' | 'light';

export const getStoredTheme = (): Theme => {
  const saved = localStorage.getItem('opticok_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark'; // Default theme
};

export const applyTheme = (theme: Theme) => {
  localStorage.setItem('opticok_theme', theme);
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
};

export const toggleTheme = (): Theme => {
  const current = getStoredTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};
