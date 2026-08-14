import { useState } from "react";
import toast from "react-hot-toast";
import { MoreVertical, Pencil, Trash2, Plus, X, Sparkles, Eye } from "lucide-react";
import CollapsibleTable from "./CollapsibleTable.jsx";
import DueDateBadge from "./DueDateBadge.jsx";
import Select from "./Select.jsx";
import Input from "./Input.jsx";
import Button from "./Button.jsx";
import Avatar from "./Avatar.jsx";
import Badge from "./Badge.jsx";
import Dropdown from "./Dropdown.jsx";
import Loader from "./Loader.jsx";
import { subtaskService } from "../services/subtaskService";
import { getErrorMessage } from "../utils/apiError.js";

// Same three statuses the Task/SubTask models actually support — kept in
// sync with the kanban view's COLUMNS in Tasks.jsx.
const STATUS_OPTIONS = [
  { value: "To Do", label: "To Do" },
  { value: "In Progress", label: "In Progress" },
  { value: "Done", label: "Done" },
];

/**
 * Table ("list") view of Tasks — the alternative to the drag-and-drop
 * kanban board, toggled from Tasks.jsx. Same underlying data and the same
 * status-change/edit/delete actions as the kanban view, just presented as
 * rows instead of cards, Jira-backlog style.
 *
 * Expanding a row lazily loads that task's subtasks and lets you flip a
 * subtask's status right there, without opening the separate Subtasks
 * modal.
 */
