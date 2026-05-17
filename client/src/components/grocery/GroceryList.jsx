import React, { useState } from 'react';
import { XIcon } from '../Icons';

const makeKey = (item) =>
  `${(item.name || '').toLowerCase()}||${(item.unit || '').toLowerCase()}||${(item.category || '').toLowerCase()}`;

function GroceryList({
  items,
  onRemoveItem,
  onRemoveMiscItem,
  shoppingMode = false,
  checkedKeys = [],
  onToggleChecked,
}) {
  const [groupBy, setGroupBy] = useState('category');
  const [search, setSearch] = useState('');
  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = search.trim()
    ? safeItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : safeItems;

  if (!safeItems.length) {
    return (
      <p className="hint text-sm text-slate-500 dark:text-slate-400">
        Your grocery list will appear here once you pick some dinners or add other items.
      </p>
    );
  }

  const handleRemove = (item) => {
    if (item.source === 'misc' && onRemoveMiscItem) onRemoveMiscItem(item.id);
    else if (onRemoveItem) onRemoveItem(item);
  };

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

  const ItemRow = ({ item, idx, showSource = true }) => {
    const key = makeKey(item);
    const checked = shoppingMode && checkedKeys.includes(key);

    return (
      <tr
        key={item.id ?? idx}
        className={`border-b border-slate-200 transition-opacity duration-150 dark:border-slate-800/80 ${
          checked
            ? 'opacity-40'
            : 'hover:bg-slate-50 dark:hover:bg-slate-900/70'
        }`}
      >
        {shoppingMode && (
          <td className="w-8 pl-3 pr-1 py-2 align-middle">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleChecked?.(key)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-emerald-500 dark:border-slate-600"
            />
          </td>
        )}
        <td className="px-3 py-2.5 align-top">
          <span className={`font-medium text-slate-900 dark:text-slate-100 ${checked ? 'line-through' : ''}`}>
            {item.name}
          </span>
          {(() => {
            const qty = [item.quantityText, item.unit].filter(Boolean).join(' ');
            return qty ? (
              <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {qty}
              </span>
            ) : null;
          })()}
        </td>
        {showSource && (
          <td className="hidden sm:table-cell px-3 py-2.5 align-top text-slate-500 dark:text-slate-400 text-xs">
            {(item.fromMeals || []).join(', ')}
          </td>
        )}
        <td className="px-3 py-2 align-top text-right">
          {!shoppingMode && (onRemoveItem || onRemoveMiscItem) && (
            <RemoveBtn item={item} />
          )}
        </td>
      </tr>
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

  const SectionHeader = ({ label, count }) => (
    <div className="flex items-center justify-between px-1 pb-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">{count}</span>
    </div>
  );

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
        item.source === 'misc'
          ? 'Other Items'
          : (item.fromMeals && item.fromMeals[0]) || 'Unknown';
      (map[key] = map[key] || []).push(item);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Other Items') return 1;
      if (b === 'Other Items') return -1;
      return a.localeCompare(b);
    });
  };

  const sections = groupBy === 'category' ? groupByCategory() : groupByMeal();
  const checkedCount = shoppingMode
    ? filteredItems.filter((item) => checkedKeys.includes(makeKey(item))).length
    : 0;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search grocery list…"
          className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <XIcon size={12} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {filteredItems.length}{search ? ` of ${safeItems.length}` : ''}{' '}
          {safeItems.length === 1 ? 'item' : 'items'}
          {shoppingMode && checkedCount > 0 && (
            <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              · {checkedCount} checked
            </span>
          )}
        </span>
        <div className="inline-flex rounded-full bg-slate-100 p-0.5 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setGroupBy('category')}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              groupBy === 'category'
                ? 'bg-slate-700 text-white dark:bg-slate-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            By category
          </button>
          <button
            type="button"
            onClick={() => setGroupBy('meal')}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              groupBy === 'meal'
                ? 'bg-slate-700 text-white dark:bg-slate-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            By meal
          </button>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          No items match &ldquo;{search}&rdquo;.
        </p>
      )}

      <div className="space-y-4 overflow-x-auto">
        {sections.map(([label, sectionItems]) => (
          <div key={label} className="rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="rounded-t-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
              <SectionHeader label={label} count={sectionItems.length} />
            </div>
            <SectionTable
              sectionItems={sectionItems}
              showSource={groupBy === 'category'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroceryList;
