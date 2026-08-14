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

export function isEmailDomainAllowed(email) {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@").pop().trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export function emailDomainErrorMessage(email) {
  const domain = (email.split("@").pop() || "").trim().toLowerCase();
  return `"@${domain}" isn't an accepted email domain. Please use one of: ${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")}`;
}
