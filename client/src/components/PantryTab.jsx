import React, { useState } from 'react';
import { XIcon } from './Icons';

const COMMON_STAPLES = [
  // Oils, fats & dairy
  'Olive oil', 'Vegetable oil', 'Canola oil', 'Coconut oil', 'Sesame oil', 'Cooking spray',
  'Butter', 'Eggs', 'Milk', 'Heavy cream', 'Parmesan cheese', 'Shredded cheese',
  // Baking
  'All-purpose flour', 'Sugar', 'Brown sugar', 'Powdered sugar',
  'Baking powder', 'Baking soda', 'Vanilla extract', 'Cornstarch',
  'Breadcrumbs', 'Panko breadcrumbs', 'Active dry yeast',
  // Grains, pasta & bread
  'White rice', 'Brown rice', 'Pasta', 'Oats', 'Bread', 'Tortillas',
  // Fresh staples
  'Garlic', 'Onion', 'Shallots', 'Lemon', 'Lime', 'Potatoes', 'Carrots', 'Celery',
  // Spices & herbs
  'Salt', 'Black pepper', 'Garlic powder', 'Onion powder',
  'Paprika', 'Smoked paprika', 'Cayenne pepper', 'Red pepper flakes',
  'Cumin', 'Coriander', 'Chili powder', 'Curry powder', 'Turmeric',
  'Oregano', 'Thyme', 'Basil', 'Rosemary', 'Bay leaves',
  'Cinnamon', 'Ground ginger', 'Italian seasoning', 'Everything bagel seasoning',
  // Condiments & sauces
  'Soy sauce', 'Worcestershire sauce', 'Hot sauce', 'Sriracha',
  'Ketchup', 'Mustard', 'Dijon mustard', 'Mayonnaise',
  'Fish sauce', 'Oyster sauce', 'Hoisin sauce', 'BBQ sauce',
  'Tomato paste', 'Salsa',
  // Vinegars
  'White vinegar', 'Apple cider vinegar', 'Balsamic vinegar',
  'Red wine vinegar', 'Rice vinegar',
  // Broths & canned goods
  'Chicken broth', 'Beef broth', 'Vegetable broth',
  'Diced tomatoes', 'Crushed tomatoes', 'Tomato sauce',
  'Coconut milk', 'Black beans', 'Chickpeas', 'Kidney beans',
  'Pinto beans', 'Canned corn', 'Canned tuna',
  // Sweeteners
  'Honey', 'Maple syrup', 'Agave nectar',
  // Nuts, seeds & spreads
  'Peanut butter', 'Almond butter', 'Almonds', 'Walnuts',
  'Pecans', 'Sesame seeds', 'Sunflower seeds', 'Pine nuts',
  // Alcohol for cooking
  'White wine', 'Red wine', 'Dry sherry',
];

function PantryTab({ items = [], onAdd, onRemove }) {
  const [input, setInput]   = useState('');
  const [search, setSearch] = useState('');
  // The staples wall is huge — collapsed by default on phones
  const [staplesOpen, setStaplesOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 640 : true
  );

  // Fast lookup: lowercase name → id
  const itemMap = new Map(items.map(i => [i.name.toLowerCase(), i.id || i._id]));
  const hasItem = (name) => itemMap.has(name.toLowerCase());

  const handleAdd = (name) => {
    const trimmed = name.trim();
    if (!trimmed || hasItem(trimmed)) return;
    onAdd(trimmed);
    setInput('');
  };

  const filtered = search.trim()
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Ingredients you always have on hand. They're automatically hidden from your grocery list so you only see what you actually need to buy.
      </p>

      {/* ── Add custom item ──────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(input); } }}
          placeholder="Add an ingredient (e.g. olive oil, garlic)…"
          className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => handleAdd(input)}
          disabled={!input.trim() || hasItem(input.trim())}
          className="shrink-0 inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 transition-all"
        >
          Add
        </button>
      </div>

      {/* ── Common staples quick-toggle grid ────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setStaplesOpen(v => !v)}
          className="flex w-full items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
        >
          <span>Common staples — tap to add or remove</span>
          <span className="text-slate-400">{staplesOpen ? '▾' : '▸'}</span>
        </button>
        {staplesOpen && (
        <div className="flex flex-wrap gap-1.5">
          {COMMON_STAPLES.map(staple => {
            const already = hasItem(staple);
            return (
              <button
                key={staple}
                type="button"
                onClick={() => {
                  if (already) {
                    const id = itemMap.get(staple.toLowerCase());
                    if (id) onRemove(id);
                  } else {
                    onAdd(staple);
                  }
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  already
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:ring-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {already ? '✓ ' : ''}{staple}
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* ── Current pantry items ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Your pantry{' '}
            <span className="font-normal text-slate-400 dark:text-slate-500">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </p>
          {items.length > 8 && (
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter…"
              className="w-32 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <span className="text-4xl select-none">🏠</span>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Your pantry is empty</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Add staples above and they'll disappear from your grocery list automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map(item => {
              const id = item.id || item._id;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <span className="text-[11px] text-emerald-500">✓</span>
                  {item.name}
                  <button
                    type="button"
                    onClick={() => onRemove(id)}
                    className="text-emerald-400 hover:text-red-500 transition-colors ml-0.5"
                    title="Remove from pantry"
                  >
                    <XIcon size={10} />
                  </button>
                </span>
              );
            })}
            {search && filtered.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                No pantry items match "{search}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PantryTab;
