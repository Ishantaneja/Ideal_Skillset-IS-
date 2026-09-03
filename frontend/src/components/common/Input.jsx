import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  disabled = false,
  error = '',
  icon: Icon,
  className = '',
  inputClassName = '',
  rightElement,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {rightElement && <div>{rightElement}</div>}
        </div>
      )}
      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`block w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 bg-red-50/20 text-red-900 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 bg-white text-slate-900'
          } ${inputClassName}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

