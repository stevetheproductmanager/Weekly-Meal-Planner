import React, { useRef } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function ReplaceMealDialog({ incomingDish, currentEntries, onReplace, onClose }) {
  const overlayRef = useRef(null);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm sm:items-center sm:justify-center"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      onTouchEnd={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 flex flex-col shadow-xl"
        style={{ maxHeight: '85dvh' }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Replace a meal
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your week is full. Pick which meal to swap out for{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {incomingDish?.name}
            </span>
            .
          </p>
        </div>

        {/* Meal list */}
        <ul className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {currentEntries.map((entry, i) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onReplace(entry.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-700/60 transition-colors"
              >
                {/* Day pill */}
                <span className="shrink-0 w-10 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {DAYS[i]?.slice(0, 3)}
                </span>

                {/* Meal info */}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {entry.main?.name}
                  </span>
                  <span className="flex items-center gap-1.5 mt-0.5">
                    {entry.main?.category && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.main.category}
                      </span>
                    )}
                    {entry.main && (
                      entry.main.ownerId
                        ? <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-px text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">Community</span>
                        : <span className="inline-flex items-center rounded-full bg-sky-100 px-1.5 py-px text-[10px] font-medium text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">Simmer</span>
                    )}
                  </span>
                </span>

                {/* Replace arrow */}
                <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Replace →
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div
          className="px-5 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReplaceMealDialog;
