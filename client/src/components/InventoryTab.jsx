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
  viewMode,
  canEdit = true,
  onAddMainToPlan,
  onAttachSide,
  onEditDish,
  onDeleteDish,
}) {
  const [attachingSide, setAttachingSide] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState('az');
  const [pageSize, setPageSize] = useState(48);
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters/sort/page-size change
  useEffect(() => { setPage(1); }, [search, filterTag, sortBy, pageSize]);

  const allTags = Array.from(
    new Set(dishes.flatMap((d) => (Array.isArray(d.tags) ? d.tags : [])))
  );

  const filtered = dishes
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesTag = !filterTag || (Array.isArray(item.tags) && item.tags.includes(filterTag));
      return matchesSearch && matchesTag;
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
        default: return 0;
      }
    });

  const effectivePageSize = pageSize === 'All' ? filtered.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = pageSize === 'All'
    ? filtered
    : filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

  const mainIdsInPlan = new Set(planEntries.map((e) => e.mainId));
  const sidesInPlanIds = new Set(planWithDetails.flatMap((e) => e.sideIds || []));

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
              onEdit={canEdit ? () => onEditDish(kind, dish) : null}
              onDelete={canEdit ? () => onDeleteDish(kind, dish) : null}
            />
          ))}
          {!filtered.length && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No {kind === 'main' ? 'mains' : 'sides'} match your filters yet.
            </p>
          )}
        </div>
      );
    }

    return (
      <DishListTable
        kind={kind}
        dishes={paginated}
        inPlanIds={kind === 'main' ? mainIdsInPlan : sidesInPlanIds}
        onAddMainToPlan={onAddMainToPlan}
        onAttachSideToMeal={kind === 'side' ? (dish) => setAttachingSide(dish) : undefined}
        onEditDish={canEdit ? onEditDish : null}
        onDeleteDish={canEdit ? onDeleteDish : null}
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
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {/* Search — full width */}
        <div className="relative w-full">
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
        {/* Controls — wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 min-w-[100px] bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="newest">Newest first</option>
            <option value="category">By category</option>
          </select>

          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="flex-1 min-w-[100px] bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value;
              setPageSize(val === 'All' ? 'All' : Number(val));
            }}
            className="flex-1 min-w-[90px] bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'Show all' : `${s} / page`}</option>
            ))}
          </select>
        </div>
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