export default function TaskTableView({
  tasks,
  projects,
  showProjectColumn,
  onEdit,
  onPreview,
  onDelete,
  onChangeStatus,
  onGenerateTestCases,
}) {
  const [subtasksByTask, setSubtasksByTask] = useState({});
  const [loadingTaskId, setLoadingTaskId] = useState(null);
  const [newTitleByTask, setNewTitleByTask] = useState({});
  const [addingTaskId, setAddingTaskId] = useState(null);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || `#${id}`;

  const loadSubtasks = async (task) => {
    if (subtasksByTask[task.id]) return; // already fetched — Collapse just re-shows it
    setLoadingTaskId(task.id);
    try {
      const data = await subtaskService.listSubtasks({ taskId: task.id });
      setSubtasksByTask((prev) => ({ ...prev, [task.id]: data }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load subtasks"));
    } finally {
      setLoadingTaskId(null);
    }
  };

  const changeSubtaskStatus = async (task, subtask, status) => {
    if (status === subtask.status) return;
    const prev = subtasksByTask[task.id];
    setSubtasksByTask((cur) => ({
      ...cur,
      [task.id]: cur[task.id].map((s) => (s.id === subtask.id ? { ...s, status } : s)),
    }));
    try {
      await subtaskService.updateSubtask(subtask.id, { status });
    } catch (err) {
      setSubtasksByTask((cur) => ({ ...cur, [task.id]: prev }));
      toast.error(getErrorMessage(err, "Failed to update subtask"));
    }
  };

  const deleteSubtask = async (task, subtask) => {
    const prev = subtasksByTask[task.id];
    setSubtasksByTask((cur) => ({ ...cur, [task.id]: cur[task.id].filter((s) => s.id !== subtask.id) }));
    try {
      await subtaskService.deleteSubtask(subtask.id);
    } catch (err) {
      setSubtasksByTask((cur) => ({ ...cur, [task.id]: prev }));
      toast.error(getErrorMessage(err, "Failed to delete subtask"));
    }
  };

  const addSubtask = async (task) => {
    const title = (newTitleByTask[task.id] || "").trim();
    if (!title) return;
    setAddingTaskId(task.id);
    try {
      const created = await subtaskService.createSubtask({ taskId: task.id, title });
      setSubtasksByTask((cur) => ({ ...cur, [task.id]: [created, ...(cur[task.id] || [])] }));
      setNewTitleByTask((cur) => ({ ...cur, [task.id]: "" }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add subtask"));
    } finally {
      setAddingTaskId(null);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Task",
      render: (task) => (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800">{task.title}</p>
            {showProjectColumn && (
              <p className="mt-0.5 text-xs text-primary-600">{projectName(task.project_id)}</p>
            )}
          </div>
          {onPreview && (
            <button
              type="button"
              onClick={() => onPreview(task)}
              title="Preview"
              className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-primary-600"
            >
              <Eye size={15} />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "sprint",
      header: "Sprint",
      width: 160,
      render: (task) =>
        task.sprint ? (
          <Badge tone="info">{task.sprint.name}</Badge>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: 160,
      render: (task) => (
        <Select
          value={task.status}
          onChange={(v) => onChangeStatus(task, v)}
          ariaLabel={`Status for ${task.title}`}
          options={STATUS_OPTIONS}
          className="w-auto min-w-[9rem]"
        />
      ),
    },
    {
      key: "due_date",
      header: "Due",
      width: 130,
      render: (task) => <DueDateBadge date={task.due_date} doneLike={task.status === "Done"} />,
    },
    {
      key: "assignee",
      header: "Assignee",
      width: 140,
      render: (task) =>
        task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar name={task.assignee.full_name} size={22} />
            <span className="text-sm text-slate-600">{task.assignee.full_name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">Unassigned</span>
        ),
    },
    {
      key: "actions",
      header: "",
      width: 56,
      render: (task) => (
        <Dropdown
          label={<MoreVertical size={16} />}
          items={[
            ...(onPreview ? [{ label: "Preview", icon: Eye, onClick: () => onPreview(task) }] : []),
            { label: "Edit", icon: Pencil, onClick: () => onEdit(task) },
            { label: "Generate test cases", icon: Sparkles, onClick: () => onGenerateTestCases?.(task) },
            { label: "Delete", icon: Trash2, onClick: () => onDelete(task) },
          ]}
        />
      ),
    },
  ];

  const renderExpanded = (task) => {
    if (loadingTaskId === task.id) {
      return (
        <div className="flex items-center justify-center py-3">
          <Loader label="Loading subtasks..." />
        </div>
      );
    }
    const subs = subtasksByTask[task.id];
    if (!subs) return null; // hasn't finished the first fetch triggered by onExpand yet

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newTitleByTask[task.id] || ""}
            onChange={(e) => setNewTitleByTask((cur) => ({ ...cur, [task.id]: e.target.value }))}
            placeholder="Add a subtask..."
            className="flex-1"
          />
          <Button
            type="button"
            icon={Plus}
            loading={addingTaskId === task.id}
            onClick={() => addSubtask(task)}
          >
            Add
          </Button>
        </div>

        {subs.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-400">No subtasks yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {subs.map((st) => (
              <li
                key={st.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      st.status === "Done" ? "text-slate-400 line-through" : "text-slate-700"
                    }`}
                  >
                    {st.title}
                  </p>
                  {st.assignee && <p className="text-[11px] text-slate-400">{st.assignee.full_name}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Select
                    value={st.status}
                    onChange={(v) => changeSubtaskStatus(task, st, v)}
                    ariaLabel={`Status for ${st.title}`}
                    options={STATUS_OPTIONS}
                    className="w-auto min-w-[8.5rem]"
                  />
                  <button
                    type="button"
                    onClick={() => deleteSubtask(task, st)}
                    className="rounded p-1 text-slate-400 hover:text-red-600"
                    title="Delete subtask"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <CollapsibleTable
      columns={columns}
      data={tasks}
      renderExpanded={renderExpanded}
      onExpand={loadSubtasks}
      emptyMessage="No tasks match these filters."
      rowSx={(task) =>
        task.due_date && task.status !== "Done" && new Date(`${task.due_date}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0))
          ? { backgroundColor: "rgba(254, 242, 242, 0.5)" }
          : undefined
      }
    />
  );
}
