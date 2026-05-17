import React, { useState } from 'react';
import { XIcon } from '../Icons';

const COMMON_UNITS = [
  'tsp', 'tbsp', 'cup', 'cups', 'fl oz', 'pt', 'qt', 'gal',
  'oz', 'lbs', 'g', 'kg',
  'ml', 'l',
  'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
  'can', 'cans', 'bag', 'bags', 'bunch', 'handful', 'pinch',
];

function DishDialog({ mode, initialKind, dish, onCancel, onSave }) {
  const [kind, setKind] = useState(initialKind);
  const [name, setName] = useState(dish?.name || '');
  const [category, setCategory] = useState(dish?.category || '');
  const [tagsInput, setTagsInput] = useState((dish?.tags || []).join(', '));
  const [notes, setNotes] = useState(dish?.notes || '');
  const [recipeUrl, setRecipeUrl] = useState(dish?.recipeUrl || '');
  const [nameError, setNameError] = useState('');
  const [ingredients, setIngredients] = useState(
    Array.isArray(dish?.ingredients) && dish.ingredients.length
      ? dish.ingredients.map((i) => ({
          name: i?.name || '',
          quantity: i?.quantity || '',
          unit: i?.unit || '',
        }))
      : [{ name: '', quantity: '', unit: '' }],
  );

  const isEdit = mode === 'edit';

  const handleIngredientChange = (index, field, value) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddIngredientRow = () => {
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
      .map((i) => ({
        name: (i.name || '').trim(),
        quantity: (i.quantity || '').trim(),
        unit: (i.unit || '').trim(),
      }))
      .filter((i) => i.name);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payloadDish = {
      ...(dish?.id ? { id: dish.id } : {}),
      name: name.trim(),
      category: category.trim(),
      tags,
      notes: notes.trim(),
      recipeUrl: recipeUrl.trim(),
      ingredients: cleanedIngredients,
    };

    const finalKind = isEdit ? initialKind : kind;
    onSave({ kind: finalKind, dish: payloadDish });
  };

  return (
    <div className="modal-overlay fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="modal w-full max-w-lg mx-3 sm:mx-0 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-800">
        <div className="modal-header px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {isEdit ? 'Edit dish' : 'Add dish'}
          </h2>
        </div>
        <form
          onSubmit={handleSubmit}
          className="modal-body overflow-y-auto max-h-[80vh] px-4 py-3 space-y-3 text-sm text-slate-900 dark:text-slate-100"
        >
          <div className="form-row inline flex items-center gap-3">
            <label className="w-24 text-slate-700 dark:text-slate-300">Type</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              disabled={isEdit}
              className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="main">Main</option>
              <option value="side">Side</option>
            </select>
          </div>

          <div className="form-row space-y-1">
            <label className="block text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError(''); }}
              placeholder={kind === 'main' ? 'e.g. Grilled chicken' : 'e.g. Baked potato'}
              className={`w-full bg-white border rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${nameError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 dark:border-slate-700'}`}
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          <div className="form-row space-y-1">
            <label className="block text-slate-700 dark:text-slate-300">Category (optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Pasta, Veg, Grain"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="form-row space-y-1">
            <label className="block text-slate-700 dark:text-slate-300">Recipe URL (optional)</label>
            <input
              type="url"
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="form-row space-y-1">
            <label className="block text-slate-700 dark:text-slate-300">
              Tags (comma-separated, optional)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. quick, kid-friendly, vegetarian"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="form-row space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 dark:text-slate-300">Ingredients</label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 grid grid-cols-[1fr_4rem_5rem_1.75rem] gap-2 w-64 text-right pr-1">
                <span>name</span><span>qty</span><span>unit</span><span />
              </span>
            </div>

            {/* Unit suggestions datalist */}
            <datalist id="ing-units">
              {COMMON_UNITS.map((u) => <option key={u} value={u} />)}
            </datalist>

            <div className="flex flex-col gap-1.5">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_4rem_5rem_1.75rem] items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. chicken breast"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="2"
                    value={ing.quantity}
                    onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 text-center"
                  />
                  <input
                    type="text"
                    list="ing-units"
                    placeholder="lbs"
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                  />
                  {ingredients.length > 1 ? (
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-red-300 hover:bg-red-900/40 focus:outline-none"
                      onClick={() => handleRemoveIngredientRow(idx)}
                    >
                      <XIcon size={12} />
                    </button>
                  ) : <span />}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              onClick={handleAddIngredientRow}
            >
              + Add ingredient
            </button>
          </div>

          <div className="form-row space-y-1">
            <label className="block text-slate-700 dark:text-slate-300">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cooking tips, substitutions, serving suggestions…"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-y min-h-[72px] dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="modal-footer flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-emerald-400 hover:to-emerald-500 active:translate-y-px"
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
