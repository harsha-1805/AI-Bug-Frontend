import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn bg-transparent text-slate-600 hover:bg-slate-100",
  danger: "btn bg-red-600 text-white hover:bg-red-700",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  icon: Icon,
  className = "",
  // When true, renders the button in a visibly muted, unclickable state
  // with a tooltip explaining why — used for actions like "New Project"
  // that a role isn't permitted to do. Keeps the button in its normal
  // place in the layout (so the page doesn't visually shift/rearrange
  // between roles) instead of just not rendering it at all, which reads
  // as "broken" rather than "not allowed".
  permissionLocked = false,
  lockedReason = "You don't have permission to do this",
  ...props
}) {
  const isDisabled = loading || permissionLocked || props.disabled;
  return (
    <button
      {...props}
      className={`${VARIANTS[variant]} ${permissionLocked ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      disabled={isDisabled}
      title={permissionLocked ? lockedReason : props.title}
      aria-label={permissionLocked ? lockedReason : props["aria-label"]}
      onClick={permissionLocked ? undefined : props.onClick}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
