import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  label = '',
  showValue = true,
  size = 'md',
  color = 'brand',
  className = '',
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorClasses = {
    brand: 'bg-gradient-to-r from-brand-500 to-brand-600',
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    amber: 'bg-gradient-to-r from-amber-500 to-yellow-600',
    rose: 'bg-gradient-to-r from-rose-500 to-pink-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          {showValue && <span className="font-semibold text-slate-900 dark:text-slate-100">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color] || colorClasses.brand}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
