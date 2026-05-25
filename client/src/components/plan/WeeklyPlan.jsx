import React, { useState, useRef, useEffect } from 'react';
import { XIcon, BookOpenIcon, CheckIcon, GripIcon } from '../Icons';

const DAYS       = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_COLORS = [
  { header: 'bg-violet-50  dark:bg-violet-900/20', accent: 'border-violet-400  dark:border-violet-500', label: 'text-violet-700  dark:text-violet-300', cardBg: 'bg-gradient-to-b from-violet-50/60  to-white dark:from-violet-950/20  dark:to-slate-900/60', col: 'bg-violet-50 dark:bg-violet-900/20' },
  { header: 'bg-blue-50    dark:bg-blue-900/20',   accent: 'border-blue-400    dark:border-blue-500',   label: 'text-blue-700    dark:text-blue-300',   cardBg: 'bg-gradient-to-b from-blue-50/60    to-white dark:from-blue-950/20    dark:to-slate-900/60', col: 'bg-blue-50 dark:bg-blue-900/20' },
  { header: 'bg-cyan-50    dark:bg-cyan-900/20',   accent: 'border-cyan-500    dark:border-cyan-500',   label: 'text-cyan-700    dark:text-cyan-300',   cardBg: 'bg-gradient-to-b from-cyan-50/60    to-white dark:from-cyan-950/20    dark:to-slate-900/60', col: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { header: 'bg-emerald-50 dark:bg-emerald-900/20',accent: 'border-emerald-500 dark:border-emerald-500',label: 'text-emerald-700 dark:text-emerald-300', cardBg: 'bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-slate-900/60', col: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { header: 'bg-amber-50   dark:bg-amber-900/20',  accent: 'border-amber-400   dark:border-amber-500',  label: 'text-amber-700   dark:text-amber-300',  cardBg: 'bg-gradient-to-b from-amber-50/60   to-white dark:from-amber-950/20   dark:to-slate-900/60', col: 'bg-amber-50 dark:bg-amber-900/20' },
  { header: 'bg-orange-50  dark:bg-orange-900/20', accent: 'border-orange-400  dark:border-orange-500', label: 'text-orange-700  dark:text-orange-300', cardBg: 'bg-gradient-to-b from-orange-50/60  to-white dark:from-orange-950/20  dark:to-slate-900/60', col: 'bg-orange-50 dark:bg-orange-900/20' },
  { header: 'bg-rose-50    dark:bg-rose-900/20',   accent: 'border-rose-400    dark:border-rose-500',   label: 'text-rose-700    dark:text-rose-300',   cardBg: 'bg-gradient-to-b from-rose-50/60    to-white dark:from-rose-950/20    dark:to-slate-900/60', col: 'bg-rose-50 dark:bg-rose-900/20' },
];

// ─── Top-level ────────────────────────────────────────────────────────────────

function WeeklyPlan({ entries, allMains, allSides, view = 'grid', onAddMainToPlan, onRemoveEntry, onAttachSide, onRemoveSide, onReorderEntries }) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const canAddMore = safeEntries.length < 7;

  const handleAdd = (mainId) => {
    onAddMainToPlan(mainId);
    setPickerOpen(false);
  };

  return (
    <div>
      {/* Mobile: always list */}
      <div className="sm:hidden">
        <MobileListView
          entries={safeEntries}
          allSides={allSides}
          canAddMore={canAddMore}
          onOpenPicker={() => setPickerOpen(true)}
          onRemoveEntry={onRemoveEntry}
          onAttachSide={onAttachSide}
          onRemoveSide={onRemoveSide}
        />
      </div>

      {/* Desktop: list or grid based on view prop */}
      <div className="hidden sm:block">
        {view === 'grid' ? (
          <GridView
            entries={safeEntries}
            allSides={allSides}
            canAddMore={canAddMore}
            onOpenPicker={() => setPickerOpen(true)}
            onRemoveEntry={onRemoveEntry}
            onAttachSide={onAttachSide}
            onRemoveSide={onRemoveSide}
          />
        ) : (
          <DesktopListView
            entries={safeEntries}
            allSides={allSides}
            canAddMore={canAddMore}
            onOpenPicker={() => setPickerOpen(true)}
            onRemoveEntry={onRemoveEntry}
            onAttachSide={onAttachSide}
            onRemoveSide={onRemoveSide}
            onReorder={onReorderEntries}
          />
        )}
      </div>

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

// ─── Mobile list ──────────────────────────────────────────────────────────────

function MobileListView({ entries, allSides, canAddMore, onOpenPicker, onRemoveEntry, onAttachSide, onRemoveSide }) {
  return (
    <div className="space-y-2">
      {canAddMore && (
        <button
          type="button"
          className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-400 transition-all hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-600 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
          onClick={onOpenPicker}
        >
          ＋ Add dinner{entries.length > 0 ? ` — ${DAYS[entries.length]}` : ''}
        </button>
      )}
      {entries.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No dinners planned yet. Tap above to add your first dinner.
        </p>
      )}
      <ol className="space-y-2">
        {entries.map((entry, index) => (
          <MobileListItem
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

function MobileListItem({ entry, index, allSides, onRemoveEntry, onAttachSide, onRemoveSide }) {
  const [sideToAdd, setSideToAdd] = useState('');
  const color = DAY_COLORS[index];
  const availableSides = (allSides || [])
    .filter(s => !(entry.sideIds || []).includes(s.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <li className={`rounded-xl border border-slate-200/70 border-l-[5px] ${color.accent} ${color.cardBg} p-4 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800/60 overflow-hidden space-y-2.5`}>
      {/* Top row: meal info + remove button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 w-[4.5rem] ${color.label}`}>{DAYS[index]}</span>
            <span className="inline-flex items-center gap-2">
              {entry.main?.recipeUrl && (
                <a href={entry.main.recipeUrl} target="_blank" rel="noopener noreferrer" title="Open recipe"
                  className="inline-flex items-center justify-center rounded-full p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                  <BookOpenIcon size={15} />
                </a>
              )}
              <strong className="text-xl font-bold leading-tight text-slate-900 dark:text-slate-50">{entry.main?.name}</strong>
            </span>
            {entry.sides && entry.sides.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center min-w-0 w-full">
                {entry.sides.map(side => (
                  <span key={side.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100 min-w-0 max-w-full">
                    <span className="truncate max-w-[180px]">{side.name}</span>
                    <button type="button" onClick={() => onRemoveSide(entry.id, side.id)}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-red-300 hover:bg-red-900/40 focus:outline-none">
                      <XIcon size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => onRemoveEntry(entry.id)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/80 bg-white/70 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 dark:border-slate-700/60 dark:bg-slate-900/40 dark:hover:bg-red-900/40 dark:hover:text-red-300 transition-colors">
          <XIcon size={12} />
        </button>
      </div>

      {/* Bottom row: full-width side selector + check button */}
      <div className="flex items-center gap-2">
        <select value={sideToAdd} onChange={e => setSideToAdd(e.target.value)}
          className="flex-1 min-w-0 max-w-full truncate rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100">
          <option value="">Add a side dish…</option>
          {availableSides.map(s => (
            <option key={s.id} value={s.id}>
              {s.name.length > 35 ? s.name.slice(0, 34) + '…' : s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { if (!sideToAdd) return; onAttachSide(entry.id, sideToAdd); setSideToAdd(''); }}
          disabled={!sideToAdd}
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30 border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-400 hover:border-emerald-400 disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:border-slate-700 dark:disabled:bg-slate-800"
        >
          <CheckIcon size={13} />
        </button>
      </div>
    </li>
  );
}

// ─── Desktop list view ────────────────────────────────────────────────────────

function DesktopListView({ entries, allSides, canAddMore, onOpenPicker, onRemoveEntry, onAttachSide, onRemoveSide, onReorder }) {
  const [dragIndex, setDragIndex]     = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (index) => setDragIndex(index);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index !== dragOverIndex) setDragOverIndex(index);
  };

  const handleDrop = (toIndex) => {
    if (dragIndex !== null && dragIndex !== toIndex) {
      onReorder?.(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className="rounded-xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden shadow-sm"
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverIndex(null); }}
    >
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <span className="text-4xl">🍽️</span>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No dinners planned yet.</p>
          <button type="button" onClick={onOpenPicker}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors">
            ＋ Add Monday's dinner
          </button>
        </div>
      ) : (
        <ol>
          {entries.map((entry, index) => (
            <DesktopListItem
              key={entry.id}
              entry={entry}
              index={index}
              allSides={allSides}
              isLast={index === entries.length - 1 && !canAddMore}
              isDragging={dragIndex === index}
              dropPosition={
                dragIndex !== null && dragOverIndex === index && dragIndex !== index
                  ? (dragIndex > index ? 'above' : 'below')
                  : null
              }
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onRemoveEntry={onRemoveEntry}
              onAttachSide={onAttachSide}
              onRemoveSide={onRemoveSide}
            />
          ))}

          {/* Add next dinner — inline row */}
          {canAddMore && (
            <li>
              <button type="button" onClick={onOpenPicker}
                className="flex w-full items-center gap-4 px-0 py-0 border-t border-dashed border-slate-200 dark:border-slate-800 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors group">
                <div className="w-28 shrink-0 flex flex-col items-center justify-center py-4 px-3 border-r border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                    {DAYS_SHORT[entries.length]}
                  </span>
                </div>
                <span className="flex items-center gap-2 text-sm font-medium text-slate-400 group-hover:text-emerald-600 dark:text-slate-600 dark:group-hover:text-emerald-400 transition-colors py-4">
                  <span className="text-lg leading-none">＋</span>
                  Add {DAYS[entries.length]}'s dinner
                </span>
              </button>
            </li>
          )}
        </ol>
      )}
    </div>
  );
}

function DesktopListItem({
  entry, index, allSides, isLast,
  isDragging, dropPosition,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onRemoveEntry, onAttachSide, onRemoveSide,
}) {
  const [sideToAdd, setSideToAdd] = useState('');
  const color = DAY_COLORS[index];
  const availableSides = (allSides || []).filter(s => !(entry.sideIds || []).includes(s.id));

  const handleAddSide = () => {
    if (!sideToAdd) return;
    onAttachSide(entry.id, sideToAdd);
    setSideToAdd('');
  };

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        'flex items-stretch transition-colors group relative',
        !isLast ? 'border-b border-slate-200/70 dark:border-slate-800/60' : '',
        isDragging ? 'opacity-40 bg-slate-50 dark:bg-slate-800/40' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/20',
        dropPosition === 'above' ? 'border-t-2 border-t-emerald-500' : '',
        dropPosition === 'below' ? 'border-b-2 border-b-emerald-500' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <div className="shrink-0 flex items-center px-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 dark:text-slate-700 dark:hover:text-slate-500 border-r border-slate-200/60 dark:border-slate-800/50">
        <GripIcon size={10} />
      </div>

      {/* Day column */}
      <div className={`w-28 shrink-0 flex flex-col items-center justify-center py-4 px-3 border-r border-slate-200/60 dark:border-slate-800/50 ${color.col}`}>
        <span className={`text-[11px] font-bold uppercase tracking-widest text-center leading-tight ${color.label}`}>
          {DAYS[index]}
        </span>
      </div>

      {/* Meal info */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 px-5 py-3.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {entry.main?.recipeUrl && (
            <a href={entry.main.recipeUrl} target="_blank" rel="noopener noreferrer" title="Open recipe"
              className="shrink-0 text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
              <BookOpenIcon size={14} />
            </a>
          )}
          <span className="text-[15px] font-bold text-slate-900 dark:text-slate-50 truncate">
            {entry.main?.name}
          </span>
          {entry.main?.category && (
            <span className="shrink-0 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-500 dark:text-slate-400 font-medium">
              {entry.main.category}
            </span>
          )}
          {entry.main && (
            entry.main.ownerId
              ? <span className="shrink-0 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">Community</span>
              : <span className="shrink-0 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">Default</span>
          )}
        </div>

        {entry.sides && entry.sides.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 dark:text-slate-600 shrink-0">with</span>
            {entry.sides.map(side => (
              <span key={side.id}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50">
                {side.name}
                <button type="button" onClick={() => onRemoveSide(entry.id, side.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors ml-0.5">
                  <XIcon size={8} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add side — fixed-width panel so layout never shifts */}
      <div className="shrink-0 flex items-center gap-2 px-4 border-l border-slate-200/60 dark:border-slate-800/50 w-60">
        {availableSides.length > 0 ? (
          <>
            <select value={sideToAdd} onChange={e => setSideToAdd(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
              <option value="">+ Add a side…</option>
              {availableSides.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="button" onClick={handleAddSide}
              className={`shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 transition-colors ${sideToAdd ? 'visible' : 'invisible'}`}>
              Add
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-300 dark:text-slate-700 select-none">All sides added</span>
        )}
      </div>

      {/* Delete */}
      <div className="shrink-0 flex items-center px-3 border-l border-slate-200/60 dark:border-slate-800/50">
        <button onClick={() => onRemoveEntry(entry.id)}
          className="h-7 w-7 flex items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-700 dark:hover:bg-red-900/40 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
          <XIcon size={12} />
        </button>
      </div>
    </li>
  );
}

// ─── Desktop grid view ────────────────────────────────────────────────────────

function GridView({ entries, allSides, canAddMore, onOpenPicker, onRemoveEntry, onAttachSide, onRemoveSide }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map((day, index) => {
        const entry  = entries[index];
        const color  = DAY_COLORS[index];
        const isNext = canAddMore && index === entries.length;

        if (entry) {
          return (
            <GridCard key={entry.id} entry={entry} index={index} color={color} allSides={allSides}
              onRemoveEntry={onRemoveEntry} onAttachSide={onAttachSide} onRemoveSide={onRemoveSide} />
          );
        }

        return (
          <div key={day}
            className={`flex flex-col rounded-xl overflow-hidden border ${isNext ? 'border-dashed border-slate-300 dark:border-slate-700' : 'border-slate-200/40 dark:border-slate-800/30'}`}
            style={{ minHeight: 220 }}>
            <div className={`px-2.5 py-2 border-b ${isNext ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-700/60' : 'bg-slate-50/40 border-slate-100/50 dark:bg-slate-900/20 dark:border-slate-800/20'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isNext ? 'text-slate-500 dark:text-slate-500' : 'text-slate-300 dark:text-slate-700'}`}>
                {DAYS_SHORT[index]}
              </span>
            </div>
            {isNext ? (
              <button type="button" onClick={onOpenPicker}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/60 dark:text-slate-600 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/20 transition-colors group">
                <span className="text-2xl leading-none font-light">+</span>
                <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Add dinner</span>
              </button>
            ) : (
              <div className="flex-1 bg-slate-50/20 dark:bg-transparent" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GridCard({ entry, index, color, allSides, onRemoveEntry, onAttachSide, onRemoveSide }) {
  const [sideToAdd, setSideToAdd] = useState('');
  const availableSides = (allSides || []).filter(s => !(entry.sideIds || []).includes(s.id));

  const handleAddSide = () => {
    if (!sideToAdd) return;
    onAttachSide(entry.id, sideToAdd);
    setSideToAdd('');
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200/70 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ minHeight: 220 }}>
      <div className={`px-2.5 py-2 ${color.header} border-b border-slate-200/50 dark:border-slate-700/40 flex items-center justify-between shrink-0`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${color.label}`}>{DAYS_SHORT[index]}</span>
        <button type="button" onClick={() => onRemoveEntry(entry.id)} title="Remove"
          className="text-slate-400 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors">
          <XIcon size={9} />
        </button>
      </div>

      <div className={`flex flex-col flex-1 p-2.5 gap-2 ${color.cardBg}`}>
        <div className="flex items-start gap-1">
          {entry.main?.recipeUrl && (
            <a href={entry.main.recipeUrl} target="_blank" rel="noopener noreferrer" title="Open recipe"
              className="shrink-0 mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors">
              <BookOpenIcon size={11} />
            </a>
          )}
          <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 leading-snug">{entry.main?.name}</p>
        </div>

        {entry.sides && entry.sides.length > 0 && (
          <div className="flex flex-col gap-1">
            {entry.sides.map(side => (
              <div key={side.id} className="flex items-center justify-between gap-1 rounded-md bg-white/70 dark:bg-slate-800/60 px-1.5 py-0.5 border border-slate-200/60 dark:border-slate-700/50">
                <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{side.name}</span>
                <button type="button" onClick={() => onRemoveSide(entry.id, side.id)}
                  className="shrink-0 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-colors">
                  <XIcon size={8} />
                </button>
              </div>
            ))}
          </div>
        )}

        {availableSides.length > 0 && (
          <div className="mt-auto pt-2 border-t border-slate-200/50 dark:border-slate-700/30 flex gap-1">
            <select value={sideToAdd} onChange={e => setSideToAdd(e.target.value)}
              className="flex-1 min-w-0 rounded border border-slate-200 bg-white/80 px-1.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300">
              <option value="">+ add side…</option>
              {availableSides.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {sideToAdd && (
              <button type="button" onClick={handleAddSide}
                className="shrink-0 rounded bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-400 transition-colors">
                ✓
              </button>
            )}
          </div>
        )}
      </div>
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

  const plannedMainIds = new Set(planEntries.map(e => e.mainId));
  const available = allMains
    .filter(m => !plannedMainIds.has(m.id))
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    /* Mobile: flex-col justify-end = bottom sheet. Desktop: centered modal */
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-slate-950/60 backdrop-blur-sm px-0 pb-0 sm:px-6 sm:pb-0"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      onTouchEnd={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-xl flex flex-col max-h-[85dvh] sm:max-h-[600px] rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >

        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0 bg-white dark:bg-slate-900">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3 shrink-0 ${color.header}`}>
          <span className={`text-sm font-semibold ${color.label}`}>{nextDay} — choose a main</span>
          <button type="button" onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
            <XIcon size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500" />
        </div>

        {/* Results — scrollable */}
        <ul
          className="overflow-y-auto overflow-x-hidden flex-1 divide-y divide-slate-100 dark:divide-slate-800"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {available.length === 0 && (
            <li className="px-4 py-4 text-sm text-slate-400 dark:text-slate-500">
              {search ? 'No dishes match.' : 'All mains are already in the plan.'}
            </li>
          )}
          {available.map(m => (
            <li key={m.id}>
              <button type="button" onClick={() => onAdd(m.id)}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <span className="font-medium text-slate-900 dark:text-slate-100 break-words flex-1 min-w-0">{m.name}</span>
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
