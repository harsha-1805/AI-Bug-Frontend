import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";

/**
 * Custom Tailwind dropdown/select control.
 *
 * Replaces native `<select>` elements across the app with a styled,
 * fully-Tailwind listbox so the dropdown menu looks consistent (rounded
 * corners, shadow, hover states) everywhere instead of falling back to
 * the browser's native (and unstyleable) select UI.
 *
 * Positioning follows the same portal + `getBoundingClientRect()`
 * approach as `Dropdown.jsx`: the menu renders into `document.body` with
 * `position: fixed` coordinates, so it never gets clipped by a table's
 * `overflow-x-auto` wrapper or a modal's scroll container, and it clamps
 * its width/height and flips upward automatically on small/mobile
 * viewports where there isn't room below the trigger.
 *
 * options: [{ value, label, disabled? }]
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  className = "",
  ariaLabel,
  id,
  // When true, shows a small "×" clear button once a value is selected,
  // letting the user get back to the placeholder ("All statuses" etc.)
  // without it — previously there was no way back to that state once a
  // specific option was picked.
  clearable = false,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [highlighted, setHighlighted] = useState(-1);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listboxId = useId();

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Menu is always at least as wide as the trigger, but never wider
    // than the viewport (with a small margin) on narrow/mobile screens.
    const width = Math.min(Math.max(rect.width, 180), viewportWidth - 16);

    const estimatedHeight = Math.min(options.length * 38 + 10, 280);
    const openUp = rect.bottom + estimatedHeight + 8 > viewportHeight && rect.top > estimatedHeight;

    let left = rect.left;
    left = Math.max(8, Math.min(left, viewportWidth - width - 8));

    const top = openUp
      ? Math.max(8, rect.top - estimatedHeight - 6)
      : Math.min(rect.bottom + 6, viewportHeight - 8);

    setPosition({ top, left, width });
  }, [options.length]);

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();
    setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);

    const handleOutside = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, updatePosition]);

  const commit = (option) => {
    if (!option || option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveHighlight = (delta) => {
    setHighlighted((prev) => {
      let next = prev;
      for (let i = 0; i < options.length; i += 1) {
        next = (next + delta + options.length) % options.length;
        if (!options[next]?.disabled) return next;
      }
      return prev;
    });
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (event.key === "ArrowDown") {
        moveHighlight(1);
      } else if (event.key === "ArrowUp") {
        moveHighlight(-1);
      } else {
        commit(options[highlighted]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(options[highlighted]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-activedescendant={highlighted >= 0 ? `${listboxId}-opt-${highlighted}` : undefined}
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
            className="z-[1000] max-h-[280px] max-w-[calc(100vw-1rem)] overflow-auto rounded-xl border border-border bg-white py-1 shadow-xl shadow-slate-900/10 focus:outline-none"
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No options available</li>
            ) : (
              options.map((option, index) => (
                <li
                  key={`${option.value}-${index}`}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={String(option.value) === String(value)}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => commit(option)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${
                    option.disabled
                      ? "cursor-not-allowed text-slate-300"
                      : index === highlighted
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {String(option.value) === String(value) && (
                    <Check size={14} className="shrink-0 text-primary-600" />
                  )}
                </li>
              ))
            )}
          </ul>,
          document.body
        )
      : null;

  // Only fall back to the full-width default when the caller hasn't
  // supplied its own width utility (e.g. "w-auto", "w-40", "max-w-xs").
  // Previously "w-full" was always included alongside a caller's width
  // class, and because Tailwind's generated stylesheet happens to place
  // the ".w-full" rule after ".w-auto", it silently won every time —
  // every filter dropdown rendered full-width and stacked instead of
  // sitting side by side.
  const hasWidthOverride = /(^|\s)w-/.test(className);
  const widthClass = hasWidthOverride ? className : `w-full ${className}`;
  const showClear = clearable && !disabled && Boolean(selectedOption);

  return (
    <div className={`relative inline-block ${widthClass}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className={`input flex w-full items-center justify-between gap-2 text-left ${
          disabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "cursor-pointer"
        } ${showClear ? "pr-8" : ""}`}
      >
        <span className={`truncate ${selectedOption ? "text-slate-800" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {!showClear && (
          <ChevronDown
            size={15}
            className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {showClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            onChange?.("");
          }}
          aria-label={`Clear ${ariaLabel || "selection"}`}
          title="Clear"
          className="absolute right-7 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={13} />
        </button>
      )}
      {menu}
    </div>
  );
}