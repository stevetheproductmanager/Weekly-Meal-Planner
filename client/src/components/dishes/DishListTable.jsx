import React from 'react';
import { PencilIcon, TrashIcon, ExternalLinkIcon, CalendarPlusIcon, LinkIcon } from '../Icons';

function DishListTable({
  kind,
  dishes = [],
  inPlanIds = new Set(),
  canEditDish = null, // (dish) => bool
  onAddMainToPlan,
  onAttachSideToMeal,
  onEditDish,
  onDeleteDish,
}) {
  if (!dishes.length) {
    return (
      <p className="hint text-sm text-slate-500 dark:text-slate-400">
        No {kind === 'main' ? 'mains' : 'sides'} match your filters yet.
      </p>
    );
  }

  return (
    <div className="list-wrapper overflow-x-auto text-sm">
      <table className="list-table min-w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-900/80">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Name
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Category
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ingredients
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {dishes.map((dish) => (
            <tr
              key={dish.id}
              className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900/70"
            >
              <td className="px-3 py-2 align-top text-slate-900 dark:text-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>{dish.name}</span>
                  {dish.ownerId
                    ? <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">Community</span>
                    : <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">Simmer</span>
                  }
                  {dish.recipeUrl && (
                    <a
                      href={dish.recipeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLinkIcon size={10} />
                    </a>
                  )}
                  {kind === 'side' && inPlanIds.has(dish.id) && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      In plan
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 align-top text-slate-700 dark:text-slate-300">
                {dish.category}
              </td>
              <td className="px-3 py-2 align-top text-slate-600 dark:text-slate-400">
                {(dish.ingredients || [])
                  .filter((i) => i.name)
                  .map((i) => {
                    const qty = [i.quantity, i.unit].filter(Boolean).join(' ');
                    return qty ? `${qty} ${i.name}` : i.name;
                  })
                  .join(', ')}
              </td>
              <td className="px-3 py-2 align-top text-right">
                <div className="flex items-center justify-end gap-2">
                  {kind === 'side' && onAttachSideToMeal && (
                    <button
                      type="button"
                      onClick={() => onAttachSideToMeal(dish)}
                      title={inPlanIds.has(dish.id) ? 'Attach to another dinner' : 'Attach to a dinner'}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-all active:translate-y-px focus:outline-none focus:ring-1 focus:ring-emerald-500/60 ${
                        inPlanIds.has(dish.id)
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm'
                      }`}
                    >
                      <LinkIcon size={12} />
                    </button>
                  )}
                  {kind === 'main' && (
                    <button
                      type="button"
                      onClick={() => onAddMainToPlan(dish.id)}
                      disabled={inPlanIds.has(dish.id)}
                      title={inPlanIds.has(dish.id) ? 'Already in plan' : 'Add to week'}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-all active:translate-y-px focus:outline-none focus:ring-1 focus:ring-emerald-500/60 ${
                        inPlanIds.has(dish.id)
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 cursor-default'
                          : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm'
                      }`}
                    >
                      <CalendarPlusIcon size={12} />
                    </button>
                  )}
                  {onEditDish && canEditDish?.(dish) && (
                    <button
                      type="button"
                      className="icon-button subtle inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-50 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                      title="Edit"
                      onClick={() => onEditDish(kind, dish)}
                    >
                      <PencilIcon />
                    </button>
                  )}
                  {onDeleteDish && canEditDish?.(dish) && (
                    <button
                      type="button"
                      className="icon-button subtle inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-red-200 hover:bg-red-900/40 focus:outline-none focus:ring-1 focus:ring-red-500/60"
                      title="Delete"
                      onClick={() => onDeleteDish(kind, dish)}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DishListTable;
