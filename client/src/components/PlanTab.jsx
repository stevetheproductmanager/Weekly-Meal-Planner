import React, { useState } from 'react';
import WeeklyPlan from './plan/WeeklyPlan';
import { SaveIcon } from './Icons';

function PlanTab({
  entries,
  allMains,
  allSides,
  onAddMainToPlan,
  onRemoveEntry,
  onAttachSide,
  onRemoveSide,
  onSavePlan,
}) {
  const [view, setView] = useState('list');

  return (
    <div className="plan-tab">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">This Week&apos;s Dinners</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Up to 7 dinners. Each dinner has one main and any number of sides.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* List / Calendar toggle — desktop only; mobile always uses list view */}
          <div className="hidden sm:inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/60">
            {['list', 'calendar'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all duration-150 ${
                  view === v
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Save icon button */}
          {entries.length > 0 && (
            <button
              type="button"
              onClick={onSavePlan}
              title="Save this week's plan"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 shadow-sm transition-all duration-150 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow active:translate-y-px dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-700"
            >
              <SaveIcon size={16} />
            </button>
          )}
        </div>
      </div>

      <WeeklyPlan
        entries={entries}
        allMains={allMains}
        allSides={allSides}
        view={view}
        onAddMainToPlan={onAddMainToPlan}
        onRemoveEntry={onRemoveEntry}
        onAttachSide={onAttachSide}
        onRemoveSide={onRemoveSide}
      />
    </div>
  );
}

export default PlanTab;
