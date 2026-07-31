/**
 * Safely turns any axios error into a plain, human-readable string.
 *
 * Why this exists: FastAPI returns `detail` as a STRING for most errors
 * (e.g. "Sprint not found") but as an ARRAY OF OBJECTS for 422 validation
 * errors, e.g.:
 *   { detail: [{ loc: ["body","email"], msg: "value is not a valid email
 *     address", type: "value_error" }] }
 *
 * Several pages used to do `toast.error(err.response?.data?.detail)`
 * directly. When `detail` was that array, react-hot-toast tried to
 * render a plain object as a React child, which throws
 * "Objects are not valid as a React child" — and because nothing in the
 * app wraps this in an ErrorBoundary, that crash took down the whole
 * page, leaving a blank screen. This is exactly what caused the blank
 * screen on "invite user with a bad email".
 *
 * Every catch block in the app should route through this instead of
 * reading `err.response?.data?.detail` directly.
 */
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const detail = err?.response?.data?.detail;

  if (!detail) return err?.message || fallback;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    // FastAPI/pydantic 422 shape: [{ loc, msg, type }, ...]
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
          return field && typeof field === "string"
            ? `${field}: ${item.msg}`
            : item.msg || JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);
    return messages.length ? messages.join(" | ") : fallback;
  }

  if (typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  return fallback;
}
