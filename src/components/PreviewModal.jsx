import { ArrowLeft, Pencil } from "lucide-react";
import Modal from "./Modal.jsx";
import Badge from "./Badge.jsx";
import Button from "./Button.jsx";

/**
 * Generic read-only preview popup.
 *
 * Used wherever a list (Tasks, Subtasks, ...) needs a quick "preview"
 * distinct from "edit" — clicking the preview (eye) icon opens this
 * instead of the full edit form, and a "Back" button in the footer
 * returns to the list. An optional "Edit" button hands off to the same
 * edit flow the row's Edit action already uses.
 *
 * Props:
 * - open, onClose: standard modal control. onClose also backs the "Back" button.
 * - title, subtitle: header text (subtitle is small text above the title, e.g. project/sprint context).
 * - badges: [{ label, tone }] — rendered as a row of Badge pills (status, severity, etc.)
 * - fields: [{ label, value, span2? }] — rendered as a 2-column key/value grid. `value` can be any node.
 * - description: { label, text } — a full-width long-text block (e.g. Description / Acceptance criteria).
 * - sections: [{ label, node }] — additional full-width custom blocks rendered in order after `description`.
 * - onEdit: optional — when supplied, shows an "Edit" button in the footer that closes the preview and calls onEdit.
 * - children: optional — freeform content appended after everything else (e.g. attachment thumbnails).
 */
export default function PreviewModal({
  open,
  onClose,
  title,
  subtitle,
  badges = [],
  fields = [],
  description,
  sections = [],
  onEdit,
  editLabel = "Edit",
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="min-w-0">
          {subtitle && <p className="truncate text-xs font-normal text-slate-400">{subtitle}</p>}
          <span className="truncate">{title}</span>
        </div>
      }
      className="max-w-lg"
      footer={
        <>
          <Button variant="secondary" icon={ArrowLeft} onClick={onClose}>
            Back
          </Button>
          {onEdit && (
            <Button
              icon={Pencil}
              onClick={() => {
                onClose?.();
                onEdit();
              }}
            >
              {editLabel}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <Badge key={i} tone={b.tone}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {fields.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((f, i) => (
              <div key={i} className={f.span2 ? "col-span-2" : undefined}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{f.label}</p>
                <div className="text-sm text-slate-700">{f.value ?? <span className="text-xs text-slate-300">—</span>}</div>
              </div>
            ))}
          </div>
        )}

        {description?.text && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{description.label || "Description"}</p>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{description.text}</p>
          </div>
        )}

        {sections.map((s, i) => (
          <div key={i}>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
            {s.node}
          </div>
        ))}

        {children}
      </div>
    </Modal>
  );
}
