import { Gauge } from "lucide-react";
import Badge from "./Badge.jsx";

function toneForScore(score) {
  if (score >= 70) return { tone: "success", bar: "bg-emerald-500", label: "High confidence" };
  if (score >= 40) return { tone: "medium", bar: "bg-amber-500", label: "Medium confidence" };
  return { tone: "critical", bar: "bg-red-500", label: "Low confidence" };
}

export default function ConfidenceCard({ score }) {
  const { tone, bar, label } = toneForScore(score);

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Gauge size={16} className="text-primary-600" />
          Confidence Score
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      <p className="mt-1.5 text-right text-xs font-medium text-slate-500">{Math.round(score)}/100</p>
    </div>
  );
}
