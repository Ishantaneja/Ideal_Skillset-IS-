import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {(title || subtitle || action) && (
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 rounded-b-xl ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
}

