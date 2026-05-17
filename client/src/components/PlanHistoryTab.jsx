import React, { useState } from 'react';
import { TrashIcon } from './Icons';

const DAY_COLORS = [
  'border-violet-400 dark:border-violet-600',
  'border-blue-400 dark:border-blue-600',
  'border-cyan-400 dark:border-cyan-600',
  'border-emerald-400 dark:border-emerald-600',
  'border-amber-400 dark:border-amber-600',
  'border-orange-400 dark:border-orange-600',
  'border-rose-400 dark:border-rose-600',
];

function PlanHistoryTab({ savedPlans, onReload, onDelete }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (!savedPlans.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No saved plans yet. Use &ldquo;Save this week&rdquo; on the Weekly Plan tab to capture a snapshot.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {savedPlans.map((plan) => (
        <div
          key={plan.id}
          className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
        >
          {/* Card header */}
          <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-50">{plan.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Saved{' '}
                {new Date(plan.savedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {' · '}
                {plan.entries.length} dinner{plan.entries.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {confirmDeleteId === plan.id ? (
                <>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Delete?</span>
                  <button
                    type="button"
                    onClick={() => { onDelete(plan.id); setConfirmDeleteId(null); }}
                    className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-400"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    No
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onReload(plan)}
                    className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400"
                  >
                    Reload
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(plan.id)}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-red-900/40 hover:text-red-300 dark:hover:text-red-300"
                    title="Delete saved plan"
                  >
                    <TrashIcon size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dinner list */}
          <ol className="divide-y divide-slate-100 dark:divide-slate-800">
            {plan.entries.map((entry, i) => (
              <li
                key={i}
                className={`flex items-baseline gap-2 px-4 py-2 border-l-4 ${DAY_COLORS[i % 7]}`}
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {entry.mainName}
                </span>
                {entry.sides && entry.sides.length > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    + {entry.sides.map((s) => s.name).join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default PlanHistoryTab;
