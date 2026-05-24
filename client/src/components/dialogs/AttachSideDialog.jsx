import React, { useEffect } from 'react';
import { XIcon } from '../Icons';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function AttachSideDialog({ side, planEntries, onAttach, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-slate-950/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-sm flex flex-col rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden dark:border-slate-700 dark:bg-slate-900"
        style={{ maxHeight: '80dvh' }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 shrink-0 dark:border-slate-700">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Attach to a dinner
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Adding: <span className="font-medium text-slate-700 dark:text-slate-300">{side.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <XIcon size={14} />
          </button>
        </div>

        {planEntries.length === 0 ? (
          <p
            className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
          >
            No dinners in this week&apos;s plan yet.
          </p>
        ) : (
          <ul
            className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {planEntries.map((entry, index) => {
              const alreadyAttached = (entry.sideIds || []).includes(side.id);
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    disabled={alreadyAttached}
                    onClick={() => { onAttach(entry.id); onClose(); }}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm transition-colors ${
                      alreadyAttached
                        ? 'cursor-default opacity-50'
                        : 'hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-700/60'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                        {DAYS[index]}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {entry.main?.name}
                      </span>
                    </div>
                    {alreadyAttached && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Added
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AttachSideDialog;
