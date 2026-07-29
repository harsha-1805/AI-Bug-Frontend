import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/**
 * Action-menu dropdown (e.g. the 3-dot row menu in User Management).
 *
 * Why a portal: this used to render its menu as a plain
 * `absolute`-positioned `<div>` inside the trigger button's own
 * `relative` wrapper. That wrapper usually sits inside a table cell,
 * and the table wraps its rows in an `overflow-x-auto`/`overflow-hidden`
 * container for horizontal scrolling — which also clips *vertical*
 * overflow, so the menu was silently cut off (or fully invisible) for
 * any row near the edge of that container. Rendering the menu into
 * `document.body` via a portal, positioned with `fixed` coordinates
 * computed from the trigger's `getBoundingClientRect()`, escapes that
 * clipping entirely regardless of which table/card/module it's used in.
 *
 * This also gives every module (Users, Projects, Tasks, Bugs, Sprints,
 * Navbar) automatically-responsive placement: the menu clamps its width
 * to the viewport, and flips to open upward/leftward when there isn't
 * room below/to the right of the trigger (common near the bottom of a
 * table or on narrow/mobile screens).
 */
export default function Dropdown({
  label,
  items = [],
  showChevron = true,
  ariaLabel = "Open menu",
  buttonClassName = "",
  menuWidth = 192,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Clamp menu width so it never overflows a narrow/mobile viewport.
    const width = Math.min(menuWidth, viewportWidth - 16);

    // Estimate menu height from item count (each row ~40px + padding)
    // so we can decide whether to open it upward instead of downward.
    const estimatedHeight = Math.min(items.length * 40 + 8, 320);

    const openUp = rect.bottom + estimatedHeight + 8 > viewportHeight && rect.top > estimatedHeight;

    // Prefer right-aligning under the trigger, but keep the whole menu
    // on-screen: never let it run off the left or right edge.
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, viewportWidth - width - 8));

    const top = openUp
      ? Math.max(8, rect.top - estimatedHeight - 8)
      : Math.min(rect.bottom + 8, viewportHeight - 8);

    setPosition({ top, left, width });
  }, [items.length, menuWidth]);

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();

    const handleOutside = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    // `true` (capture phase) so this also fires for scroll events on
    // inner scrollable containers (e.g. the table's own scroll area),
    // not just the window itself.
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, updatePosition]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
            className="z-[1000] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl shadow-slate-900/10"
          >
            {items.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No actions available</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                    item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-600"
                  }`}
                >
                  {item.icon && <item.icon size={15} />}
                  <span className="truncate">{item.label}</span>
                </button>
              ))
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${buttonClassName}`}
      >
        {label}
        {showChevron && (
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {menu}
    </div>
  );
}
