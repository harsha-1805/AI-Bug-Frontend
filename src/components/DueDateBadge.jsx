import { Calendar, AlertTriangle } from "lucide-react";

/**
 * Due-date pill used on Task/Subtask cards, the Tasks table view, and the
 * Sprints table. Mirrors the "red hazard" due-date treatment Jira uses on
 * its backlog board — overdue or due-within-2-days dates get a red pill
 * with a warning triangle; everything else stays a neutral gray calendar
 * pill so the hazard state actually stands out.
 *
 * `doneLike` lets a caller suppress the hazard styling for items that are
 * already Done/Completed — a finished task with a due date in the past
 * isn't "at risk", it's just done.
 */
const SOON_THRESHOLD_DAYS = 2;

function daysUntil(dateStr) {
  const due = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

export default function DueDateBadge({ date, doneLike = false, className = "" }) {
  if (!date) return null;

  const diff = daysUntil(date);
  const label = new Date(`${date}T00:00:00`).toLocaleDateString();
  const isOverdue = !doneLike && diff < 0;
  const isSoon = !doneLike && diff >= 0 && diff <= SOON_THRESHOLD_DAYS;
  const hazard = isOverdue || isSoon;

  return (
    <span
      title={isOverdue ? "Overdue" : isSoon ? "Due soon" : undefined}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        hazard ? "border-red-200 bg-red-50 text-red-600" : "border-transparent text-slate-400"
      } ${className}`}
    >
      {hazard ? <AlertTriangle size={12} /> : <Calendar size={12} />}
      {label}
    </span>
  );
}
