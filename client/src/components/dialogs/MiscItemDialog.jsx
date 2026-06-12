import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from '../Icons';

function MiscItemDialog({ mode = 'create', initialName = '', onCancel, onSave }) {
  const isEdit = mode === 'edit';
  const [name, setName] = useState(initialName || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setName(initialName || '');
  }, [initialName, mode]);

  // Auto-focus and select existing text so the user can type immediately
  useEffect(() => {
    inputRef.current?.select();
  }, []);

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
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {isEdit ? 'Edit other item' : 'Add other item'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <XIcon size={14} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-4 py-4 space-y-3 text-sm text-slate-900 dark:text-slate-100"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Item name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. soap, foil, snacks…"
              autoComplete="off"
              autoFocus
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
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
