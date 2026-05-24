import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from '../Icons';

const COMMON_UNITS = [
  'tsp', 'tbsp', 'cup', 'cups', 'fl oz', 'pt', 'qt', 'gal',
  'oz', 'lbs', 'g', 'kg',
  'ml', 'l',
  'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
  'can', 'cans', 'bag', 'bags', 'bunch', 'handful', 'pinch',
];

function DishDialog({ mode, initialKind, dish, onCancel, onSave }) {
  const [kind, setKind]           = useState(initialKind);
  const [name, setName]           = useState(dish?.name || '');
  const [category, setCategory]   = useState(dish?.category || '');
  const [tagsInput, setTagsInput] = useState((dish?.tags || []).join(', '));
  const [notes, setNotes]         = useState(dish?.notes || '');
  const [recipeUrl, setRecipeUrl] = useState(dish?.recipeUrl || '');
  const [nameError, setNameError] = useState('');
  const [ingredients, setIngredients] = useState(
    Array.isArray(dish?.ingredients) && dish.ingredients.length
      ? dish.ingredients.map((i) => ({ name: i?.name || '', quantity: i?.quantity || '', unit: i?.unit || '' }))
      : [{ name: '', quantity: '', unit: '' }],
  );

  const isEdit         = mode === 'edit';
  const ingredientsEndRef = useRef(null);
  const justAddedRef      = useRef(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  // After adding a new ingredient row, scroll it into view and focus the name field
  useEffect(() => {
    if (justAddedRef.current) {
      justAddedRef.current = false;
      ingredientsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Focus the last ingredient name input
      const inputs = document.querySelectorAll('[data-ing-name]');
      if (inputs.length) inputs[inputs.length - 1].focus();
    }
  }, [ingredients.length]);

  const handleIngredientChange = (index, field, value) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddIngredientRow = () => {
    justAddedRef.current = true;
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }]);
  };

  const handleRemoveIngredientRow = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('A name is required.');
      return;
    }
    setNameError('');

    const cleanedIngredients = ingredients
      .map((i) => ({ name: (i.name || '').trim(), quantity: (i.quantity || '').trim(), unit: (i.unit || '').trim() }))
      .filter((i) => i.name);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    onSave({
      kind: isEdit ? initialKind : kind,
      dish: {
        ...(dish?.id ? { id: dish.id } : {}),
        name: name.trim(),
        category: category.trim(),
        tags,
        notes: notes.trim(),
        recipeUrl: recipeUrl.trim(),
        ingredients: cleanedIngredients,
      },
    });
  };

  return (
    /* Mobile: bottom sheet. Desktop: centred modal */
    <div
      className="fixed inset-0 z-40 flex flex-col justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full sm:max-w-2xl flex flex-col rounded-t-2xl sm:rounded-xl bg-white border border-slate-200 shadow-xl dark:bg-slate-950 dark:border-slate-800"
        style={{ maxHeight: '92dvh' }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {isEdit ? 'Edit dish' : 'Add dish'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-4 py-4 space-y-4 text-sm text-slate-900 dark:text-slate-100"
        >
          {/* Type + Name */}
          <div className="flex gap-3">
            <div className="w-28 shrink-0 space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Type</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                disabled={isEdit}
                className="w-full bg-white border border-slate-300 rounded-md px-2 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              >
                <option value="main">Main</option>
                <option value="side">Side</option>
              </select>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError(''); }}
                placeholder={kind === 'main' ? 'e.g. Grilled chicken' : 'e.g. Baked potato'}
                autoComplete="off"
                className={`w-full bg-white border rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${nameError ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 dark:border-slate-700'}`}
              />
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}
            </div>
          </div>

          {/* Category + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Category <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Pasta"
                autoComplete="off"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Tags <span className="font-normal text-slate-400">(comma-sep, optional)</span></label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="quick, vegetarian"
                autoComplete="off"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Recipe URL */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Recipe URL <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              type="url"
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
              placeholder="https://..."
              autoComplete="off"
              inputMode="url"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Ingredients</label>

            <datalist id="ing-units">
              {COMMON_UNITS.map((u) => <option key={u} value={u} />)}
            </datalist>

            {/* Column headers — hidden on mobile, shown on sm+ */}
            <div className="hidden sm:grid grid-cols-[1fr_4rem_5rem_1.75rem] gap-2 px-0.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">name</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center">qty</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">unit</span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex flex-col sm:grid sm:grid-cols-[1fr_4rem_5rem_1.75rem] gap-1.5 sm:gap-2 sm:items-center p-2 sm:p-0 rounded-lg sm:rounded-none bg-slate-50 sm:bg-transparent dark:bg-slate-900/40 sm:dark:bg-transparent">
                  {/* Mobile label row */}
                  <div className="flex sm:hidden items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Ingredient {idx + 1}</span>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"
                        onClick={() => handleRemoveIngredientRow(idx)}
                      >
                        <XIcon size={11} />
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <input
                    type="text"
                    data-ing-name
                    placeholder="e.g. chicken breast"
                    value={ing.name}
                    autoComplete="off"
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                  />

                  {/* Qty + Unit row on mobile */}
                  <div className="flex sm:contents gap-2">
                    <input
                      type="text"
                      placeholder="qty"
                      value={ing.quantity}
                      autoComplete="off"
                      onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                      className="w-16 sm:w-full bg-white border border-slate-300 rounded-md px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 text-center"
                    />
                    <input
                      type="text"
                      list="ing-units"
                      placeholder="unit"
                      value={ing.unit}
                      autoComplete="off"
                      onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                      className="flex-1 sm:w-full bg-white border border-slate-300 rounded-md px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                    />
                    {/* Desktop remove button */}
                    <div className="hidden sm:flex items-center">
                      {ingredients.length > 1 ? (
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-red-300 hover:bg-red-900/40"
                          onClick={() => handleRemoveIngredientRow(idx)}
                        >
                          <XIcon size={12} />
                        </button>
                      ) : <span className="h-7 w-7" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={ingredientsEndRef} />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              onClick={handleAddIngredientRow}
            >
              + Add ingredient
            </button>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cooking tips, substitutions, serving suggestions…"
              rows={3}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-y dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 pb-safe border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-400 hover:to-emerald-500 active:translate-y-px"
            >
              {isEdit ? 'Save changes' : 'Save dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DishDialog;
