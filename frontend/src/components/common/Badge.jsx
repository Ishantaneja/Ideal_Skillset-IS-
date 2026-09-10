import React from 'react';

export default function Badge({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) {
  const variants = {
    brand: 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    primary: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${
        variants[variant] || variants.slate
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}
