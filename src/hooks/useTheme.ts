import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  // Estado inicial sin acceder a localStorage (para evitar problemas de hidratación)
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar tema desde localStorage solo en el cliente
  useEffect(() => {
    const stored = localStorage.getItem('feedbackflow_theme');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored as Theme);
    }
    setIsInitialized(true);
  }, []);

  // Aplicar el tema
  useEffect(() => {
    if (!isInitialized) return;

    const root = window.document.documentElement;
    
    const applyTheme = () => {
      let resolved: 'light' | 'dark';
      
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      
      setResolvedTheme(resolved);
      
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Escuchar cambios en el tema del sistema
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, isInitialized]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('feedbackflow_theme', newTheme);
  }, []);

  return {
    theme,
    setTheme,
    resolvedTheme,
    isInitialized,
  };
}
