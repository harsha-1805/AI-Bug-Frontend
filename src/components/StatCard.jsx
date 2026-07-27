import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({ icon: Icon, iconTone = "text-primary-600 bg-primary-50", label, value, delta, deltaDirection = "up" }) {
  const isUp = deltaDirection === "up";
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconTone}`}>
          <Icon size={16} />
        </span>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-slate-800">{value}</span>
        {delta && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}>
            {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
