/**
 * Trigger a CSV file download in the browser from a plain-text CSV string.
 * Works without any server round-trip — we build a Blob URL, click it
 * programmatically, then revoke it to avoid memory leaks.
 *
 * @param {string} csvText  Full CSV content (already formatted — first line is the header row).
 * @param {string} label    Used as the file name base, e.g. "login-page-test-cases".
 *                          Spaces are replaced with hyphens and the string is lowercased.
 */
export function downloadCsv(csvText, label = "test-cases") {
  const safeName = label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 80);

  // Leading UTF-8 BOM so Excel renders non-ASCII characters correctly
  // instead of falling back to the system codepage and showing garbled
  // symbols in place of things like curly quotes or accented names.
  const blob = new Blob(["\ufeff" + csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
