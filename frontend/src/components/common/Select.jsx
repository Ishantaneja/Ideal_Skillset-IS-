import React from 'react';

export default function Select({
  label,
  id,
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  error = '',
  icon: Icon,
  className = '',
  selectClassName = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`block w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-8 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 dark:border-red-500/50 bg-red-50/20 dark:bg-red-950/30 text-red-900 dark:text-red-300 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-700'
          } ${selectClassName}`}
          {...props}
        >
          {options.map((opt) => {
            const isObj = typeof opt === 'object' && opt !== null;
            const val = isObj ? opt.value : opt;
            const label = isObj ? opt.label : opt;
            return (
              <option key={val} value={val} className="dark:bg-slate-900 dark:text-white">
                {label}
              </option>
            );
          })}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}
