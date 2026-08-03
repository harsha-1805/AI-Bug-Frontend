import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, MoreVertical, Pencil, Trash2, Calendar, ListTree, X, Check } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import Avatar from "../components/Avatar.jsx";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { subtaskService } from "../services/subtaskService";
import { getErrorMessage } from "../utils/apiError.js";

// These three are the only statuses the backend model actually supports
// (see Task.status in app/models.py) — keeping the columns in sync with
// that instead of inventing a 4th ("In Review") column a task could never
// actually land in.
const COLUMNS = [
  { key: "To Do", label: "To Do" },
  { key: "In Progress", label: "In Progress" },
  { key: "Done", label: "Done" },
];

// Today's date as YYYY-MM-DD, used as the HTML date input's `min` so the
// browser itself blocks picking a past due date — the backend
// (TaskCreate/TaskUpdate due_date validators) is still the real
// enforcement, this is just faster UX feedback.
const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  projectId: "",
  sprintId: "",
  title: "",
  description: "",
  dueDate: "",
  assignedTo: "",
  status: "To Do",
};

export default function Tasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  // Project-scoped team members for whichever project is selected in the
  // form — a task can only be assigned to someone on that project's team
  // (or Admin/Lead), see app/services/project_access.py on the backend.
  const [formMembers, setFormMembers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(""); // "" = all projects

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = creating
  const [form, setForm] = useState(emptyForm);
  const [formSprints, setFormSprints] = useState([]); // sprints for whichever project is selected in the form
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Drag-and-drop: which task is currently being dragged, and which
  // column is currently being hovered over (for a highlight affordance).
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Subtasks modal (Project -> Sprint -> Task -> SubTask hierarchy)
  const [subtaskTask, setSubtaskTask] = useState(null); // task the subtasks modal is open for
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState("");
  const [subtaskMembers, setSubtaskMembers] = useState([]); // subtaskTask's project team, for the assignee dropdown
  const [addingSubtask, setAddingSubtask] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.listTasks({
        projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
      });
      setTasks(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load tasks"));
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    // Already team-scoped server-side (see GET /api/v1/projects ->
    // project_access.accessible_project_ids), so every dropdown fed from
    // `projects` automatically only shows projects this user can use.
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => setProjects(data.items))
      .catch(() => {});
  }, []);

  // Whenever the form's selected project changes, refresh which sprints
  // AND which team members are offered — a task's sprint has to belong
  // to the same project, and its assignee has to be a member of that
  // project's team (or Admin/Lead).
  useEffect(() => {
    if (!form.projectId) {
      setFormSprints([]);
      setFormMembers([]);
      return;
    }
    sprintService
      .listSprints({ projectId: Number(form.projectId) })
      .then(setFormSprints)
      .catch(() => setFormSprints([]));
    projectService
      .listProjectMembers(Number(form.projectId))
      .then(setFormMembers)
      .catch(() => setFormMembers([]));
  }, [form.projectId]);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ ...emptyForm, projectId: selectedProjectId || "" });
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      projectId: String(task.project_id),
      sprintId: task.sprint_id ? String(task.sprint_id) : "",
      title: task.title,
      description: task.description || "",
      dueDate: task.due_date || "",
      assignedTo: task.assignee?.id ? String(task.assignee.id) : "",
      status: task.status,
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingTask && !form.projectId) {
      toast.error("Every task needs to belong to a project — pick one");
      return;
    }
    // Sprint is mandatory (Project -> Sprint -> Task -> SubTask). This
    // mirrors the backend's TaskCreate.sprint_id now being a required
    // field, not Optional — see app/schemas/project_schema.py.
    if (!form.sprintId) {
      toast.error("Every task needs a sprint — pick one before saving");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSaving(true);
    try {
      if (editingTask) {
        // Note: which project a task belongs to can't be changed after
        // creation via this form — the backend's TaskUpdate schema
        // intentionally doesn't accept project_id (a task's project is
        // fixed at creation time, same as Jira/Linear).
        await taskService.updateTask(editingTask.id, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
          dueDate: form.dueDate || undefined,
          assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
          sprintId: form.sprintId ? Number(form.sprintId) : undefined,
        });
        toast.success("Task updated");
      } else {
        await taskService.createTask({
          projectId: Number(form.projectId),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
          dueDate: form.dueDate || undefined,
          assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
          sprintId: Number(form.sprintId),
        });
        toast.success("Task created");
      }
      setFormOpen(false);
      loadTasks();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save task"));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task, status) => {
    if (status === task.status) return;
    const prevTasks = tasks;
    // Optimistic update so drag-and-drop feels instant; rolled back on error.
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await taskService.updateTask(task.id, { status });
    } catch (err) {
      setTasks(prevTasks);
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const handleDelete = async () => {
    try {
      await taskService.deleteTask(confirmDelete.id);
      toast.success("Task deleted");
      setConfirmDelete(null);
      loadTasks();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete task"));
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name;

  // --- Drag and drop handlers ---------------------------------------------
  const handleDragStart = (task) => (e) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require data to be set for drag to work at all.
    e.dataTransfer.setData("text/plain", String(task.id));
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (columnKey) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  };

  const handleColumnDrop = (columnKey) => (e) => {
    e.preventDefault();
    setDragOverColumn(null);
    const task = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);
    if (task && task.status !== columnKey) {
      changeStatus(task, columnKey);
    }
  };

  // --- Subtasks ------------------------------------------------------------
  const openSubtasks = async (task) => {
    setSubtaskTask(task);
    setSubtasksLoading(true);
    setNewSubtaskTitle("");
    setNewSubtaskAssignee("");
    try {
      const data = await subtaskService.listSubtasks({ taskId: task.id });
      setSubtasks(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load subtasks"));
    } finally {
      setSubtasksLoading(false);
    }
    // A subtask can only be assigned to someone on the PARENT TASK's
    // project team (or Admin/Lead) — a subtask always inherits the
    // task's project, see app/services/subtask_service.py.
    projectService
      .listProjectMembers(task.project_id)
      .then(setSubtaskMembers)
      .catch(() => setSubtaskMembers([]));
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setAddingSubtask(true);
    try {
      const created = await subtaskService.createSubtask({
        taskId: subtaskTask.id,
        title: newSubtaskTitle.trim(),
        assignedTo: newSubtaskAssignee ? Number(newSubtaskAssignee) : undefined,
      });
      setSubtasks((prev) => [created, ...prev]);
      setNewSubtaskTitle("");
      setNewSubtaskAssignee("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add subtask"));
    } finally {
      setAddingSubtask(false);
    }
  };

  const toggleSubtaskDone = async (subtask) => {
    const nextStatus = subtask.status === "Done" ? "To Do" : "Done";
    setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, status: nextStatus } : s)));
    try {
      await subtaskService.updateSubtask(subtask.id, { status: nextStatus });
    } catch (err) {
      setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, status: subtask.status } : s)));
      toast.error(getErrorMessage(err, "Failed to update subtask"));
    }
  };

  const deleteSubtask = async (subtask) => {
    const prev = subtasks;
    setSubtasks((cur) => cur.filter((s) => s.id !== subtask.id));
    try {
      await subtaskService.deleteSubtask(subtask.id);
    } catch (err) {
      setSubtasks(prev);
      toast.error(getErrorMessage(err, "Failed to delete subtask"));
    }
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="A kanban view of everything your team is working on — drag a card to change its status"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New Task
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm text-slate-500">Project:</label>
        <Select
          className="max-w-xs"
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          placeholder="All projects"
          ariaLabel="Filter by project"
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading tasks..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            const isDragOver = dragOverColumn === col.key;
            return (
              <div
                key={col.key}
                onDragOver={handleColumnDragOver(col.key)}
                onDragLeave={() => setDragOverColumn((c) => (c === col.key ? null : c))}
                onDrop={handleColumnDrop(col.key)}
                className={`card flex min-h-[320px] flex-col p-4 transition-colors ${
                  isDragOver ? "ring-2 ring-primary-400 bg-primary-50/40" : ""
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {colTasks.length}
                  </span>
                </div>

                {colTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-xs text-slate-400">
                    {isDragOver ? "Drop here" : "No tasks here"}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-2">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-grab rounded-xl border border-border bg-white p-3 active:cursor-grabbing ${
                          draggedTaskId === task.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800">{task.title}</p>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              title="Subtasks"
                              onClick={() => openSubtasks(task)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                            >
                              <ListTree size={14} />
                            </button>
                            <Dropdown
                              label={<MoreVertical size={14} />}
                              items={[
                                { label: "Edit", icon: Pencil, onClick: () => openEdit(task) },
                                ...COLUMNS.filter((c) => c.key !== task.status).map((c) => ({
                                  label: `Move to ${c.label}`,
                                  onClick: () => changeStatus(task, c.key),
                                })),
                                {
                                  label: "Delete",
                                  icon: Trash2,
                                  onClick: () => setConfirmDelete(task),
                                },
                              ]}
                            />
                          </div>
                        </div>
                        {!selectedProjectId && (
                          <p className="mb-1.5 text-xs text-primary-600">
                            {projectName(task.project_id) || `Project #${task.project_id}`}
                          </p>
                        )}
                        {task.sprint && (
                          <span className="mb-1.5 inline-block rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {task.sprint.name}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          {task.due_date ? (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar size={12} />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openSubtasks(task)}
                              className="text-xs text-slate-400 hover:text-primary-600"
                            >
                              <ListTree size={12} className="mr-0.5 inline" />
                              Subtasks
                            </button>
                            {task.assignee && (
                              <Avatar name={task.assignee.full_name} size={24} />
                            )}
                          </div>
                        </div>
                        {task.reporter && (
                          <p className="mt-1.5 text-[11px] text-slate-400">
                            Reported by {task.reporter.full_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingTask ? "Edit task" : "New task"}
        className="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editingTask ? "Save changes" : "Create task"}
            </Button>
          </>
        }
      >
        <form className="space-y-4 sm:space-y-5" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
            <label className="label">Project</label>
            <Select
              value={form.projectId}
              disabled={Boolean(editingTask)}
              onChange={(v) => setForm((f) => ({ ...f, projectId: v, sprintId: "", assignedTo: "" }))}
              placeholder="Select a project"
              ariaLabel="Project"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
            {editingTask && (
              <p className="mt-1 text-xs text-slate-400">
                A task&apos;s project can&apos;t be changed after it&apos;s created.
              </p>
            )}
            </div>
            <div>
            <label className="label">
              Sprint <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.sprintId}
              disabled={!form.projectId}
              onChange={(v) => setForm((f) => ({ ...f, sprintId: v }))}
              placeholder={form.projectId ? "Select a sprint" : "Select a project first"}
              ariaLabel="Sprint"
              options={formSprints.map((s) => ({ value: s.id, label: `${s.name} (${s.status})` }))}
            />
            <p className="mt-1 text-xs text-slate-400">
              Required — every task must belong to a sprint (Project → Sprint → Task).
            </p>
            </div>
          </div>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Implement login form"
          />
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[70px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Due date"
              type="date"
              min={todayStr()}
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <div>
              <label className="label">Status</label>
              <Select
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                ariaLabel="Status"
                options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Assignee</label>
            <Select
              value={form.assignedTo}
              disabled={!form.projectId}
              onChange={(v) => setForm((f) => ({ ...f, assignedTo: v }))}
              placeholder={form.projectId ? "Unassigned" : "Select a project first"}
              ariaLabel="Assignee"
              options={formMembers.map((m) => ({ value: m.user_id, label: m.full_name }))}
            />
            <p className="mt-1 text-xs text-slate-400">
              Only this project's team members can be assigned.
            </p>
          </div>
          {editingTask?.reporter && (
            <div>
              <label className="label">Reported by</label>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Avatar name={editingTask.reporter.full_name} size={20} />
                <span className="text-sm text-slate-600">{editingTask.reporter.full_name}</span>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Subtasks modal — Project -> Sprint -> Task -> SubTask */}
      <Modal
        open={Boolean(subtaskTask)}
        onClose={() => setSubtaskTask(null)}
        title={`Subtasks — ${subtaskTask?.title || ""}`}
        footer={
          <Button variant="secondary" onClick={() => setSubtaskTask(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <form className="space-y-2" onSubmit={handleAddSubtask}>
            <div className="flex gap-2">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1"
              />
              <Button type="submit" loading={addingSubtask} icon={Plus}>
                Add
              </Button>
            </div>
            <Select
              value={newSubtaskAssignee}
              onChange={setNewSubtaskAssignee}
              placeholder="Unassigned"
              ariaLabel="Subtask assignee"
              className="w-auto min-w-[10rem]"
              options={subtaskMembers.map((m) => ({ value: m.user_id, label: m.full_name }))}
            />
          </form>

          {subtasksLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader label="Loading subtasks..." />
            </div>
          ) : subtasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No subtasks yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {subtasks.map((st) => (
                <li
                  key={st.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleSubtaskDone(st)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        st.status === "Done"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {st.status === "Done" && <Check size={12} />}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-sm ${
                          st.status === "Done" ? "text-slate-400 line-through" : "text-slate-700"
                        }`}
                      >
                        {st.title}
                      </span>
                      {(st.assignee || st.reporter) && (
                        <span className="block text-[11px] text-slate-400">
                          {st.assignee ? `Assigned: ${st.assignee.full_name}` : "Unassigned"}
                          {st.reporter ? ` · Reported by ${st.reporter.full_name}` : ""}
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge tone={st.status === "Done" ? "success" : "neutral"}>{st.status}</Badge>
                    <button
                      type="button"
                      onClick={() => deleteSubtask(st)}
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
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{confirmDelete?.title}</strong>? This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}
