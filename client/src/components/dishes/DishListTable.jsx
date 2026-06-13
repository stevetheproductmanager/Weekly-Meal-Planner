import React, { useState } from 'react';
import { PencilIcon, TrashIcon, ExternalLinkIcon, CalendarPlusIcon, LinkIcon, HeartIcon, ShareCommunityIcon } from '../Icons';

function DishListTable({
  kind,
  dishes = [],
  inPlanIds = new Set(),
  canEditDish = null, // (dish) => bool
  onAddMainToPlan,
  onAttachSideToMeal,
  onEditDish,
  onDeleteDish,
  onSaveDish,
  onSubmitCommunity,
}) {
  // Mobile: tapping a row expands its details + secondary actions
  const [expandedId, setExpandedId] = useState(null);

  if (!dishes.length) {
    return (
      <p className="hint text-sm text-slate-500 dark:text-slate-400">
        No {kind === 'main' ? 'mains' : 'sides'} match your filters yet.
      </p>
    );
  }

  const ingredientText = (dish) =>
    (dish.ingredients || [])
      .filter((i) => i.name)
      .map((i) => {
        const qty = [i.quantity, i.unit].filter(Boolean).join(' ');
        return qty ? `${qty} ${i.name}` : i.name;
      })
      .join(', ');

  // Primary action button (add to plan / attach to meal) — always visible
  const PrimaryAction = ({ dish }) => (
    <>
      {kind === 'side' && onAttachSideToMeal && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAttachSideToMeal(dish); }}
          title={inPlanIds.has(dish.id) ? 'Attach to another dinner' : 'Attach to a dinner'}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-all active:translate-y-px focus:outline-none focus:ring-1 focus:ring-emerald-500/60 ${
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
          onClick={(e) => { e.stopPropagation(); onAddMainToPlan(dish.id); }}
          disabled={inPlanIds.has(dish.id)}
          title={inPlanIds.has(dish.id) ? 'Already in plan' : 'Add to week'}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-all active:translate-y-px focus:outline-none focus:ring-1 focus:ring-emerald-500/60 ${
            inPlanIds.has(dish.id)
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 cursor-default'
              : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm'
          }`}
        >
          <CalendarPlusIcon size={12} />
        </button>
      )}
    </>
  );

  // Secondary actions (save / community / edit / delete)
  const SecondaryActions = ({ dish }) => (
    <>
      {onSaveDish && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSaveDish(dish.id); }}
          title={dish.savedByMe ? 'Remove from saved' : 'Save dish'}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-pink-400/60 ${
            dish.savedByMe
              ? 'text-pink-500 dark:text-pink-400'
              : 'text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/30'
          }`}
        >
          <HeartIcon size={13} filled={dish.savedByMe} />
        </button>
      )}
      {onSubmitCommunity && dish.ownerId && !dish.isShared && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSubmitCommunity(dish.id); }}
          title="Share with community"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors focus:outline-none focus:ring-1 focus:ring-violet-400/60"
        >
          <ShareCommunityIcon size={13} />
        </button>
      )}
      {onEditDish && canEditDish?.(dish) && (
        <button
          type="button"
          className="icon-button subtle inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-50 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
          title="Edit"
          onClick={(e) => { e.stopPropagation(); onEditDish(kind, dish); }}
        >
          <PencilIcon />
        </button>
      )}
      {onDeleteDish && canEditDish?.(dish) && (
        <button
          type="button"
          className="icon-button danger inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-red-200 hover:bg-red-900/40 focus:outline-none focus:ring-1 focus:ring-red-500/60"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); onDeleteDish(kind, dish); }}
        >
          <TrashIcon />
        </button>
      )}
    </>
  );

  return (
    <div className="list-wrapper text-sm">
      <table className="list-table w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-900/80">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Name
            </th>
            <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Category
            </th>
            <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ingredients
            </th>
            <th className="w-12 sm:w-auto px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dishes.map((dish) => {
            const isExpanded = expandedId === dish.id;
            return (
              <React.Fragment key={dish.id}>
                <tr
                  onClick={() => setExpandedId(isExpanded ? null : dish.id)}
                  className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900/70 sm:cursor-default cursor-pointer"
                >
                  <td className="px-3 py-2.5 align-top text-slate-900 dark:text-slate-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{dish.name}</span>
                      {/* Badges — desktop inline; on mobile they live in the expanded panel */}
                      <span className="hidden sm:contents">
                        {dish.ownerId
                          ? <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">Community</span>
                          : <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">Library</span>
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
                        {dish.saveCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-pink-50 px-1.5 py-0.5 text-[10px] font-medium text-pink-500 dark:bg-pink-950/30 dark:text-pink-400">
                            ♥ {dish.saveCount}
                          </span>
                        )}
                      </span>
                      {dish.myRating > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" title={`Your rating: ${dish.myRating}/5`}>
                          {'★'.repeat(dish.myRating)}
                        </span>
                      )}
                    </div>
                    {/* Mobile: small category hint under the name */}
                    {dish.category && (
                      <span className="sm:hidden block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{dish.category}</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 align-top text-slate-700 dark:text-slate-300">
                    {dish.category}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 align-top text-slate-600 dark:text-slate-400">
                    {ingredientText(dish)}
                  </td>
                  <td className="px-3 py-2.5 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <PrimaryAction dish={dish} />
                      <span className="hidden sm:flex items-center gap-2">
                        <SecondaryActions dish={dish} />
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Mobile expanded detail panel */}
                {isExpanded && (
                  <tr className="sm:hidden border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
                    <td colSpan={4} className="px-3 py-3">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {dish.ownerId
                            ? <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">Community</span>
                            : <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">Library</span>
                          }
                          {kind === 'side' && inPlanIds.has(dish.id) && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">In plan</span>
                          )}
                          {dish.saveCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-pink-50 px-1.5 py-0.5 text-[10px] font-medium text-pink-500 dark:bg-pink-950/30 dark:text-pink-400">♥ {dish.saveCount}</span>
                          )}
                          {dish.recipeUrl && (
                            <a href={dish.recipeUrl} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <ExternalLinkIcon size={9} /> Recipe
                            </a>
                          )}
                        </div>
                        {ingredientText(dish) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {ingredientText(dish)}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <SecondaryActions dish={dish} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DishListTable;
