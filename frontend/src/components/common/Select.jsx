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
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
          className={`block w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-8 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 bg-red-50/20 text-red-900 focus:ring-red-500'
              : 'border-slate-300'
          } ${selectClassName}`}
          {...props}
        >
          {options.map((opt) => {
            const isObj = typeof opt === 'object' && opt !== null;
            const val = isObj ? opt.value : opt;
            const label = isObj ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {label}
              </option>
            );
          })}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

