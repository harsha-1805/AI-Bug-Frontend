import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer, className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-6">
      <div className={`flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-3rem)] ${className}`}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="min-w-0 flex-1 break-words text-base font-semibold text-slate-800">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-4 py-3 [&>button]:w-full sm:flex-row sm:justify-end sm:px-5 sm:py-4 sm:[&>button]:w-auto">{footer}</div>}
      </div>
    </div>
  );
}
