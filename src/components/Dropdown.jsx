import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export default function Dropdown({
  label,
  items = [],
  showChevron = true,
  ariaLabel = "Open actions menu",
  buttonClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.min(192, window.innerWidth - 16);
    const estimatedHeight = Math.min(48 * items.length + 8, 280);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    const shouldOpenUp = rect.bottom + 8 + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;

    setPosition({
      left,
      top: shouldOpenUp ? Math.max(8, rect.top - estimatedHeight - 8) : rect.bottom + 8,
    });
  }, [items.length]);

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnOutsideClick = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, updatePosition]);

  const menu = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-48 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl shadow-slate-900/10"
          style={position}
          role="menu"
        >
          {items.map((item) => (
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
              {item.icon && <item.icon size={16} />}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${buttonClassName}`}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        {showChevron && <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      {menu}
    </div>
  );
}
