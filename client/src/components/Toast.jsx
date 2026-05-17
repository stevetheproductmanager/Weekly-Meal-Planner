import React, { useEffect } from 'react';
import { XIcon } from './Icons';

const VARIANTS = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/90 dark:text-emerald-100',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    bar: 'bg-emerald-400 dark:bg-emerald-500',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900 dark:border-red-700/60 dark:bg-red-950/90 dark:text-red-100',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    bar: 'bg-red-400 dark:bg-red-500',
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700/60 dark:bg-blue-950/90 dark:text-blue-100',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    bar: 'bg-blue-400 dark:bg-blue-500',
  },
};

const DURATION = 4000;

export function Toast({ id, message, type = 'info', onDismiss }) {
  const v = VARIANTS[type] ?? VARIANTS.info;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), DURATION);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div
      className={`relative flex items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm toast-enter ${v.container}`}
      role="alert"
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${v.bar} toast-progress`}
        style={{ animationDuration: `${DURATION}ms` }}
      />

      <span className="mt-0.5 shrink-0">{v.icon}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
      >
        <XIcon size={12} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex w-80 flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
