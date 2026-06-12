import React, { useState } from 'react';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Per-day accent palette — mirrors DAY_COLORS in WeeklyPlan.
 */
const DAY_ACCENTS = [
  { hdrBg: 'bg-violet-100  dark:bg-violet-900/40',  hdrTxt: 'text-violet-700  dark:text-violet-400',  cellBg: 'bg-violet-50  dark:bg-violet-900/20',  cellTxt: 'text-violet-800  dark:text-violet-200',  dot: 'bg-violet-400  dark:bg-violet-500'  },
  { hdrBg: 'bg-blue-100    dark:bg-blue-900/40',    hdrTxt: 'text-blue-700    dark:text-blue-400',    cellBg: 'bg-blue-50    dark:bg-blue-900/20',    cellTxt: 'text-blue-800    dark:text-blue-200',    dot: 'bg-blue-400    dark:bg-blue-500'    },
  { hdrBg: 'bg-cyan-100    dark:bg-cyan-900/40',    hdrTxt: 'text-cyan-700    dark:text-cyan-400',    cellBg: 'bg-cyan-50    dark:bg-cyan-900/20',    cellTxt: 'text-cyan-800    dark:text-cyan-200',    dot: 'bg-cyan-400    dark:bg-cyan-500'    },
  { hdrBg: 'bg-emerald-100 dark:bg-emerald-900/40', hdrTxt: 'text-emerald-700 dark:text-emerald-400', cellBg: 'bg-emerald-50 dark:bg-emerald-900/20', cellTxt: 'text-emerald-800 dark:text-emerald-200', dot: 'bg-emerald-400 dark:bg-emerald-500' },
  { hdrBg: 'bg-amber-100   dark:bg-amber-900/40',   hdrTxt: 'text-amber-700   dark:text-amber-400',   cellBg: 'bg-amber-50   dark:bg-amber-900/20',   cellTxt: 'text-amber-800   dark:text-amber-200',   dot: 'bg-amber-400   dark:bg-amber-500'   },
  { hdrBg: 'bg-orange-100  dark:bg-orange-900/40',  hdrTxt: 'text-orange-700  dark:text-orange-400',  cellBg: 'bg-orange-50  dark:bg-orange-900/20',  cellTxt: 'text-orange-800  dark:text-orange-200',  dot: 'bg-orange-400  dark:bg-orange-500'  },
  { hdrBg: 'bg-rose-100    dark:bg-rose-900/40',    hdrTxt: 'text-rose-700    dark:text-rose-400',    cellBg: 'bg-rose-50    dark:bg-rose-900/20',    cellTxt: 'text-rose-800    dark:text-rose-200',    dot: 'bg-rose-400    dark:bg-rose-500'    },
];

function addWeeks(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

function formatWeekStart(iso) {
  return new Date(iso + 'T00:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Compact read-only star display for monthly cells */
function MiniStars({ rating }) {
  if (!rating) return null;
  const full  = Math.round(rating);
  return (
    <span className="flex items-center gap-px mt-0.5" title={`${rating}/5`}>
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-[8px] leading-none ${s <= full ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}>★</span>
      ))}
    </span>
  );
}

