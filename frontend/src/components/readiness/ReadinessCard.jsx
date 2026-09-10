import React from 'react';
import ProgressBar from '../common/ProgressBar';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { MOCK_READINESS_BREAKDOWN } from '@/data/mockData';

export default function ReadinessCard({
  overallScore = 74,
  title = "Readiness Twin",
  subtitle = "AI-Evaluated Multi-Dimensional Score",
  breakdown = MOCK_READINESS_BREAKDOWN,
  className = '',
}) {
  return (
    <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 transition-colors duration-200 ${className}`}>
      <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{overallScore}%</div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3.5">
        {breakdown.map((item, idx) => (
          <div key={idx}>
            <ProgressBar
              label={item.label}
              value={item.score}
              color={item.color || 'brand'}
              size="md"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
