import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'convecta-theme';
let current = localStorage.getItem(STORAGE_KEY) || 'dark';
const listeners = new Set();
const emit = () => listeners.forEach((l) => l(current));

export function useTheme() {
  const [theme, setTheme] = useState(current);

  useEffect(() => {
    listeners.add(setTheme);
    return () => listeners.delete(setTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('theme-light');
    else root.classList.remove('theme-light');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    return () => { root.classList.remove('theme-light'); };
  }, [theme]);

  const toggle = useCallback(() => {
    current = current === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
    setTheme(current);
    emit();
  }, []);

  return { theme, toggle, isLight: theme === 'light' };
}