import Badge from "./Badge.jsx";

const SEVERITY_TONE = { Critical: "critical", High: "high", Medium: "medium", Low: "low" };

export default function BugSummaryCard({ bugReport }) {
  if (!bugReport) return null;

  return (
    <div className="card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={SEVERITY_TONE[bugReport.severity] || "neutral"}>{bugReport.severity}</Badge>
        <Badge tone="info">{bugReport.priority}</Badge>
        {bugReport.bug_type && <Badge tone="neutral">{bugReport.bug_type}</Badge>}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{bugReport.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{bugReport.summary}</p>
    </div>
  );
}
