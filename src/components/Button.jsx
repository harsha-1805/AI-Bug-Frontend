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
  ...props
}) {
  return (
    <button className={`${VARIANTS[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
