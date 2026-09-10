import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('ideal_skillset_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  });

  // Keep DOM and localStorage in sync whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      root.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem('ideal_skillset_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Listen for OS system theme changes if user hasn't explicitly set one
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      try {
        const saved = localStorage.getItem('ideal_skillset_theme');
        if (!saved) {
          const next = e.matches ? 'dark' : 'light';
          setThemeState(next);
        }
      } catch (err) {}
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
        root.setAttribute('data-theme', 'light');
      }
      try {
        localStorage.setItem('ideal_skillset_theme', next);
      } catch (e) {}
      return next;
    });
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
        root.setAttribute('data-theme', 'light');
      }
      try {
        localStorage.setItem('ideal_skillset_theme', newTheme);
      } catch (e) {}
    }
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;

