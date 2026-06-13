import React, { useState, useEffect, useRef } from 'react';
import WeeklyPlan from './plan/WeeklyPlan';
import MonthlyPlanView from './plan/MonthlyPlanView';
import { SaveIcon, DiceIcon, ImageIcon } from './Icons';
import { ShareCardModal } from './ShareCardModal';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/**
 * Tonight hero card palette — exactly mirrors DAY_COLORS in WeeklyPlan.jsx
 * so the card always looks like a promoted version of its own day row.
 *   bg     → same pastel as the row header
 *   border → same accent as the row's left border
 *   title  → deep shade of the same hue (readable on the pastel bg)
 *   sub    → mid shade for secondary text / label
 */
const TONIGHT_COLORS = [
  { bg: 'bg-violet-50  dark:bg-violet-900/20', border: 'border-violet-400  dark:border-violet-500', title: 'text-violet-950  dark:text-violet-100', sub: 'text-violet-600  dark:text-violet-300' },
  { bg: 'bg-blue-50    dark:bg-blue-900/20',   border: 'border-blue-400    dark:border-blue-500',   title: 'text-blue-950    dark:text-blue-100',   sub: 'text-blue-600    dark:text-blue-300'   },
  { bg: 'bg-cyan-50    dark:bg-cyan-900/20',   border: 'border-cyan-500    dark:border-cyan-500',   title: 'text-cyan-950    dark:text-cyan-100',   sub: 'text-cyan-600    dark:text-cyan-300'   },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20',border: 'border-emerald-500 dark:border-emerald-500',title: 'text-emerald-950 dark:text-emerald-100',sub: 'text-emerald-600 dark:text-emerald-300' },
  { bg: 'bg-amber-50   dark:bg-amber-900/20',  border: 'border-amber-400   dark:border-amber-500',  title: 'text-amber-950   dark:text-amber-100',  sub: 'text-amber-600   dark:text-amber-300'  },
  { bg: 'bg-orange-50  dark:bg-orange-900/20', border: 'border-orange-400  dark:border-orange-500', title: 'text-orange-950  dark:text-orange-100', sub: 'text-orange-600  dark:text-orange-300' },
  { bg: 'bg-rose-50    dark:bg-rose-900/20',   border: 'border-rose-400    dark:border-rose-500',   title: 'text-rose-950    dark:text-rose-100',   sub: 'text-rose-600    dark:text-rose-300'   },
];

/** Returns 0–6 (Mon=0) for today if it falls within weekStartIso, else -1 */
function getTodayIndex(weekStartIso) {
  if (!weekStartIso) return -1;
  const now     = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const monMs   = new Date(weekStartIso + 'T00:00:00Z').getTime();
  const diff    = Math.round((todayMs - monMs) / 86_400_000);
  return diff >= 0 && diff <= 6 ? diff : -1;
}

