import React from 'react';
import { PencilIcon, TrashIcon, ExternalLinkIcon, CalendarPlusIcon, LinkIcon } from '../Icons';

function DishCard({ dish, kind, inPlan, onPrimaryAction, onAttachToMeal, onEdit, onDelete }) {
  const canAdd = !!onPrimaryAction;

  return (
    <div className="meal-card rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 shadow-sm hover:border-emerald-500/60 transition dark:border-slate-800 dark:bg-slate-950/60">
      <div className="meal-card-header flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-snug">
            {dish.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {dish.category && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {dish.category}
              </span>
            )}
            {dish.recipeUrl && (
              <a
                href={dish.recipeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/60 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Recipe <ExternalLinkIcon size={10} />
              </a>
            )}
            {kind === 'side' && inPlan && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                In plan
              </span>
            )}
          </div>
        </div>
        <div className="card-icons flex gap-1 shrink-0">
          {kind === 'side' && onAttachToMeal && (
            <button
              type="button"
              onClick={onAttachToMeal}
              title={inPlan ? 'Attach to another dinner' : 'Attach to a dinner'}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500/60 transition-colors ${
                inPlan
                  ? 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-900/30'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/30'
              }`}
            >
              <LinkIcon />
            </button>
          )}
          {canAdd && (
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={inPlan}
              title={inPlan ? 'Already in plan' : 'Add to week'}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500/60 transition-colors ${
                inPlan
                  ? 'text-emerald-500 dark:text-emerald-400 cursor-default opacity-60'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/30'
              }`}
            >
              <CalendarPlusIcon />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="icon-button subtle inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-50 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
              title="Edit"
              onClick={onEdit}
            >
              <PencilIcon />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="icon-button subtle inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-red-200 hover:bg-red-900/40 focus:outline-none focus:ring-1 focus:ring-red-500/60"
              title="Delete"
              onClick={onDelete}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {dish.tags && dish.tags.length > 0 && (
        <div className="tags flex flex-wrap gap-1">
          {dish.tags.map((tag) => (
            <span
              key={tag}
              className="tag-pill inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {(dish.ingredients || []).length > 0 && (
        <details className="ingredients-details text-xs text-slate-700 dark:text-slate-300">
          <summary className="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
            {(dish.ingredients || []).length} ingredient{(dish.ingredients || []).length !== 1 ? 's' : ''}
          </summary>
          <ul className="mt-1.5 ml-3 space-y-0.5">
            {(dish.ingredients || []).map((ing, idx) => {
              const qty = [ing.quantity, ing.unit].filter(Boolean).join(' ');
              return (
                <li key={idx} className="flex items-baseline gap-1.5">
                  {qty && (
                    <span className="shrink-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {qty}
                    </span>
                  )}
                  <span>{ing.name}</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {dish.notes && (
        <p className="meal-notes text-xs text-slate-600 border-t border-slate-100 pt-2 dark:text-slate-400 dark:border-slate-800">
          {dish.notes}
        </p>
      )}

    </div>
  );
}

export default DishCard;
