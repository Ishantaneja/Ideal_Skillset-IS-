import React from 'react';

export default function Badge({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
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

