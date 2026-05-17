import React, { useState, useEffect } from 'react';
import { XIcon } from '../Icons';

function MiscItemDialog({ mode = 'create', initialName = '', onCancel, onSave }) {
  const isEdit = mode === 'edit';
  const [name, setName] = useState(initialName || '');

  useEffect(() => {
    setName(initialName || '');
  }, [initialName, mode]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal w-full max-w-sm mx-3 sm:mx-0 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-800">
        <div className="modal-header flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {isEdit ? 'Edit other item' : 'Add other item'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <XIcon size={14} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="modal-body px-4 py-3 space-y-3 text-sm text-slate-900 dark:text-slate-100"
        >
          <div className="space-y-1">
            <label className="block text-slate-700 dark:text-slate-300">
              Item name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. soap, foil, snacks…"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="modal-footer flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="cancel inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
            >
              {isEdit ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MiscItemDialog;
