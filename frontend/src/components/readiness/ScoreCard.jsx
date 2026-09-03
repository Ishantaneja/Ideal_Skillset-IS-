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
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 text-brand-600 border border-slate-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badgeStyles[badgeColor] || badgeStyles.brand}`}>
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="font-medium text-emerald-600">{trend}</span>}
        </div>
      )}
    </div>
  );
}

