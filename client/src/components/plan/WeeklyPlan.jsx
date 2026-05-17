import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from '../Icons';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_COLORS = [
  { header: 'bg-violet-50  dark:bg-violet-900/20', accent: 'border-violet-400  dark:border-violet-500', label: 'text-violet-700  dark:text-violet-300', cardBg: 'bg-gradient-to-r from-violet-50/70 to-white    dark:from-violet-950/25 dark:to-slate-950/80' },
  { header: 'bg-blue-50    dark:bg-blue-900/20',   accent: 'border-blue-400    dark:border-blue-500',   label: 'text-blue-700    dark:text-blue-300',   cardBg: 'bg-gradient-to-r from-blue-50/70    to-white    dark:from-blue-950/25    dark:to-slate-950/80' },
  { header: 'bg-cyan-50    dark:bg-cyan-900/20',   accent: 'border-cyan-500    dark:border-cyan-500',   label: 'text-cyan-700    dark:text-cyan-300',   cardBg: 'bg-gradient-to-r from-cyan-50/70    to-white    dark:from-cyan-950/25    dark:to-slate-950/80' },
  { header: 'bg-emerald-50 dark:bg-emerald-900/20',accent: 'border-emerald-500 dark:border-emerald-500',label: 'text-emerald-700 dark:text-emerald-300', cardBg: 'bg-gradient-to-r from-emerald-50/70  to-white    dark:from-emerald-950/25 dark:to-slate-950/80' },
  { header: 'bg-amber-50   dark:bg-amber-900/20',  accent: 'border-amber-400   dark:border-amber-500',  label: 'text-amber-700   dark:text-amber-300',  cardBg: 'bg-gradient-to-r from-amber-50/70   to-white    dark:from-amber-950/25   dark:to-slate-950/80' },
  { header: 'bg-orange-50  dark:bg-orange-900/20', accent: 'border-orange-400  dark:border-orange-500', label: 'text-orange-700  dark:text-orange-300', cardBg: 'bg-gradient-to-r from-orange-50/70  to-white    dark:from-orange-950/25  dark:to-slate-950/80' },
  { header: 'bg-rose-50    dark:bg-rose-900/20',   accent: 'border-rose-400    dark:border-rose-500',   label: 'text-rose-700    dark:text-rose-300',   cardBg: 'bg-gradient-to-r from-rose-50/70    to-white    dark:from-rose-950/25    dark:to-slate-950/80' },
];

// ─── Top-level ────────────────────────────────────────────────────────────────

function WeeklyPlan({ entries, allMains, allSides, view = 'list', onAddMainToPlan, onRemoveEntry, onAttachSide, onRemoveSide }) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const canAddMore = safeEntries.length < 7;

  const handleAdd = (mainId) => {
    onAddMainToPlan(mainId);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-3">
      {view === 'list' ? (
        <ListView
          entries={safeEntries}
          allSides={allSides}
          canAddMore={canAddMore}
          onOpenPicker={() => setPickerOpen(true)}
          onRemoveEntry={onRemoveEntry}
          onAttachSide={onAttachSide}
          onRemoveSide={onRemoveSide}
        />
      ) : (
        <CalendarView
          entries={safeEntries}
          allSides={allSides}
          canAddMore={canAddMore}
          onOpenPicker={() => setPickerOpen(true)}
          onRemoveEntry={onRemoveEntry}
          onAttachSide={onAttachSide}
          onRemoveSide={onRemoveSide}
        />
      )}

      {/* Dish picker rendered as a modal so it's never clipped */}
      {pickerOpen && (
        <DishPicker
          allMains={allMains || []}
          planEntries={safeEntries}
          nextDay={DAYS[safeEntries.length]}
          nextDayIndex={safeEntries.length}
          onAdd={handleAdd}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ entries, allSides, canAddMore, onOpenPicker, onRemoveEntry, onAttachSide, onRemoveSide }) {
  return (
    <div className="space-y-2">
      {canAddMore && (
        <button
          type="button"
          className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-400 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-600 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
          onClick={onOpenPicker}
        >
          ＋ Add dinner{entries.length > 0 ? ` — ${DAYS[entries.length]}` : ''}
        </button>
      )}

      {entries.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No dinners planned yet. Click the button above to add your first dinner.
        </p>
      )}

      <ol className="space-y-2">
        {entries.map((entry, index) => (
          <ListItem
            key={entry.id}
            entry={entry}
            index={index}
            allSides={allSides}
            onRemoveEntry={onRemoveEntry}
            onAttachSide={onAttachSide}
            onRemoveSide={onRemoveSide}
          />
        ))}
      </ol>
    </div>
  );
}

