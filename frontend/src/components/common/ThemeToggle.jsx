import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle({
  className = '',
  showLabel = false,
  size = 'md',
  variant = 'button', // 'button' | 'segmented'
}) {
  const { isDark, toggleTheme, setTheme } = useTheme();

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5 h-5',
  };

  const btnPaddings = {
    sm: 'px-2.5 py-1.5',
    md: 'px-3 py-2',
    lg: 'px-3.5 py-2.5',
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 ${className}`}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTheme('light'); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !isDark
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTheme('dark'); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isDark
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative inline-flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer ${btnPaddings[size]} ${className}`}
      title={isDark ? 'Active: Dark Theme (Click for Light Theme)' : 'Active: Light Theme (Click for Dark Theme)'}
      aria-label="Toggle color theme"
    >
      <div className="flex items-center space-x-2">
        {/* Toggle Icons Container */}
        <div className="relative flex items-center justify-center w-5 h-5">
          {isDark ? (
            <Moon className={`${iconSizes[size]} text-indigo-400 transform transition-transform duration-200 group-hover:scale-110`} />
          ) : (
            <Sun className={`${iconSizes[size]} text-amber-500 transform transition-transform duration-200 group-hover:rotate-45 group-hover:scale-110`} />
          )}
        </div>

        {/* Dynamic Visual Indicator */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hidden sm:inline-block">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {isDark ? 'Switch to Light' : 'Switch to Dark'}
        </span>
      )}
    </button>
  );
}

