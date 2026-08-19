/**
 * Backend timestamps (created_at/updated_at) are stored and serialized as
 * naive UTC — e.g. "2026-08-19T10:30:00.123456", with no "Z"/offset suffix
 * (see DateTime columns in app/models.py, default=datetime.utcnow).
 *
 * `new Date(...)` on a string like that is parsed as LOCAL time, not UTC,
 * so `.toLocaleString()` silently produced the wrong clock time (off by
 * whatever the browser's UTC offset is) instead of an IST time. This
 * normalizes the string to be explicitly UTC before parsing, then formats
 * it in Asia/Kolkata regardless of the viewer's browser/OS timezone —
 * this app is IST-only, so we don't want it drifting per-browser either.
 */
const HAS_TZ_SUFFIX = /Z$|[+-]\d{2}:?\d{2}$/;

function toUtcDate(value) {
  if (!value) return null;
  const iso = HAS_TZ_SUFFIX.test(value) ? value : `${value}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "19 Aug 2026, 4:00 pm" */
export function formatDateTimeIST(value) {
  const d = toUtcDate(value);
  if (!d) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** e.g. "19 Aug 2026" */
export function formatDateIST(value) {
  const d = toUtcDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
