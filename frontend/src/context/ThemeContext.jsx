import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('st-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Apply theme attribute to <html> element so CSS vars cascade everywhere
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('st-theme', theme);
    } catch { /* storage unavailable */ }
  }, [theme]);

  const setDark  = useCallback(() => setTheme('dark'),  []);
  const setLight = useCallback(() => setTheme('light'), []);

  return (
    <ThemeContext.Provider value={{ theme, setDark, setLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Convenience hook
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
