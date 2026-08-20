import { Check } from "lucide-react";

/**
 * Checkbox-list multi-select. Replaces the old single `<select>` used for
 * role assignment: a user can now hold more than one role at once (the
 * backend's `user_roles` join table already supported this — this is the
 * UI catching up), so instead of one dropdown that picks exactly one
 * option, this renders one checkbox per option and lets several be
 * checked simultaneously.
 */
export default function MultiSelectCheckboxes({
  options = [], // [{ id, name, description? }]
  selectedIds = [],
  onChange,
  disabled = false,
  emptyMessage = "No options available",
}) {
  const toggle = (id) => {
    if (disabled) return;
    const isSelected = selectedIds.includes(id);
    const next = isSelected ? selectedIds.filter((v) => v !== id) : [...selectedIds, id];
    onChange?.(next);
  };

  if (options.length === 0) {
    return <p className="text-sm text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div
      role="group"
      className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-2 sm:max-h-72"
    >
      {options.map((option) => {
        const checked = selectedIds.includes(option.id);
        return (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-slate-50 ${
              disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <span
              className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border transition-colors ${
                checked ? "border-primary-600 bg-primary-600" : "border-slate-300 bg-white"
              }`}
            >
              {checked && <Check size={12} className="text-white" strokeWidth={3} />}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(option.id)}
            />
            <span className="min-w-0">
              <span className="block truncate font-medium text-slate-700">{option.name}</span>
              {option.description && (
                <span className="block truncate text-xs text-slate-400">{option.description}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
