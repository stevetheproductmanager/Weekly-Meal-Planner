import React, { useState, useEffect } from 'react';
import DishCard from './dishes/DishCard';
import DishListTable from './dishes/DishListTable';
import AttachSideDialog from './dialogs/AttachSideDialog';
import { XIcon } from './Icons';

const PAGE_SIZES = [24, 48, 96, 'All'];

function InventoryTab({
  kind,
  dishes = [],
  planEntries = [],
  planWithDetails = [],
  monthPlansData = {},  // { 'YYYY-MM-DD': [{ mainId, sideIds }...] }
  viewMode,
  canEditDish = null, // (dish) => bool  —  null means nobody can edit
  onAddMainToPlan,
  onAttachSide,
  onEditDish,
  onDeleteDish,
  onSaveDish,
  onSubmitCommunity,
  onAddNew = null,    // optional CTA for empty-collection state
  lastCookedMap = {},
}) {
  const [attachingSide, setAttachingSide] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterOnPlan, setFilterOnPlan] = useState(false);
  const [sortBy, setSortBy] = useState('az');
  const [pageSize, setPageSize] = useState(48);
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters/sort/page-size change
  useEffect(() => { setPage(1); }, [search, filterTag, filterOnPlan, sortBy, pageSize]);

  const allTags = Array.from(
    new Set(dishes.flatMap((d) => (Array.isArray(d.tags) ? d.tags : [])))
  ).sort((a, b) => a.localeCompare(b));

  // Build IDs for dishes that appear anywhere in the current week OR any loaded monthly week.
  const allMonthEntries = Object.values(monthPlansData).flat();
  const mainIdsInPlan = new Set([
    ...planEntries.map((e) => e.mainId),
    ...allMonthEntries.map((e) => e.mainId),
  ].filter(Boolean));
  const sidesInPlanIds = new Set([
    ...planWithDetails.flatMap((e) => e.sideIds || []),
    ...allMonthEntries.flatMap((e) => e.sideIds || []),
  ].filter(Boolean));

  const filtered = dishes
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesTag = !filterTag || (Array.isArray(item.tags) && item.tags.includes(filterTag));
      const matchesPlan = !filterOnPlan || (
        kind === 'main' ? mainIdsInPlan.has(item.id) : sidesInPlanIds.has(item.id)
      );
      return matchesSearch && matchesTag && matchesPlan;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'az':       return a.name.localeCompare(b.name);
        case 'za':       return b.name.localeCompare(a.name);
        case 'newest':   return (b.id || '').localeCompare(a.id || '');
        case 'category': {
          const catCmp = (a.category || '').localeCompare(b.category || '');
          return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name);
        }
        case 'saved': return (b.saveCount || 0) - (a.saveCount || 0);
        default: return 0;
      }
    });

  const effectivePageSize = pageSize === 'All' ? filtered.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = pageSize === 'All'
    ? filtered
    : filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center col-span-full">
      <span className="text-5xl select-none">{kind === 'main' ? '🍽️' : '🥗'}</span>
      <div>
        <p className="font-medium text-slate-700 dark:text-slate-300">
          {dishes.length === 0
            ? `No ${kind === 'main' ? 'main dishes' : 'sides'} yet`
            : filterOnPlan
              ? `No ${kind === 'main' ? 'mains' : 'sides'} on your plan yet`
              : `No ${kind === 'main' ? 'mains' : 'sides'} match your search`}
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          {dishes.length === 0
            ? `Add your first ${kind === 'main' ? 'main dish' : 'side dish'} to build your kitchen.`
            : filterOnPlan
              ? 'Add meals to your weekly or monthly plan and they\'ll appear here.'
              : 'Try a different search term or clear your filters.'}
        </p>
      </div>
      {dishes.length === 0 && onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          <span className="text-base leading-none">＋</span>
          Add {kind === 'main' ? 'main dish' : 'side dish'}
        </button>
      )}
    </div>
  );

  const renderContent = () => {
    if (viewMode === 'cards') {
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              kind={kind}
              inPlan={kind === 'main' ? mainIdsInPlan.has(dish.id) : sidesInPlanIds.has(dish.id)}
              onPrimaryAction={kind === 'main' ? () => onAddMainToPlan(dish.id) : null}
              onAttachToMeal={kind === 'side' ? () => setAttachingSide(dish) : undefined}
              onEdit={canEditDish?.(dish) ? () => onEditDish(kind, dish) : null}
              onDelete={canEditDish?.(dish) ? () => onDeleteDish(kind, dish) : null}
              onSave={onSaveDish ? () => onSaveDish(kind, dish.id) : null}
              onSubmitCommunity={onSubmitCommunity && canEditDish?.(dish) ? () => onSubmitCommunity(kind, dish.id) : null}
              lastCooked={lastCookedMap[dish.id]}
            />
          ))}
          {!filtered.length && emptyState}
        </div>
      );
    }

    return (
      <DishListTable
        kind={kind}
        dishes={paginated}
        inPlanIds={kind === 'main' ? mainIdsInPlan : sidesInPlanIds}
        canEditDish={canEditDish}
        onAddMainToPlan={onAddMainToPlan}
        onAttachSideToMeal={kind === 'side' ? (dish) => setAttachingSide(dish) : undefined}
        onEditDish={canEditDish ? onEditDish : null}
        onDeleteDish={canEditDish ? onDeleteDish : null}
        onSaveDish={onSaveDish ? (dishId) => onSaveDish(kind, dishId) : null}
        onSubmitCommunity={onSubmitCommunity ? (dishId) => onSubmitCommunity(kind, dishId) : null}
      />
    );
  };

  const renderPagination = () => {
    if (pageSize === 'All' || totalPages <= 1) return null;

    // Build page numbers to show: always first, last, current ±2, with ellipsis gaps
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, safePage - delta); i <= Math.min(totalPages - 1, safePage + delta); i++) {
      range.push(i);
    }
    if (safePage - delta > 2) range.unshift('...');
    if (safePage + delta < totalPages - 1) range.push('...');

    rangeWithDots.push(1);
    range.forEach((r) => rangeWithDots.push(r));
    if (totalPages > 1) rangeWithDots.push(totalPages);

    const btnBase = 'inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500';
    const btnActive = 'bg-emerald-600 text-white';
    const btnIdle = 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';
    const btnDisabled = 'text-slate-300 dark:text-slate-700 cursor-not-allowed';

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing {(safePage - 1) * effectivePageSize + 1}–{Math.min(safePage * effectivePageSize, filtered.length)} of {filtered.length} {kind === 'main' ? 'mains' : 'sides'}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`${btnBase} ${safePage === 1 ? btnDisabled : btnIdle}`}
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Prev
          </button>

          {rangeWithDots.map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-slate-400 dark:text-slate-600 text-sm select-none">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`${btnBase} ${p === safePage ? btnActive : btnIdle}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            className={`${btnBase} ${safePage === totalPages ? btnDisabled : btnIdle}`}
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next ›
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <input
            type="text"
            placeholder={`Search ${kind === 'main' ? 'mains' : 'sides'}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 pr-7 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
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

        {/* On-plan filter chip */}
        <button
          type="button"
          onClick={() => setFilterOnPlan((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            filterOnPlan
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-500'
          }`}
        >
          <span>📅</span>
          On plan
          {filterOnPlan && (
            <span className="opacity-80">
              · {kind === 'main' ? mainIdsInPlan.size : sidesInPlanIds.size}
            </span>
          )}
        </button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
        >
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="newest">Newest first</option>
          <option value="category">By category</option>
          <option value="saved">Most saved</option>
        </select>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}

        {/* Per page — desktop only */}
        <select
          value={pageSize}
          onChange={(e) => {
            const val = e.target.value;
            setPageSize(val === 'All' ? 'All' : Number(val));
          }}
          className="hidden sm:block bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'Show all' : `${s} / page`}</option>
          ))}
        </select>
      </div>

      <div>{renderContent()}</div>

      {renderPagination()}

      {attachingSide && (
        <AttachSideDialog
          side={attachingSide}
          planEntries={planWithDetails}
          onAttach={(entryId) => onAttachSide(entryId, attachingSide.id)}
          onClose={() => setAttachingSide(null)}
        />
      )}
    </div>
  );
}

export default InventoryTab;