function formatWeekRange(iso) {
  const mon = new Date(iso + 'T00:00:00Z');
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const fmt = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${mon.toLocaleDateString('en-US', fmt)} – ${sun.toLocaleDateString('en-US', fmt)}`;
}

function formatMonthLabel(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function getThisMonday() {
  const d = new Date();
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addWeeks(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

/* Shared arrow-button style */
const NAV_BTN = 'inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-emerald-600 dark:hover:text-emerald-400 text-base font-medium shrink-0';

function PlanTab({
  entries, allMains, allSides,
  weekStart, isReadOnlyWeek,
  isGuest = false,
  onPrevWeek, onNextWeek, onGoToCurrentWeek,
  onAddMainToPlan, onRemoveEntry, onAttachSide, onRemoveSide, onSavePlan, onReorderEntries,
  onRandomizeWeek,
  onUpdateServings,
  onRateDish,
  onShareToMarketplace,
  onAddOutDay,
  onCopyPreviousWeek,
  onUpdatePlanNote,
  recentMealIds,
  // Month view
  monthPlansData,
  onNavigateToWeek,
  onReorderMonthEntry,
  // Plan templates
  savedPlans = [],
  onLoadTemplate,
}) {
  const [view,          setView]          = useState('list');  // list | grid
  const [planView,      setPlanView]      = useState('week');  // week | month
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const templatesRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close templates dropdown on outside click
  useEffect(() => {
    if (!templatesOpen) return;
    const handler = (e) => {
      if (templatesRef.current && !templatesRef.current.contains(e.target)) {
        setTemplatesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [templatesOpen]);

  // Close mobile overflow menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

  const today     = getThisMonday();
  const isCurrent = weekStart === today;
  const isFuture  = weekStart > today;
  const isPast    = weekStart < today;

  // Tonight's meal — only when on the current week
  const todaySlot    = isCurrent ? getTodayIndex(weekStart) : -1;
  const tonightEntry = (todaySlot >= 0 && todaySlot < entries.length) ? entries[todaySlot] : null;
  const tonightMeal  = tonightEntry && tonightEntry.type !== 'out' ? tonightEntry : null;
  const tonightColor = TONIGHT_COLORS[todaySlot] || TONIGHT_COLORS[0];

  const monthStart = weekStart;

  const handleNavigateToWeek = (weekIso) => {
    onNavigateToWeek(weekIso);
    setPlanView('week');
  };

  // ── Unified top navigation row ──────────────────────────────────────────────
  //
  //  [Week | Month]   ‹  Title · badge · back-to-today  ›   [List | Grid]
  //
  const prevAction = planView === 'week'
    ? onPrevWeek
    : () => onNavigateToWeek(addWeeks(monthStart, -4));
  const nextAction = planView === 'week'
    ? onNextWeek
    : () => onNavigateToWeek(addWeeks(monthStart, 4));

  return (
    <div>

      {/* ── Single unified nav row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">

        {/* Left: Week / Month view toggle — guests have a single rolling week */}
        {!isGuest && (
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/60 shrink-0">
            {[['week','Week'],['month','Month']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlanView(id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                  planView === id
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Centre: ‹  Title · badge  › */}
        <div className="flex flex-1 items-center justify-center gap-1.5 min-w-0">
          {!isGuest && (
            <button type="button" onClick={prevAction} className={NAV_BTN}
              title={planView === 'week' ? 'Previous week' : 'Previous 4 weeks'}>‹</button>
          )}

          <div className="flex flex-col items-center min-w-0 px-0.5">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
              {planView === 'week'
                ? (isCurrent ? 'This Week' : formatWeekRange(weekStart))
                : formatMonthLabel(monthStart)}
            </span>

            {/* Status pills — week view only */}
            {planView === 'week' && (
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Current
                  </span>
                )}
                {isFuture && (
                  <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
                    Upcoming
                  </span>
                )}
                {isPast && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Past
                  </span>
                )}
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={onGoToCurrentWeek}
                    className="text-[10px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    ← Today
                  </button>
                )}
              </div>
            )}
          </div>

          {!isGuest && (
            <button type="button" onClick={nextAction} className={NAV_BTN}
              title={planView === 'week' ? 'Next week' : 'Next 4 weeks'}>›</button>
          )}
        </div>

        {/* Right: List / Grid toggle — week view, desktop only */}
        {planView === 'week' && (
          <div className="hidden sm:inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/60 shrink-0">
            {[{ id: 'list', label: 'List' }, { id: 'grid', label: 'Grid' }].map(v => (
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
        )}
      </div>

      {/* ── Week view ───────────────────────────────────────────────────── */}
      {planView === 'week' ? (
        <>
          {/* Past-week read-only banner */}
          {isReadOnlyWeek && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-400">
              <span>🔒</span>
              <span>Viewing a past week — read only. Navigate to the current week to make changes.</span>
            </div>
          )}

          {/* ── Tonight hero — same pastel palette as its day row below ── */}
          {tonightMeal && (
            <div className={`mb-4 rounded-2xl border-l-4 ${tonightColor.bg} ${tonightColor.border} px-5 py-4 shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-700/40`}>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${tonightColor.sub}`}>
                🌙 Tonight
              </p>
              <p className={`text-xl font-bold leading-tight ${tonightColor.title}`}>
                {tonightMeal.main?.name}
              </p>
              {tonightMeal.sides?.length > 0 && (
                <p className={`mt-0.5 text-sm ${tonightColor.sub}`}>
                  with {tonightMeal.sides.map(s => s.name).join(', ')}
                </p>
              )}
              <div className={`mt-2 flex items-center gap-2.5 text-xs flex-wrap ${tonightColor.sub} opacity-80`}>
                <span>{DAYS[todaySlot]}</span>
                {tonightMeal.servings && (
                  <span>· {tonightMeal.servings} serving{tonightMeal.servings !== 1 ? 's' : ''}</span>
                )}
                {tonightMeal.main?.rating > 0 && (
                  <span>· {'★'.repeat(Math.round(tonightMeal.main.rating))}{'☆'.repeat(5 - Math.round(tonightMeal.main.rating))}</span>
                )}
              </div>
            </div>
          )}

          {/* ── Week header: title + action buttons ── */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                {isCurrent ? "This Week's Dinners" : formatWeekRange(weekStart)}
              </h2>
              {/* 7-segment progress bar */}
              <div className="flex items-center gap-1 mt-1.5">
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-5 rounded-full transition-all duration-300 ${
                      i < entries.length
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
                <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {entries.length === 0
                    ? 'No dinners yet'
                    : entries.length === 7
                    ? "Week's sorted ✓"
                    : `${entries.length} of 7`}
                </span>
              </div>
            </div>

            {/* ── Mobile: Surprise me + overflow menu ── */}
            <div className="flex sm:hidden items-center gap-2 relative" ref={mobileMenuRef}>
              {onRandomizeWeek && !isReadOnlyWeek && entries.length < 7 && (
                <button type="button" onClick={onRandomizeWeek}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all">
                  <DiceIcon size={14} />
                  Surprise me
                </button>
              )}
              {(onCopyPreviousWeek || entries.length > 0 || (onLoadTemplate && savedPlans.length > 0)) && (
                <button type="button" onClick={() => setMobileMenuOpen(v => !v)} aria-label="More actions"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold transition-colors ${
                    mobileMenuOpen
                      ? 'border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
                  }`}>
                  ⋯
                </button>
              )}
              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
                  <div className="p-1">
                    {onCopyPreviousWeek && (
                      <button type="button" onClick={() => { setMobileMenuOpen(false); onCopyPreviousWeek(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                        📋 Copy last week
                      </button>
                    )}
                    {entries.length > 0 && (
                      <button type="button" onClick={() => { setMobileMenuOpen(false); setShareCardOpen(true); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ImageIcon size={14} /> Share image
                      </button>
                    )}
                    {entries.length > 0 && onShareToMarketplace && (
                      <button type="button" onClick={() => { setMobileMenuOpen(false); onShareToMarketplace(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                        🌍 Publish to Spotlight
                      </button>
                    )}
                    {entries.length > 0 && onSavePlan && (
                      <button type="button" onClick={() => { setMobileMenuOpen(false); onSavePlan(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                        <SaveIcon size={14} /> Save plan
                      </button>
                    )}
                  </div>
                  {onLoadTemplate && savedPlans.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Saved weeks</p>
                      <div className="max-h-44 overflow-y-auto p-1 pt-0">
                        {savedPlans.map(plan => (
                          <button key={plan.id} type="button"
                            onClick={() => { setMobileMenuOpen(false); onLoadTemplate(plan); }}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-violet-950/30">
                            <span className="truncate">📂 {plan.name}</span>
                            <span className="shrink-0 text-xs font-semibold text-violet-600 dark:text-violet-400">Use →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Desktop: full action chip row ── */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {onCopyPreviousWeek && (
                <button type="button" onClick={onCopyPreviousWeek}
                  title="Copy last week's meals as a starting point"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-400">
                  📋 Copy last week
                </button>
              )}
              {onRandomizeWeek && !isReadOnlyWeek && entries.length < 7 && (
                <button type="button" onClick={onRandomizeWeek}
                  title="Fill remaining slots randomly"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400">
                  <DiceIcon size={14} />
                  Surprise me
                </button>
              )}
              {entries.length > 0 && (
                <button type="button" onClick={() => setShareCardOpen(true)}
                  title="Download or share a week thumbnail"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-400">
                  <ImageIcon size={13} />
                  Share image
                </button>
              )}
              {entries.length > 0 && onShareToMarketplace && (
                <button type="button" onClick={onShareToMarketplace}
                  title="Share this week with the community"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400">
                  🌍 Publish to Spotlight
                </button>
              )}
              {entries.length > 0 && onSavePlan && (
                <button type="button" onClick={onSavePlan}
                  title="Save this week's plan to history"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
                  <SaveIcon size={13} />
                  Save plan
                </button>
              )}
              {onLoadTemplate && savedPlans.length > 0 && (
                <div className="relative" ref={templatesRef}>
                  <button type="button" onClick={() => setTemplatesOpen(v => !v)}
                    title="Load a saved week as a template"
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                      templatesOpen
                        ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:text-violet-400'
                    }`}>
                    📂 Templates
                  </button>
                  {templatesOpen && (
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Load a saved week</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {savedPlans.map(plan => {
                          const date = plan.savedAt || plan.createdAt;
                          const label = date
                            ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '';
                          const mealCount = (plan.entries || []).filter(e => e.mainId || e.mainName).length;
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => { setTemplatesOpen(false); onLoadTemplate(plan); }}
                              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{plan.name}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{label}{mealCount > 0 ? ` · ${mealCount} meals` : ''}</span>
                              </div>
                              <span className="shrink-0 text-xs font-semibold text-violet-600 dark:text-violet-400">Use →</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <WeeklyPlan
            entries={entries}
            allMains={allMains}
            allSides={allSides}
            view={view}
            weekStart={weekStart}
            recentMealIds={recentMealIds}
            onAddMainToPlan={onAddMainToPlan}
            onRemoveEntry={onRemoveEntry}
            onAttachSide={onAttachSide}
            onRemoveSide={onRemoveSide}
            onReorderEntries={onReorderEntries}
            onUpdateServings={onUpdateServings}
            onRateDish={onRateDish}
            onAddOutDay={onAddOutDay}
            onUpdateNote={onUpdatePlanNote}
          />
        </>
      ) : (
        /* ── Month view ─────────────────────────────────────────────────── */
        <MonthlyPlanView
          monthStart={monthStart}
          monthPlansData={{ ...monthPlansData, [weekStart]: entries }}
          mains={allMains}
          allSides={allSides}
          currentWeekStart={weekStart}
          onNavigateToWeek={handleNavigateToWeek}
          onReorderMonthEntry={onReorderMonthEntry}
          onRateDish={onRateDish}
        />
      )}

      {shareCardOpen && (
        <ShareCardModal
          entries={entries}
          weekStart={weekStart}
          onClose={() => setShareCardOpen(false)}
        />
      )}
    </div>
  );
}

export default PlanTab;
