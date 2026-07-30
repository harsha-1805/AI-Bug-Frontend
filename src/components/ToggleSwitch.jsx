/**
 * Small on/off toggle switch. Used in User Management's Status column so
 * Admin/HR can activate or deactivate a user with one click instead of
 * digging into the 3-dot menu — flipping it fires `onChange(nextValue)`,
 * which the parent wires straight to the activate/deactivate API calls.
 */
export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  loading = false,
  labelOn = "Active",
  labelOff = "Inactive",
  size = "md",
}) {
  const dims = size === "sm" ? { track: "h-5 w-9", knob: "h-3.5 w-3.5", translate: "translate-x-4" } : { track: "h-6 w-11", knob: "h-4.5 w-4.5", translate: "translate-x-5" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? `${labelOn} — click to deactivate` : `${labelOff} — click to activate`}
      disabled={disabled || loading}
      onClick={() => !disabled && !loading && onChange?.(!checked)}
      className={`relative inline-flex flex-shrink-0 ${dims.track} items-center rounded-full border transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-emerald-200 bg-emerald-500" : "border-slate-200 bg-slate-300"
      }`}
    >
      <span
        className={`inline-block ${dims.knob} transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
          checked ? dims.translate : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
