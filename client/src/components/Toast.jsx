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
    action: 'text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100',
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
    action: 'text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100',
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
    action: 'text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100',
  },
};

const DEFAULT_DURATION = 4000;

/**
 * @param {object} props
 * @param {string}   props.id
 * @param {string}   props.message
 * @param {'success'|'error'|'info'} [props.type]
 * @param {{ label: string, onClick: () => void }} [props.action]  optional action button
 * @param {number}   [props.duration]  auto-dismiss ms (default 4000)
 * @param {Function} props.onDismiss
 */
export function Toast({ id, message, type = 'info', action, duration = DEFAULT_DURATION, onDismiss }) {
  const v = VARIANTS[type] ?? VARIANTS.info;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(t);
  }, [id, onDismiss, duration]);

  return (
    <div
      className={`relative flex items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm toast-enter ${v.container}`}
      role="alert"
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${v.bar} toast-progress`}
        style={{ animationDuration: `${duration}ms` }}
      />

      <span className="mt-0.5 shrink-0">{v.icon}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>

      {/* Optional action button (e.g. Undo) */}
      {action && (
        <button
          type="button"
          onClick={() => { action.onClick(); onDismiss(id); }}
          className={`shrink-0 mt-0.5 text-xs font-bold uppercase tracking-wide underline underline-offset-2 transition-opacity hover:opacity-100 opacity-80 ${v.action}`}
        >
          {action.label}
        </button>
      )}

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
    <div className="flex fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 z-[200] w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
