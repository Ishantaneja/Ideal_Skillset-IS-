import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white text-slate-800 shadow-emerald-500/10',
    error: 'border-red-200 bg-white text-slate-800 shadow-red-500/10',
    warning: 'border-amber-200 bg-white text-slate-800 shadow-amber-500/10',
    info: 'border-blue-200 bg-white text-slate-800 shadow-blue-500/10',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${
            borders[toast.type] || borders.info
          }`}
        >
          <div className="flex items-center space-x-3">
            {icons[toast.type] || icons.info}
            <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

