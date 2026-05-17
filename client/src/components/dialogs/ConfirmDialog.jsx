import React from 'react';

function ConfirmDialog({
  title,
  message,
  warning,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Delete',
  confirmVariant = 'danger', // 'danger' | 'secondary'
}) {
  const confirmClasses =
    confirmVariant === 'secondary'
      ? 'inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
      : 'inline-flex items-center rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-sm hover:bg-red-400';

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="modal small w-full max-w-sm mx-3 sm:mx-0 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-800">
        <div className="modal-header px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
        </div>
        <div className="modal-body px-4 py-3 space-y-2 text-sm text-slate-800 dark:text-slate-200">
          <p>{message}</p>
          {warning && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
              {warning}
            </p>
          )}
        </div>
        <div className="modal-footer flex justify-end gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="secondary inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button type="button" className={confirmClasses} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
