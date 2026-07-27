import { Lock, Plus, X } from "lucide-react";
import Input from "./Input.jsx";
import Button from "./Button.jsx";

const SEVERITY_OPTIONS = ["Critical", "High", "Medium", "Low"];
const PRIORITY_OPTIONS = ["P0", "P1", "P2", "P3"];

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ListEditor({ label, items, onChange, placeholder }) {
  const updateItem = (i, value) => {
    const next = [...items];
    next[i] = value;
    onChange(next);
  };
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const addItem = () => onChange([...items, ""]);

  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input"
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateItem(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          <Plus size={14} /> Add {label.toLowerCase().replace(/s$/, "")}
        </button>
      </div>
    </div>
  );
}

/**
 * Fully editable rendering of the generated BugReportAI. All edits are
 * local component state managed by the parent page — no autosave, no
 * persistence. The Save button is intentionally disabled: Phase 2 does
 * not write generated bugs to the database.
 */
export default function BugReportForm({ bugReport, onChange }) {
  if (!bugReport) return null;

  const update = (field, value) => onChange({ ...bugReport, [field]: value });

  return (
    <div className="card space-y-5 p-5">
      <Input label="Title" value={bugReport.title} onChange={(e) => update("title", e.target.value)} />

      <Field label="Summary">
        <textarea className="input min-h-[60px]" value={bugReport.summary} onChange={(e) => update("summary", e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea className="input min-h-[100px]" value={bugReport.description} onChange={(e) => update("description", e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Severity">
          <select className="input" value={bugReport.severity} onChange={(e) => update("severity", e.target.value)}>
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className="input" value={bugReport.priority} onChange={(e) => update("priority", e.target.value)}>
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Input label="Environment" value={bugReport.environment || ""} onChange={(e) => update("environment", e.target.value)} />
        <Input label="Module" value={bugReport.module || ""} onChange={(e) => update("module", e.target.value)} />
        <Input label="Bug Type" value={bugReport.bug_type || ""} onChange={(e) => update("bug_type", e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Expected Result">
          <textarea className="input min-h-[70px]" value={bugReport.expected_result || ""} onChange={(e) => update("expected_result", e.target.value)} />
        </Field>
        <Field label="Actual Result">
          <textarea className="input min-h-[70px]" value={bugReport.actual_result || ""} onChange={(e) => update("actual_result", e.target.value)} />
        </Field>
      </div>

      <Field label="Possible Root Cause">
        <textarea className="input min-h-[70px]" value={bugReport.possible_root_cause || ""} onChange={(e) => update("possible_root_cause", e.target.value)} />
      </Field>

      <ListEditor
        label="Steps To Reproduce"
        items={bugReport.steps_to_reproduce || []}
        onChange={(v) => update("steps_to_reproduce", v)}
        placeholder="e.g. Click the 'Checkout' button"
      />

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" type="button" icon={Lock} disabled title="Saving is disabled in this phase">
          Save Bug
        </Button>
      </div>
    </div>
  );
}