function MonthlyPlanView({
  monthStart,
  monthPlansData,
  mains,
  allSides = [],
  currentWeekStart,
  onNavigateToWeek,
  onReorderMonthEntry,
  onRateDish,
}) {
  const weeks = [0, 1, 2, 3].map(n => addWeeks(monthStart, n));

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragFrom, setDragFrom] = useState(null); // { weekIso, dayIdx }
  const [dragOver, setDragOver] = useState(null); // { weekIso, dayIdx }

  const handleDragStart = (weekIso, dayIdx, e) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragFrom({ weekIso, dayIdx });
  };

  const handleDragOver = (weekIso, dayIdx, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOver || dragOver.weekIso !== weekIso || dragOver.dayIdx !== dayIdx) {
      setDragOver({ weekIso, dayIdx });
    }
  };

  const handleDrop = (weekIso, dayIdx, e) => {
    e.preventDefault();
    if (dragFrom && dragFrom.weekIso === weekIso && dragFrom.dayIdx !== dayIdx) {
      onReorderMonthEntry?.(weekIso, dragFrom.dayIdx, dayIdx);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <div className="space-y-3">

      {/* ── Coloured day-column header row ─────────────────────────────── */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-sm">
        {DAYS_SHORT.map((day, i) => (
          <div key={i} className={`py-2 text-center ${DAY_ACCENTS[i].hdrBg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${DAY_ACCENTS[i].hdrTxt}`}>
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* ── Week blocks ─────────────────────────────────────────────────── */}
      {weeks.map((weekIso) => {
        const entries     = monthPlansData?.[weekIso] || [];
        const isCurrent   = weekIso === currentWeekStart;
        const label       = formatWeekStart(weekIso);
        const filledCount = entries.filter(e =>
          e && (e.type === 'out' || mains.find(m => m.id === e.mainId))
        ).length;

        return (
          <div
            key={weekIso}
            className={`rounded-2xl overflow-hidden border transition-all ${
              isCurrent
                ? 'border-emerald-300 dark:border-emerald-700 shadow-md ring-1 ring-emerald-200 dark:ring-emerald-800/50'
                : 'border-slate-200 dark:border-slate-700/60 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setDragOver(null);
              }
            }}
          >
            {/* Week header bar */}
            <button
              type="button"
              onClick={() => onNavigateToWeek(weekIso)}
              className={`w-full flex items-center justify-between px-3 py-2 transition-colors ${
                isCurrent
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30'
                  : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isCurrent && <span className="text-emerald-500 dark:text-emerald-400 text-[11px] leading-none">✦</span>}
                <span className={`text-xs font-bold ${
                  isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {isCurrent ? 'This week' : label}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 7 }, (_, i) => {
                    const e      = entries[i];
                    const filled = e && (e.type === 'out' || mains.find(m => m.id === e.mainId));
                    return (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          filled
                            ? (isCurrent ? 'bg-emerald-500' : DAY_ACCENTS[i].dot)
                            : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className={`text-[10px] font-semibold tabular-nums ${
                  isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {filledCount}/7
                </span>
              </div>
            </button>

            {/* ── Day cells ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
              {DAYS_SHORT.map((_, dayIdx) => {
                const entry    = entries[dayIdx];
                const accent   = DAY_ACCENTS[dayIdx];
                const isOut    = entry?.type === 'out';
                const main     = (entry && !isOut) ? mains.find(m => m.id === entry.mainId) : null;
                const filled   = main || isOut;

                const sideNames = filled && main
                  ? (entry.sides
                      ? entry.sides.map(s => s.name)
                      : (entry.sideIds || [])
                          .map(sid => allSides.find(s => s.id === sid)?.name)
                          .filter(Boolean)
                    )
                  : [];

                const isDragging  = dragFrom?.weekIso === weekIso && dragFrom?.dayIdx === dayIdx;
                const isDropOver  = dragOver?.weekIso === weekIso && dragOver?.dayIdx === dayIdx
                                    && dragFrom?.weekIso === weekIso && dragFrom?.dayIdx !== dayIdx;

                return (
                  <div
                    key={dayIdx}
                    draggable={!!filled && !!onReorderMonthEntry}
                    onDragStart={filled ? (e) => handleDragStart(weekIso, dayIdx, e) : undefined}
                    onDragOver={(e) => handleDragOver(weekIso, dayIdx, e)}
                    onDrop={(e) => handleDrop(weekIso, dayIdx, e)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onNavigateToWeek(weekIso)}
                    title={main ? main.name : isOut ? 'Out / eating away' : 'Empty — click to plan this week'}
                    className={[
                      'relative min-h-[72px] flex flex-col items-start justify-start p-1.5 transition-all cursor-pointer select-none',
                      filled
                        ? `${accent.cellBg} hover:opacity-80`
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70',
                      isDragging  ? 'opacity-30 scale-95'  : '',
                      isDropOver  ? 'ring-2 ring-inset ring-emerald-400 dark:ring-emerald-500' : '',
                      filled && onReorderMonthEntry ? 'cursor-grab active:cursor-grabbing' : '',
                    ].join(' ')}
                  >
                    {main ? (
                      <>
                        <span className={`text-[10px] font-semibold leading-tight line-clamp-2 text-left ${accent.cellTxt}`}>
                          {main.name}
                        </span>
                        {sideNames.length > 0 && (
                          <span className="mt-0.5 text-[9px] leading-tight text-left text-slate-400 dark:text-slate-500 line-clamp-1">
                            {sideNames.join(', ')}
                          </span>
                        )}
                        <MiniStars rating={main.rating} />
                        {/* Recipe link — stops propagation so cell click (navigate) doesn't fire */}
                        {main.recipeUrl && (
                          <a
                            href={main.recipeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open recipe"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800 transition-colors text-[10px] leading-none"
                          >
                            🔗
                          </a>
                        )}
                      </>
                    ) : isOut ? (
                      <span className="text-sm select-none mx-auto mt-2" title={entry.label || 'Out'}>🚫</span>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full gap-0.5">
                        <span className="text-[13px] font-light text-slate-300 dark:text-slate-600 leading-none">+</span>
                        <span className="text-[9px] text-slate-300 dark:text-slate-600 leading-none">No meal</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-1">
        Drag meals within a week to reorder · tap any week to edit it in detail
      </p>
    </div>
  );
}

export default MonthlyPlanView;
