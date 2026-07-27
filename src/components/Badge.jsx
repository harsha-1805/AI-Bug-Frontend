const TONES = {
  critical: "bg-red-50 text-red-600 border-red-100",
  high: "bg-orange-50 text-orange-600 border-orange-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  low: "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-emerald-50 text-emerald-600 border-emerald-100",
  info: "bg-primary-50 text-primary-700 border-primary-100",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone] || TONES.neutral}`}>
      {children}
    </span>
  );
}
