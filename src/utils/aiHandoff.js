/**
 * The AI Assistant is its own route, so a plain HTML5 drag-and-drop
 * can't carry a dragged Task/Bug card across the navigation the drop
 * triggers — the dragged element (and the drag operation itself) is
 * gone the instant the page unmounts. This sessionStorage handoff is
 * the bridge: whoever initiates the request (a drop on the Sidebar's
 * "AI Assistant" link, or the ✨ "Generate test cases" action on a
 * card/row) stores what to generate, navigates to /ai-assistant, and
 * that page reads + clears it on mount.
 */
const HANDOFF_KEY = "bugpilot:ai-test-case-request";

export function setPendingTestCaseRequest(entityType, entityId, title) {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ entityType, entityId, title }));
  } catch {
    // sessionStorage unavailable (private browsing etc.) — the explicit
    // in-page generate action still works without the handoff.
  }
}

export function takePendingTestCaseRequest() {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Custom drag MIME carrying { entityType, entityId, title } as JSON —
// set alongside any existing "text/plain" drag data (e.g. the Tasks
// board's kanban drag), so dropping on a kanban column still works
// exactly as before and dropping on the Sidebar's AI Assistant link
// also works, from the same drag gesture.
export const AI_ENTITY_DRAG_MIME = "application/x-bugpilot-entity";
