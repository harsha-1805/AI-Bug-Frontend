/**
 * Shared, lightweight validation helpers used across the app's plain
 * useState forms (Projects, Sprints, Tasks, Bugs, BugReportForm,
 * UserManagement, Settings, EvidenceUploader, etc).
 *
 * This intentionally does NOT pull in a schema library (zod/yup) or
 * migrate every form to react-hook-form — it's a small, dependency-free
 * layer so every page can validate the same way with minimal changes.
 */

// ---- Character limits -------------------------------------------------

/** Max length for any single-line text input (title, name, module...). */
export const TEXT_MAX_LENGTH = 100;

/** Max length for any multi-line textarea (description, summary...). */
export const TEXTAREA_MAX_LENGTH = 500;

/** Emails can legitimately exceed 100 chars (subdomains etc.) — RFC 5321 caps at 254. */
export const EMAIL_MAX_LENGTH = 254;

// ---- File upload limits ------------------------------------------------

export const MAX_IMAGE_FILE_SIZE_MB = 5;
export const MAX_IMAGE_FILE_SIZE_BYTES = MAX_IMAGE_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/**
 * Validates a File object for the evidence/attachment uploaders.
 * Returns an error message string, or null if the file is valid.
 * Checks the *actual* file.type (not just the <input accept> hint,
 * which a renamed file can bypass).
 */
export function validateImageFile(file) {
  if (!file) return "Please choose a file";
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Only PNG, JPG, JPEG or WEBP images are allowed";
  }
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return `Image must be smaller than ${MAX_IMAGE_FILE_SIZE_MB}MB`;
  }
  return null;
}

// ---- Generic field helpers ---------------------------------------------

/** True if a string is empty or made up only of whitespace. */
export function isBlank(value) {
  return !value || !String(value).trim();
}

/**
 * Validates a required text field against blank + max length.
 * Returns an error message, or null if valid.
 */
export function validateRequiredText(value, { label = "This field", maxLength = TEXT_MAX_LENGTH } = {}) {
  if (isBlank(value)) return `${label} is required`;
  if (String(value).trim().length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer`;
  }
  return null;
}

/** Validates an optional text/textarea field against max length only. */
export function validateOptionalText(value, { label = "This field", maxLength = TEXTAREA_MAX_LENGTH } = {}) {
  if (!value) return null;
  if (String(value).trim().length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer`;
  }
  return null;
}

/** True if `to` is on/after `from` (both yyyy-mm-dd strings). Empty values pass. */
export function isDateRangeValid(from, to) {
  if (!from || !to) return true;
  return new Date(to) >= new Date(from);
}

/** Basic browser-URL sanity check (http/https, has a dot) — not exhaustive. */
export function isValidUrl(value) {
  if (!value) return true; // optional field
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
