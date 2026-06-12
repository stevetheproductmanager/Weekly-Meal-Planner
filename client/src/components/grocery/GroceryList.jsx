import React, { useState } from 'react';
import { XIcon } from '../Icons';

const makeKey = (item) =>
  `${(item.name || '').toLowerCase()}||${(item.unit || '').toLowerCase()}||${(item.category || '').toLowerCase()}`;

function inPantry(itemName, pantryItems) {
  const n = itemName.toLowerCase();
  return pantryItems.some(p => p.name.toLowerCase() === n);
}

function GroceryList({
  items,
  onRemoveItem,
  onRemoveMiscItem,
  onAddCustomItem,
  onRemoveCustomItem,
  shoppingMode = false,
  checkedKeys = [],
  onToggleChecked,
  onBatchCheck,
  onExitShopMode = null,
  // Pantry
  pantryItems = [],
  onAddToPantry,
  onRemoveFromPantry,
  onNavigateToPantry = null,
}) {
  const [groupBy, setGroupBy]           = useState('category');
  const [search, setSearch]             = useState('');
  const [quickAdd, setQuickAdd]         = useState('');
  const [showPantry, setShowPantry]     = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);           // item key for drill-through
  const [manuallyExpanded, setManuallyExpanded] = useState(new Set()); // sections user explicitly re-opened

  const safeItems = Array.isArray(items) ? items : [];

  // Split into pantry-hidden vs visible
  const hiddenByPantry = safeItems.filter(i => onAddToPantry && inPantry(i.name, pantryItems));
  const activeItems    = safeItems.filter(i => !onAddToPantry || !inPantry(i.name, pantryItems));

  // Items to display: when showPantry is on, merge pantry items back greyed
  const displayItems = showPantry ? safeItems : activeItems;

  const filteredItems = search.trim()
    ? displayItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    : displayItems;

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!safeItems.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <span className="text-5xl select-none">🛒</span>
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-300">Your list is empty</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Add meals to your Weekly Plan and the ingredients will appear here.
          </p>
        </div>
        {!shoppingMode && onAddCustomItem && (
          <div className="w-full max-w-xs">
            <QuickAddForm value={quickAdd} onChange={setQuickAdd} onAdd={onAddCustomItem} />
          </div>
        )}
      </div>
    );
  }

  const handleRemove = (item) => {
    if (item.source === 'misc'   && onRemoveMiscItem)   onRemoveMiscItem(item.id);
    else if (item.source === 'custom' && onRemoveCustomItem) onRemoveCustomItem(item.id);
    else if (onRemoveItem) onRemoveItem(item);
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  const RemoveBtn = ({ item }) => (
    <button
      type="button"
      className="icon-button danger inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-red-200 hover:bg-red-900/40 focus:outline-none focus:ring-1 focus:ring-red-500/60"
      onClick={() => handleRemove(item)}
      title="Remove from list"
    >
      <XIcon />
    </button>
  );

  const PantryBtn = ({ item }) => {
    if (!onAddToPantry || item.source === 'misc' || item.source === 'custom') return null;
    const already = inPantry(item.name, pantryItems);
    return (
      <button
        type="button"
        onClick={() => {
          if (already) {
            const p = pantryItems.find(p => p.name.toLowerCase() === item.name.toLowerCase());
            if (p) onRemoveFromPantry(p.id);
          } else {
            onAddToPantry(item.name);
          }
        }}
        title={already ? 'Remove from pantry' : 'Mark as "always have it"'}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors focus:outline-none ${
          already
            ? 'text-emerald-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:text-slate-600 dark:hover:bg-emerald-900/20'
        }`}
      >
        🏠
      </button>
    );
  };

  const ItemRow = ({ item, idx, showSource = true }) => {
    const key        = makeKey(item);
    const checked    = shoppingMode && checkedKeys.includes(key);
    const isPantried = inPantry(item.name, pantryItems);
    const isExpanded = expandedItem === key;
    const meals      = (item.fromMeals || []).filter(m => m && m !== 'MISC ITEM' && m !== 'Added manually');

    return (
      <>
        <tr
          key={item.id ?? idx}
          className={`border-b border-slate-200 dark:border-slate-800/80 transition-opacity duration-150 ${
            checked || (showPantry && isPantried)
              ? 'opacity-40'
              : 'hover:bg-slate-50 dark:hover:bg-slate-900/70'
          }`}
        >
          {shoppingMode && (
            <td className="print:hidden w-8 pl-3 pr-1 py-2 align-middle">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleChecked?.(key)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-emerald-500 dark:border-slate-600"
              />
            </td>
          )}
          <td className="px-3 py-2.5 align-top">
            {/* Clickable name — toggles drill-through when item has meal sources */}
            <button
              type="button"
              onClick={() => meals.length > 0 && setExpandedItem(isExpanded ? null : key)}
              className={`text-left ${meals.length > 0 ? 'cursor-pointer group' : 'cursor-default'}`}
            >
              <span className={`font-medium text-slate-900 dark:text-slate-100 ${checked || (showPantry && isPantried) ? 'line-through' : ''} ${meals.length > 0 ? 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors' : ''}`}>
                {item.name}
              </span>
              {(() => {
                const qty = [item.quantityText, item.unit].filter(Boolean).join(' ');
                return qty ? (
                  <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {qty}
                  </span>
                ) : null;
              })()}
              {showPantry && isPantried && (
                <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">🏠 in pantry</span>
              )}
              {meals.length > 0 && (
                <span className={`ml-1.5 text-[10px] text-slate-400 transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>›</span>
              )}
            </button>
          </td>
          {showSource && (
            <td className="hidden sm:table-cell px-3 py-2.5 align-top text-slate-500 dark:text-slate-400 text-xs">
              {(item.fromMeals || []).join(', ')}
            </td>
          )}
          <td className="print:hidden px-2 py-2 align-top text-right">
            <div className="flex items-center justify-end gap-0.5">
              {!shoppingMode && <PantryBtn item={item} />}
              {!shoppingMode && (onRemoveItem || onRemoveMiscItem || onRemoveCustomItem) && (
                <RemoveBtn item={item} />
              )}
            </div>
          </td>
        </tr>
        {/* Drill-through: meal sources */}
        {isExpanded && meals.length > 0 && (
          <tr className="bg-slate-50 dark:bg-slate-900/40">
            <td colSpan={4} className="px-5 py-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-600 dark:text-slate-300">From: </span>
                {meals.join(' · ')}
              </p>
            </td>
          </tr>
        )}
      </>
    );
  };

  const SectionTable = ({ sectionItems, showSource = true }) => (
    <table className="min-w-full text-sm">
      <tbody>
        {sectionItems.map((item, idx) => (
          <ItemRow key={item.id ?? idx} item={item} idx={idx} showSource={showSource} />
        ))}
      </tbody>
    </table>
  );

  const SectionHeader = ({ label, count, isCollapsed, onToggle, sectionItems }) => {
    const uncheckedKeys = sectionItems
      ? sectionItems.filter(i => !checkedKeys.includes(makeKey(i))).map(makeKey)
      : [];
    const allDone = sectionItems && sectionItems.length > 0 && uncheckedKeys.length === 0;
    return (
      <div className="flex items-center justify-between px-1 pb-1">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 group"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
            {label}
          </span>
          <span className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>›</span>
        </button>
        <div className="flex items-center gap-2">
          {shoppingMode && onBatchCheck && sectionItems && !allDone && (
            <button
              type="button"
              onClick={() => onBatchCheck(uncheckedKeys)}
              className="print:hidden text-[10px] font-medium text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-1.5 py-0.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              title={`Check all ${label} items`}
            >
              ✓ All
            </button>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">{count}</span>
        </div>
      </div>
    );
  };

  const groupByCategory = () => {
    const map = {};
    filteredItems.forEach((item) => {
      const key = item.category || 'Other';
      (map[key] = map[key] || []).push(item);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
  };

  const groupByMeal = () => {
    const map = {};
    filteredItems.forEach((item) => {
      const key =
        item.source === 'misc'   ? 'Other Items' :
        item.source === 'custom' ? 'Added manually' :
        (item.fromMeals && item.fromMeals[0]) || 'Unknown';
      (map[key] = map[key] || []).push(item);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Other Items' || a === 'Added manually') return 1;
      if (b === 'Other Items' || b === 'Added manually') return -1;
      return a.localeCompare(b);
    });
  };

  const sections     = groupBy === 'category' ? groupByCategory() : groupByMeal();
  const checkedCount = shoppingMode ? filteredItems.filter(i => checkedKeys.includes(makeKey(i))).length : 0;

  // Auto-collapse: in shop mode, a section where every item is checked collapses
  // automatically unless the user has manually re-opened it.
  const autoCollapsedSections = new Set();
  if (shoppingMode) {
    sections.forEach(([label, sectionItems]) => {
      const allDone = sectionItems.length > 0 && sectionItems.every(i => checkedKeys.includes(makeKey(i)));
      if (allDone && !manuallyExpanded.has(label)) autoCollapsedSections.add(label);
    });
  }

  const toggleSectionCollapse = (label) => {
    setManuallyExpanded(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const totalShoppable  = filteredItems.filter(i => !inPantry(i.name, pantryItems)).length;
  const allShoppingDone = shoppingMode && totalShoppable > 0 && checkedCount >= totalShoppable;

  return (
    <div className="space-y-3">

      {/* ── Controls row ─────────────────────────────────────────────────── */}
      <div className="print:hidden flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search grocery list…"
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <XIcon size={12} />
            </button>
          )}
        </div>

        <div className="inline-flex shrink-0 rounded-full bg-slate-100 p-0.5 dark:bg-slate-900">
          {[['category','By category'],['meal','By meal']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setGroupBy(id)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${groupBy === id ? 'bg-slate-700 text-white dark:bg-slate-600' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Pantry navigate button */}
        {onAddToPantry && onNavigateToPantry && (
          <button
            type="button"
            onClick={onNavigateToPantry}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
          >
            🏠 Pantry{pantryItems.length > 0 ? ` (${pantryItems.length})` : ''} →
          </button>
        )}
      </div>

      {/* ── Pantry-hidden badge ───────────────────────────────────────────── */}
      {onAddToPantry && hiddenByPantry.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            🏠 <strong className="text-slate-600 dark:text-slate-300">{hiddenByPantry.length}</strong> {hiddenByPantry.length === 1 ? 'item' : 'items'} in your pantry (hidden)
          </span>
          <button
            type="button"
            onClick={() => setShowPantry(v => !v)}
            className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {showPantry ? 'Hide' : 'Show'}
          </button>
        </div>
      )}

      {/* ── Item count ───────────────────────────────────────────────────── */}
      <div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {search ? `${filteredItems.length} of ${displayItems.length}` : activeItems.length}{' '}
          {(search ? filteredItems.length : activeItems.length) === 1 ? 'item' : 'items'}
          {shoppingMode && checkedCount > 0 && (
            <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              · {checkedCount} checked
            </span>
          )}
        </span>
      </div>

      {filteredItems.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {search ? `No items match "${search}".` : 'All items are in your pantry.'}
        </p>
      )}

      {/* ── Shopping progress bar ────────────────────────────────────────── */}
      {shoppingMode && totalShoppable > 0 && !allShoppingDone && (
        <div className="print:hidden flex items-center gap-2.5">
          <div className="flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 h-2">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.round((checkedCount / totalShoppable) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {checkedCount}/{totalShoppable}
          </span>
        </div>
      )}

      {/* ── Shopping completion celebration ──────────────────────────────── */}
      {allShoppingDone && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30 px-5 py-6 text-center space-y-3">
          <p className="text-3xl select-none">🎉</p>
          <div className="space-y-1">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">All done!</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Shopping complete — enjoy the week.</p>
          </div>
          {onExitShopMode && (
            <button
              type="button"
              onClick={onExitShopMode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-400 active:scale-95 transition-all"
            >
              ✓ Done shopping
            </button>
          )}
        </div>
      )}

      {/* ── Grouped item list ─────────────────────────────────────────────── */}
      {!allShoppingDone && (
        <div className="space-y-4 overflow-x-auto">
          {sections.map(([label, sectionItems]) => {
            const isCollapsed = autoCollapsedSections.has(label);
            return (
              <div key={label} className={`rounded-lg border border-slate-100 dark:border-slate-800 transition-opacity duration-200 ${isCollapsed ? 'opacity-60' : ''}`}>
                <div className="rounded-t-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
                  <SectionHeader
                    label={label}
                    count={sectionItems.length}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleSectionCollapse(label)}
                    sectionItems={sectionItems}
                  />
                </div>
                {!isCollapsed && <SectionTable sectionItems={sectionItems} showSource={groupBy === 'category'} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick-add ─────────────────────────────────────────────────────── */}
      {!shoppingMode && onAddCustomItem && (
        <div className="print:hidden">
          <QuickAddForm value={quickAdd} onChange={setQuickAdd} onAdd={onAddCustomItem} />
        </div>
      )}
    </div>
  );
}

function QuickAddForm({ value, onChange, onAdd }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onAdd(value.trim());
    onChange('');
  };
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add anything else…"
        className="flex-1 rounded-md border border-dashed border-slate-300 bg-transparent py-2 px-3 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 dark:border-slate-600 dark:text-slate-300 dark:placeholder-slate-500 dark:focus:border-emerald-500"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400 active:translate-y-px transition-all"
      >
        Add
      </button>
    </form>
  );
}

export default GroceryList;
