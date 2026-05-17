import React, { useState } from 'react';
import DishCard from './dishes/DishCard';
import DishListTable from './dishes/DishListTable';
import AttachSideDialog from './dialogs/AttachSideDialog';

function InventoryTab({
  kind,
  dishes = [],
  planEntries = [],
  planWithDetails = [],
  viewMode,
  onAddMainToPlan,
  onAttachSide,
  onEditDish,
  onDeleteDish,
}) {
  const [attachingSide, setAttachingSide] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState('az');

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

  const mainIdsInPlan = new Set(planEntries.map((e) => e.mainId));
  const sidesInPlanIds = new Set(planWithDetails.flatMap((e) => e.sideIds || []));

  const renderContent = () => {
    if (viewMode === 'cards') {
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              kind={kind}
              inPlan={kind === 'main' ? mainIdsInPlan.has(dish.id) : sidesInPlanIds.has(dish.id)}
              onPrimaryAction={kind === 'main' ? () => onAddMainToPlan(dish.id) : null}
              onAttachToMeal={kind === 'side' ? () => setAttachingSide(dish) : undefined}
              onEdit={() => onEditDish(kind, dish)}
              onDelete={() => onDeleteDish(kind, dish)}
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
        dishes={filtered}
        inPlanIds={kind === 'main' ? mainIdsInPlan : sidesInPlanIds}
        onAddMainToPlan={onAddMainToPlan}
        onAttachSideToMeal={kind === 'side' ? (dish) => setAttachingSide(dish) : undefined}
        onEditDish={onEditDish}
        onDeleteDish={onDeleteDish}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <input
          type="text"
          placeholder={`Search ${kind === 'main' ? 'mains' : 'sides'}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
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
              className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>{renderContent()}</div>

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
