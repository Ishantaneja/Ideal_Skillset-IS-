import React from 'react';

export default function ScoreCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'brand',
  trend,
  className = '',
}) {
  const badgeStyles = {
    brand: 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-100 dark:border-slate-700">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badgeStyles[badgeColor] || badgeStyles.brand}`}>
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="font-medium text-emerald-600 dark:text-emerald-400">{trend}</span>}
        </div>
      )}
    </div>
  );
}
