import React, { useState } from 'react';
import WeeklyPlan from './plan/WeeklyPlan';
import { SaveIcon } from './Icons';

function PlanTab({ entries, allMains, allSides, onAddMainToPlan, onRemoveEntry, onAttachSide, onRemoveSide, onSavePlan, onReorderEntries }) {
  const [view, setView] = useState('list');

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">This Week&apos;s Dinners</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {entries.length === 0 ? 'No dinners planned yet — add up to 7.' : `${entries.length} of 7 nights planned.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* List / Grid toggle — desktop only */}
          <div className="hidden sm:inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/60">
            {[
              { id: 'list', label: 'List' },
              { id: 'grid', label: 'Grid' },
            ].map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                  view === v.id
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Save button */}
          {entries.length > 0 && onSavePlan && (
            <button
              type="button"
              onClick={onSavePlan}
              title="Save this week's plan to history"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
            >
              <SaveIcon size={13} />
              Save plan
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
        onReorderEntries={onReorderEntries}
      />
    </div>
  );
}

export default PlanTab;