function ListItem({ entry, index, allSides, onRemoveEntry, onAttachSide, onRemoveSide }) {
  const [sideToAdd, setSideToAdd] = useState('');
  const color = DAY_COLORS[index];

  const availableSides = (allSides || []).filter(
    (s) => !(entry.sideIds || []).includes(s.id),
  );

  const handleAddSideClick = () => {
    if (!sideToAdd) return;
    onAttachSide(entry.id, sideToAdd);
    setSideToAdd('');
  };

  return (
    <li className={`flex items-start justify-between gap-3 rounded-xl border border-slate-200/70 border-l-[5px] ${color.accent} ${color.cardBg} p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800/60`}>
      <div className="flex-1 space-y-2.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 w-[4.5rem] ${color.label}`}>
            {DAYS[index]}
          </span>
          <strong className="text-xl sm:text-2xl font-bold leading-tight text-slate-900 dark:text-slate-50">
            {entry.main?.name}
          </strong>

          {entry.sides && entry.sides.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-slate-400">→</span>
              {entry.sides.map((side) => (
                <span
                  key={side.id}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                >
                  {side.name}
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-red-300 hover:bg-red-900/40 focus:outline-none"
                    onClick={() => onRemoveSide(entry.id, side.id)}
                  >
                    <XIcon size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sideToAdd}
            onChange={(e) => setSideToAdd(e.target.value)}
            className="flex-1 min-w-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="">Add a side dish…</option>
            {availableSides.map((side) => (
              <option key={side.id} value={side.id}>{side.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            onClick={handleAddSideClick}
            disabled={!sideToAdd || !availableSides.length}
          >
            Add side
          </button>
        </div>
      </div>

      <button
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:border-red-200 hover:text-red-500 dark:border-slate-700/60 dark:bg-slate-900/40 dark:hover:bg-red-900/40 dark:hover:text-red-300"
        onClick={() => onRemoveEntry(entry.id)}
      >
        <XIcon size={12} />
      </button>
    </li>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ entries, allSides, canAddMore, onOpenPicker, onRemoveEntry, onAttachSide, onRemoveSide }) {
  return (
    <div className="space-y-3">
      {canAddMore && (
        <button
          type="button"
          className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-400 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-600 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
          onClick={onOpenPicker}
        >
          ＋ Add dinner{entries.length > 0 ? ` — ${DAYS[entries.length]}` : ''}
        </button>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[560px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Day header row */}
          <div className="flex divide-x divide-slate-200 dark:divide-slate-800">
            {DAYS_SHORT.map((short, index) => {
              const filled = index < entries.length;
              const color = DAY_COLORS[index];
              return (
                <div
                  key={short}
                  className={`flex-1 py-2 text-center border-b border-slate-200 dark:border-slate-800 ${
                    filled ? color.header : 'bg-slate-50 dark:bg-slate-900/60'
                  }`}
                >
                  <span className={`text-[11px] font-semibold uppercase tracking-widest ${
                    filled ? color.label : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {short}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Day content row */}
          <div className="flex divide-x divide-slate-200 dark:divide-slate-800">
            {DAYS.map((day, index) => {
              const entry = entries[index];
              const isNextSlot = canAddMore && index === entries.length;
              const color = DAY_COLORS[index];

              return (
                <div key={day} className="flex-1 min-w-0 p-2 min-h-[120px]">
                  {entry ? (
                    <CalendarCard
                      entry={entry}
                      color={color}
                      allSides={allSides}
                      onRemoveEntry={onRemoveEntry}
                      onAttachSide={onAttachSide}
                      onRemoveSide={onRemoveSide}
                    />
                  ) : isNextSlot ? (
                    <button
                      type="button"
                      onClick={onOpenPicker}
                      className="w-full h-full min-h-[100px] rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-700 dark:text-slate-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors"
                    >
                      <span className="text-xl leading-none">＋</span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarCard({ entry, color, allSides, onRemoveEntry, onAttachSide, onRemoveSide }) {
  const [showSideSelect, setShowSideSelect] = useState(false);
  const [sideToAdd, setSideToAdd] = useState('');

  const availableSides = (allSides || []).filter(
    (s) => !(entry.sideIds || []).includes(s.id),
  );

  const handleAddSide = () => {
    if (!sideToAdd) return;
    onAttachSide(entry.id, sideToAdd);
    setSideToAdd('');
    setShowSideSelect(false);
  };

  return (
    <div className={`relative h-full rounded-lg border-l-4 ${color.accent} bg-white dark:bg-slate-950/60 p-2 flex flex-col gap-1.5`}>
      <button
        type="button"
        className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-red-900/40 hover:text-red-200 focus:outline-none"
        onClick={() => onRemoveEntry(entry.id)}
      >
        <XIcon size={10} />
      </button>

      <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 pr-5 leading-snug">
        {entry.main?.name}
      </p>

      {entry.sides && entry.sides.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {entry.sides.map((side) => (
            <span
              key={side.id}
              className="inline-flex items-center justify-between gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <span className="truncate">{side.name}</span>
              <button
                type="button"
                onClick={() => onRemoveSide(entry.id, side.id)}
                className="shrink-0 text-slate-400 hover:text-red-400"
              >
                <XIcon size={8} />
              </button>
            </span>
          ))}
        </div>
      )}

      {availableSides.length > 0 && (
        showSideSelect ? (
          <div className="flex flex-col gap-1 mt-auto">
            <select
              autoFocus
              value={sideToAdd}
              onChange={(e) => setSideToAdd(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
            >
              <option value="">Side…</option>
              {availableSides.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleAddSide}
                disabled={!sideToAdd}
                className="flex-1 rounded bg-emerald-500 py-0.5 text-[10px] font-medium text-slate-950 disabled:opacity-40 hover:bg-emerald-400"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowSideSelect(false); setSideToAdd(''); }}
                className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <XIcon size={8} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSideSelect(true)}
            className="mt-auto text-left text-[10px] text-slate-400 hover:text-emerald-500 dark:text-slate-600 dark:hover:text-emerald-400"
          >
            + side
          </button>
        )
      )}
    </div>
  );
}

// ─── Dish picker modal ────────────────────────────────────────────────────────

function DishPicker({ allMains, planEntries, nextDay, nextDayIndex, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);
  const color = DAY_COLORS[nextDayIndex] || DAY_COLORS[0];

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const plannedMainIds = new Set(planEntries.map((e) => e.mainId));
  const available = allMains
    .filter((m) => !plannedMainIds.has(m.id))
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl mx-3 sm:mx-0 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3 ${color.header}`}>
          <span className={`text-sm font-semibold ${color.label}`}>
            {nextDay} — choose a main
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        {/* Results */}
        <ul className="max-h-[32rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {available.length === 0 && (
            <li className="px-4 py-4 text-sm text-slate-400 dark:text-slate-500">
              {search ? 'No dishes match.' : 'All mains are already in the plan.'}
            </li>
          )}
          {available.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
                onClick={() => onAdd(m.id)}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{m.name}</span>
                {m.category && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {m.category}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WeeklyPlan;
