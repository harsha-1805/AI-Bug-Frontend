/**
 * Client-side mirror of the backend's email domain allow-list
 * (app/services/email_validator.py + settings.allowed_email_domains).
 *
 * This is purely for fast UX feedback ("that domain isn't accepted") —
 * the backend is still the source of truth and re-validates on every
 * signup/invite/edit, so keeping these two lists in sync isn't a
 * security requirement, just a nicer experience.
 */
export const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "ebit.com",
  "efficientbrains.com"
];

// The part before "@" — letters, numbers, and dots only. No #, _, -, +,
// or any other special character, mirroring the backend's
// email_validator.validate_email_domain().
const LOCAL_PART_RE = /^[A-Za-z0-9.]+$/;

export function isEmailDomainAllowed(email) {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@").pop().trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export function isEmailLocalPartValid(email) {
  if (!email || !email.includes("@")) return false;
  const localPart = email.split("@")[0];
  return LOCAL_PART_RE.test(localPart);
}

export const EMAIL_LOCAL_PART_ERROR =
  "The part of the email before \"@\" can only contain letters, numbers, and dots (no #, _, -, or other special characters).";

export function emailDomainErrorMessage(email) {
  const domain = (email.split("@").pop() || "").trim().toLowerCase();
  return `"@${domain}" isn't an accepted email domain. Please use one of: ${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")}`;
}
