import React from 'react';
import { Compass } from 'lucide-react';

export default function LoadingSpinner({
  size = 'md',
  fullPage = false,
  message = 'Loading module...',
}) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-brand-600">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
      </div>
      {message && <p className="text-xs font-medium text-slate-500 animate-pulse">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

