import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ListTree,
  X,
  Check,
  LayoutGrid,
  Table2,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Textarea from "../components/Textarea.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import Avatar from "../components/Avatar.jsx";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import DueDateBadge from "../components/DueDateBadge.jsx";
import TaskTableView from "../components/TaskTableView.jsx";
import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { subtaskService } from "../services/subtaskService";
import { getErrorMessage } from "../utils/apiError.js";
import { useAuth } from "../hooks/useAuth";
import { useProjectFilter } from "../hooks/useProjectFilter";
import { resolveMediaUrl } from "../api/axiosInstance.js";
import { AI_ENTITY_DRAG_MIME, setPendingTestCaseRequest } from "../utils/aiHandoff.js";
import {
  validateRequiredText,
  validateOptionalText,
  validateImageFile,
  TEXT_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from "../utils/validation.js";

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
  acceptanceCriteria: "",
  dueDate: "",
  assignedTo: "",
  status: "To Do",
};

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRoleName = user?.role?.name || (user?.roles?.[0]?.name) || "";
  const canDeleteTask = ["Admin", "Lead", "QA"].includes(userRoleName);
  const canCreateTask = ["Admin", "Lead", "QA"].includes(userRoleName);
  const canAssignTask = ["Admin", "Lead", "QA"].includes(userRoleName);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  // Project-scoped team members for whichever project is selected in the
  // form — a task can only be assigned to someone on that project's team
  // (or Admin/Lead), see app/services/project_access.py on the backend.
  const [formMembers, setFormMembers] = useState([]);
  // Universal project filter (Navbar dropdown) — "" = all projects. Shared
  // across Tasks/Sprints/Bugs/Dashboard/Reports/AI Assistant via context
  // instead of local page state, see context/ProjectFilterContext.jsx.
  const { selectedProjectId } = useProjectFilter();

  // "kanban" (drag-and-drop board) or "table" (Jira-backlog-style list
  // with collapsible subtask rows) — same data and same status-change/
  // edit/delete actions either way, just a different presentation.
  const [viewMode, setViewMode] = useState("kanban");

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
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");

  // Reference screenshots (design mocks / expected-result shots) attached
  // to whichever task is currently being edited — only available once a
  // task exists (needs a task_id to upload against), fed to the AI
  // test-case generator alongside description/acceptance criteria.
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

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
      .catch(() => { });
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
    setAttachments([]);
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      projectId: String(task.project_id),
      sprintId: task.sprint_id ? String(task.sprint_id) : "",
      title: task.title,
      description: task.description || "",
      acceptanceCriteria: task.acceptance_criteria || "",
      dueDate: task.due_date || "",
      assignedTo: task.assignee?.id ? String(task.assignee.id) : "",
      status: task.status,
    });
    setAttachments(task.attachments || []);
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
    const titleError = validateRequiredText(form.title, { label: "Task title", maxLength: TEXT_MAX_LENGTH });
    if (titleError) {
      toast.error(titleError);
      return;
    }
    const descriptionError = validateOptionalText(form.description, {
      label: "Description",
      maxLength: TEXTAREA_MAX_LENGTH,
    });
    if (descriptionError) {
      toast.error(descriptionError);
      return;
    }
    const acceptanceCriteriaError = validateOptionalText(form.acceptanceCriteria, {
      label: "Acceptance criteria",
      maxLength: TEXTAREA_MAX_LENGTH,
    });
    if (acceptanceCriteriaError) {
      toast.error(acceptanceCriteriaError);
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
          acceptanceCriteria: form.acceptanceCriteria.trim() || undefined,
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
          acceptanceCriteria: form.acceptanceCriteria.trim() || undefined,
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

  // --- Reference screenshot attachments (AI test-case grounding) ---------
  const handleAttachmentUpload = async (file) => {
    if (!file || !editingTask) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploadingAttachment(true);
    try {
      const created = await taskService.uploadAttachment(editingTask.id, file);
      setAttachments((prev) => [...prev, created]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload screenshot"));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleAttachmentDelete = async (attachment) => {
    const prev = attachments;
    setAttachments((cur) => cur.filter((a) => a.id !== attachment.id));
    try {
      await taskService.deleteAttachment(attachment.id);
    } catch (err) {
      setAttachments(prev);
      toast.error(getErrorMessage(err, "Failed to delete screenshot"));
    }
  };

  // --- AI test case generation handoff ------------------------------------
  // Drop a task on the Sidebar's "AI Assistant" link, or click this
  // directly — either way it hands the task off (see utils/aiHandoff.js)
  // and jumps to the AI Assistant, which generates the test cases.
  const handleGenerateTestCases = (task) => {
    setPendingTestCaseRequest("task", task.id, task.title);
    navigate("/ai-assistant");
  };

  // Same handoff, for a SubTask — mirrors handleGenerateTestCases above.
  const handleGenerateTestCasesForSubtask = (subtask) => {
    setPendingTestCaseRequest("subtask", subtask.id, subtask.title);
    navigate("/ai-assistant");
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name;

  // --- Drag and drop handlers ---------------------------------------------
  const handleDragStart = (task) => (e) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require data to be set for drag to work at all.
    e.dataTransfer.setData("text/plain", String(task.id));
    // Also carry the AI-handoff payload on the SAME drag gesture — a
    // kanban column drop ignores this custom type, and the Sidebar's
    // "AI Assistant" link ignores the plain-text id, so one drag works
    // for both destinations.
    e.dataTransfer.setData(AI_ENTITY_DRAG_MIME, JSON.stringify({ entityType: "task", entityId: task.id, title: task.title }));
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

  const startEditSubtask = (subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  const commitSubtaskRename = async (subtask) => {
    const trimmed = editingSubtaskTitle.trim();
    setEditingSubtaskId(null);
    if (!trimmed || trimmed === subtask.title) return;
    const prev = subtasks;
    setSubtasks((cur) => cur.map((s) => (s.id === subtask.id ? { ...s, title: trimmed } : s)));
    try {
      await subtaskService.updateSubtask(subtask.id, { title: trimmed });
    } catch (err) {
      setSubtasks(prev);
      toast.error(getErrorMessage(err, "Failed to rename subtask"));
    }
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="A kanban view of everything your team is working on — drag a card to change its status"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={() => navigate("/test-cases-library")}
            >
              AI Test Cases
            </Button>
            <Button icon={Plus} onClick={openCreate}>
              New Task
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        {/* Project filter now lives in the Navbar (universal, applies
            across Tasks/Sprints/Bugs/Dashboard/Reports/AI Assistant) —
            see components/Navbar.jsx. */}

        {/* View toggle — kanban (drag-and-drop) vs table (collapsible list) */}
        <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            aria-pressed={viewMode === "kanban"}
            title="Board view"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "kanban" ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50"
              }`}
          >
            <LayoutGrid size={14} /> Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            title="Table view"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "table" ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50"
              }`}
          >
            <Table2 size={14} /> Table
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading tasks..." />
        </div>
      ) : viewMode === "table" ? (
        <TaskTableView
          tasks={tasks}
          projects={projects}
          showProjectColumn={!selectedProjectId}
          onEdit={openEdit}
          onPreview={(task) => navigate(`/tasks/${task.id}/preview`)}
          onDelete={setConfirmDelete}
          onChangeStatus={changeStatus}
          onGenerateTestCases={handleGenerateTestCases}
          onPreviewSubtask={(subtask) => navigate(`/subtasks/${subtask.id}/preview`)}
          onGenerateTestCasesForSubtask={handleGenerateTestCasesForSubtask}
        />
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
                className={`card flex min-h-[320px] flex-col p-4 transition-colors ${isDragOver ? "ring-2 ring-primary-400 bg-primary-50/40" : ""
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
                        className={`cursor-grab rounded-xl border border-border bg-white p-3 active:cursor-grabbing ${draggedTaskId === task.id ? "opacity-40" : ""
                          }`}
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <a
                            className="
                              cursor-pointer
                              text-sm font-medium
                              text-slate-800
                              transition-colors
                              hover:text-primary-600
                            "
                            onClick={() =>
                              navigate(`/tasks/${task.id}/preview`)
                            }
                          >
                            {task.custom_id && (
                              <span className="mr-1 inline-block rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 align-middle">
                                {task.custom_id}
                              </span>
                            )}

                            {task.title}
                          </a>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {/* <button
                              type="button"
                              title="Preview"
                              onClick={() => navigate(`/tasks/${task.id}/preview`)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                            >
                              <Eye size={14} />
                            </button> */}
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
                              showChevron={false}
                              items={[
                                { label: "Preview", icon: Eye, onClick: () => navigate(`/tasks/${task.id}/preview`) },
                                { label: "Edit", icon: Pencil, onClick: () => openEdit(task) },
                                { label: "Generate test cases", icon: Sparkles, onClick: () => handleGenerateTestCases(task) },
                                ...COLUMNS.filter((c) => c.key !== task.status).map((c) => ({
                                  label: `Move to ${c.label}`,
                                  onClick: () => changeStatus(task, c.key),
                                })),
                                ...(canDeleteTask ? [{
                                  label: "Delete",
                                  icon: Trash2,
                                  onClick: () => setConfirmDelete(task),
                                }] : []),
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
                            <DueDateBadge date={task.due_date} doneLike={task.status === "Done"} />
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
            maxLength={TEXT_MAX_LENGTH}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Implement login form"
          />
          <Textarea
            label="Description"
            value={form.description}
            maxLength={TEXTAREA_MAX_LENGTH}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div>
            <Textarea
              label="Acceptance criteria"
              value={form.acceptanceCriteria}
              maxLength={TEXTAREA_MAX_LENGTH}
              onChange={(e) => setForm((f) => ({ ...f, acceptanceCriteria: e.target.value }))}
              placeholder={"e.g.\n- User sees a validation error for an invalid email\n- Password field masks input by default"}
            />
            <p className="mt-1 text-xs text-slate-400">
              What must be true for this to be considered done — the AI test-case generator uses this to make
              sure every condition gets its own test case.
            </p>
          </div>
          <div>
            <label className="label">Reference screenshots (optional)</label>
            {editingTask ? (
              <>
                {attachments.length > 0 && (
                  <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {attachments.map((att) => (
                      <div key={att.id} className="group relative overflow-hidden rounded-lg border border-border">
                        <img src={resolveMediaUrl(att.image_url)} alt="" className="h-16 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleAttachmentDelete(att)}
                          className="absolute right-1 top-1 rounded-lg bg-slate-900/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Remove screenshot"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-canvas px-4 py-3 text-center text-xs text-slate-500 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
                  {uploadingAttachment ? (
                    <Loader label="Uploading..." size={14} />
                  ) : (
                    <>
                      <UploadCloud size={16} className="text-primary-500" /> Add a design mock or expected-result
                      screenshot
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={uploadingAttachment}
                    onChange={(e) => handleAttachmentUpload(e.target.files?.[0])}
                  />
                </label>
                <p className="mt-1 text-xs text-slate-400">
                  Fed to the AI test-case generator alongside the description and acceptance criteria.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Save the task first, then you can attach reference screenshots.</p>
            )}
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
                maxLength={TEXT_MAX_LENGTH}
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
                  <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <button
                      type="button"
                      onClick={() => toggleSubtaskDone(st)}
                      className="flex-shrink-0"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${st.status === "Done"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300"
                          }`}
                      >
                        {st.status === "Done" && <Check size={12} />}
                      </span>
                    </button>
                    <span className="min-w-0 flex-1">
                      {editingSubtaskId === st.id ? (
                        <input
                          autoFocus
                          maxLength={TEXT_MAX_LENGTH}
                          className="w-full rounded border border-primary-300 px-1.5 py-0.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-400"
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onBlur={() => commitSubtaskRename(st)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitSubtaskRename(st);
                            if (e.key === "Escape") setEditingSubtaskId(null);
                          }}
                        />
                      ) : (
                        <span
                          className={`block cursor-pointer truncate text-sm transition-colors ${st.status === "Done"
                            ? "text-slate-400 line-through hover:text-primary-400"
                            : "text-slate-700 hover:text-primary-600"
                            }`}
                          title="Click to preview • Double-click to rename"
                          onClick={() =>
                            navigate(`/subtasks/${st.id}/preview`)
                          }
                          onDoubleClick={() => startEditSubtask(st)}
                        >
                          {st.title}
                        </span>
                      )}
                      {(st.assignee || st.reporter) && (
                        <span className="block text-[11px] text-slate-400">
                          {st.assignee ? `Assigned: ${st.assignee.full_name}` : "Unassigned"}
                          {st.reporter ? ` · Reported by ${st.reporter.full_name}` : ""}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">

                    <button
                      type="button"
                      onClick={() => handleGenerateTestCasesForSubtask(st)}
                      className="rounded p-1 text-slate-400 hover:text-primary-600"
                      title="Generate test cases"
                    >
                      <Sparkles size={14} />
                    </button>
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
