import { CheckCircle2, Layers, Plus, Save, X } from "lucide-react";
import Input from "./Input.jsx";
import Textarea from "./Textarea.jsx";
import Button from "./Button.jsx";
import Badge from "./Badge.jsx";
import Select from "./Select.jsx";
import { isBlank, TEXT_MAX_LENGTH, TEXTAREA_MAX_LENGTH } from "../utils/validation.js";

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
              maxLength={TEXT_MAX_LENGTH}
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
 * Fully editable rendering of the generated BugReportAI, plus a
 * "save to the database" section: pick a project (required) and,
 * optionally, a task to assign the bug to. If the chosen task belongs to
 * a sprint, that sprint is shown and automatically carried over onto the
 * saved bug's `sprint_id` too.
 */
export default function BugReportForm({
  bugReport,
  onChange,
  projects = [],
  tasks = [],
  subtasks = [],
  selectedProjectId = "",
  selectedTaskId = "",
  selectedSubtaskId = "",
  onProjectChange,
  onTaskChange,
  onSubtaskChange,
  onSave,
  saving = false,
  saved = false,
}) {
  if (!bugReport) return null;

  const update = (field, value) => onChange({ ...bugReport, [field]: value });

  const selectedTask = tasks.find((t) => String(t.id) === String(selectedTaskId));
  const titleInvalid = isBlank(bugReport.title) || bugReport.title.trim().length > TEXT_MAX_LENGTH;
  const canSave = Boolean(selectedProjectId) && !saving && !titleInvalid;

  return (
    <div className="card space-y-5 p-5">
      <Input
        label="Title"
        value={bugReport.title}
        maxLength={TEXT_MAX_LENGTH}
        error={isBlank(bugReport.title) ? "Title is required" : undefined}
        onChange={(e) => update("title", e.target.value)}
      />

      <Textarea
        label="Summary"
        value={bugReport.summary}
        maxLength={TEXTAREA_MAX_LENGTH}
        onChange={(e) => update("summary", e.target.value)}
      />

      <Textarea
        label="Description"
        value={bugReport.description}
        maxLength={TEXTAREA_MAX_LENGTH}
        className="min-h-[100px]"
        onChange={(e) => update("description", e.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Severity">
          <Select
            value={bugReport.severity}
            onChange={(v) => update("severity", v)}
            options={SEVERITY_OPTIONS.map((o) => ({ value: o, label: o }))}
            ariaLabel="Severity"
          />
        </Field>
        <Field label="Priority">
          <Select
            value={bugReport.priority}
            onChange={(v) => update("priority", v)}
            options={PRIORITY_OPTIONS.map((o) => ({ value: o, label: o }))}
            ariaLabel="Priority"
          />
        </Field>
        <Input
          label="Environment"
          value={bugReport.environment || ""}
          maxLength={TEXT_MAX_LENGTH}
          onChange={(e) => update("environment", e.target.value)}
        />
        <Input
          label="Module"
          value={bugReport.module || ""}
          maxLength={TEXT_MAX_LENGTH}
          onChange={(e) => update("module", e.target.value)}
        />
        <Input
          label="Bug Type"
          value={bugReport.bug_type || ""}
          maxLength={TEXT_MAX_LENGTH}
          onChange={(e) => update("bug_type", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Textarea
          label="Expected Result"
          value={bugReport.expected_result || ""}
          maxLength={TEXTAREA_MAX_LENGTH}
          onChange={(e) => update("expected_result", e.target.value)}
        />
        <Textarea
          label="Actual Result"
          value={bugReport.actual_result || ""}
          maxLength={TEXTAREA_MAX_LENGTH}
          onChange={(e) => update("actual_result", e.target.value)}
        />
      </div>

      <Textarea
        label="Possible Root Cause"
        value={bugReport.possible_root_cause || ""}
        maxLength={TEXTAREA_MAX_LENGTH}
        onChange={(e) => update("possible_root_cause", e.target.value)}
      />

      <ListEditor
        label="Steps To Reproduce"
        items={bugReport.steps_to_reproduce || []}
        onChange={(v) => update("steps_to_reproduce", v)}
        placeholder="e.g. Click the 'Checkout' button"
      />

      <div className="space-y-4 border-t border-border pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Project">
            <Select
              value={selectedProjectId}
              onChange={(v) => onProjectChange?.(v)}
              placeholder="Select a project..."
              ariaLabel="Project"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>

          <Field label="Assign to task (optional)">
            <Select
              value={selectedTaskId}
              onChange={(v) => onTaskChange?.(v)}
              disabled={!selectedProjectId}
              ariaLabel="Assign to task"
              placeholder={selectedProjectId ? "No task — save unassigned" : "Select a project first"}
              options={tasks.map((t) => ({
                value: t.id,
                label: `${t.title}${t.sprint ? ` (Sprint: ${t.sprint.name})` : ""}`,
              }))}
            />
          </Field>

          <Field label="Assign to subtask (optional)">
            <Select
              value={selectedSubtaskId}
              onChange={(v) => onSubtaskChange?.(v)}
              disabled={!selectedTaskId}
              ariaLabel="Assign to subtask"
              placeholder={
                !selectedTaskId
                  ? "Select a task first"
                  : subtasks.length
                  ? "No subtask — save on the task only"
                  : "This task has no subtasks yet"
              }
              options={subtasks.map((st) => ({ value: st.id, label: st.title }))}
            />
          </Field>
        </div>

        {selectedTask?.sprint && (
          <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-700">
            <Layers size={15} />
            <span>
              This task is in sprint <strong>{selectedTask.sprint.name}</strong>
              {" — "}
              <Badge tone="info">{selectedTask.sprint.status}</Badge>
              {" "}The bug will inherit this sprint automatically.
            </span>
          </div>
        )}
        {selectedTask && !selectedTask.sprint && (
          <p className="text-xs text-slate-400">This task isn&apos;t part of any sprint yet.</p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} /> Saved
            </span>
          )}
          <Button
            variant="primary"
            type="button"
            icon={Save}
            loading={saving}
            disabled={!canSave}
            title={!selectedProjectId ? "Select a project to save this bug" : undefined}
            onClick={() => onSave?.()}
          >
            Save Bug
          </Button>
        </div>
      </div>
    </div>
  );
}