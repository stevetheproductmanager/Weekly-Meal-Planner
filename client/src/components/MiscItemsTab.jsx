import React, { useState } from 'react';
import { PencilIcon, TrashIcon, XIcon } from './Icons';

function MiscItemsTab({ items, activeGroceryInventoryIds = new Set(), onAddToGrocery, onDeleteItem, onOpenMiscDialog }) {
  const safeItems = Array.isArray(items) ? items : [];
  const [viewMode, setViewMode] = useState('cards');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('az');

  const handleAddClick = () => { if (onOpenMiscDialog) onOpenMiscDialog(null); };
  const handleEditClick = (item) => { if (onOpenMiscDialog) onOpenMiscDialog(item); };

  const displayItems = [...safeItems]
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'az':     return (a.name || '').localeCompare(b.name || '');
        case 'za':     return (b.name || '').localeCompare(a.name || '');
        case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:       return 0;
      }
    });

  const noResults = safeItems.length > 0 && displayItems.length === 0;

  const renderEmpty = () => (
    <p className="text-sm text-slate-500 dark:text-slate-400">
      You&apos;ll see items here after you add them from the Grocery List using &quot;Add item&quot;,
      or by adding them here.
    </p>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-900/80">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Item
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item) => {
            const inList = activeGroceryInventoryIds.has(item.id);
            return (
              <tr
                key={item.id}
                className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900/70"
              >
                <td className="px-3 py-2 align-middle text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    {item.name}
                    {inList && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        In list
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    {!item.isShared && (
                      <button
                        type="button"
                        className="icon-button subtle inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-50 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                        title="Edit item"
                        onClick={() => handleEditClick(item)}
                      >
                        <PencilIcon />
                      </button>
                    )}
                    {onDeleteItem && !item.isShared && (
                      <button
                        type="button"
                        className="icon-button danger inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-red-200 hover:bg-red-900/40 focus:outline-none focus:ring-1 focus:ring-red-500/60"
                        title="Delete item"
                        onClick={() => onDeleteItem(item.id)}
                      >
                        <TrashIcon />
                      </button>
                    )}
                    {onAddToGrocery && (
                      <button
                        type="button"
                        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm active:translate-y-px transition-all ${
                          inList
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/50'
                            : 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500'
                        }`}
                        onClick={() => onAddToGrocery(item.id)}
                      >
                        + Item
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {displayItems.map((item) => {
        const inList = activeGroceryInventoryIds.has(item.id);
        return (
          <div
            key={item.id}
            className={`rounded-xl border bg-white p-3 flex flex-col justify-between shadow-sm transition-colors dark:bg-slate-950/80 ${
              inList
                ? 'border-emerald-400/70 dark:border-emerald-600/60'
                : 'border-slate-200 hover:border-emerald-500/60 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50 break-words">
                  {item.name}
                </div>
                {inList && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    In list
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!item.isShared && (
                  <button
                    type="button"
                    className="icon-button subtle inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-50 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                    title="Edit item"
                    onClick={() => handleEditClick(item)}
                  >
                    <PencilIcon />
                  </button>
                )}
                {onDeleteItem && !item.isShared && (
                  <button
                    type="button"
                    className="icon-button danger inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-red-200 hover:bg-red-900/40 focus:outline-none focus:ring-1 focus:ring-red-500/60"
                    title="Delete item"
                    onClick={() => onDeleteItem(item.id)}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
            {onAddToGrocery && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm active:translate-y-px transition-all ${
                    inList
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/50'
                      : 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500'
                  }`}
                  onClick={() => onAddToGrocery(item.id)}
                >
                  + Item
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Header: title + Cards/List toggle + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Other Items Inventory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Common non-meal items you often buy. Add them to this week&apos;s grocery list in one click.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs dark:bg-slate-900">
            <button
              type="button"
              className={`px-3 py-1 rounded-full ${
                viewMode === 'cards'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full ${
                viewMode === 'list'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          {onOpenMiscDialog && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-emerald-400 hover:to-emerald-500 hover:shadow active:translate-y-px active:shadow-none"
              onClick={handleAddClick}
            >
              <span className="text-base leading-none">＋</span>
              Add item
            </button>
          )}
        </div>
      </div>

      {/* Filter bar: search + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-7 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
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
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
        >
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {/* Content */}
      {safeItems.length === 0
        ? renderEmpty()
        : noResults
          ? <p className="text-sm text-slate-400 dark:text-slate-500">No items match &ldquo;{search}&rdquo;.</p>
          : viewMode === 'list' ? renderListView() : renderCardView()
      }
    </div>
  );
}

export default MiscItemsTab;
