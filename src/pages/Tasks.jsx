import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, MoreVertical, Pencil, Trash2, Calendar } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Avatar from "../components/Avatar.jsx";
import Loader from "../components/Loader.jsx";
import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import { adminService } from "../services/adminService";

// These three are the only statuses the backend model actually supports
// (see Task.status in app/models.py) — keeping the columns in sync with
// that instead of inventing a 4th ("In Review") column a task could never
// actually land in.
const COLUMNS = [
  { key: "To Do", label: "To Do" },
  { key: "In Progress", label: "In Progress" },
  { key: "Done", label: "Done" },
];

const emptyForm = {
  projectId: "",
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
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(""); // "" = all projects

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = creating
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.listTasks({
        projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
      });
      setTasks(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => setProjects(data.items))
      .catch(() => {});
    adminService
      .listUsers({ pageSize: 100 })
      .then((data) => setUsers(data.items))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ ...emptyForm, projectId: selectedProjectId || "" });
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      projectId: String(task.project_id),
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
        });
        toast.success("Task created");
      }
      setFormOpen(false);
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task, status) => {
    try {
      await taskService.updateTask(task.id, { status });
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await taskService.deleteTask(confirmDelete.id);
      toast.success("Task deleted");
      setConfirmDelete(null);
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete task");
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name;

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="A kanban view of everything your team is working on"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New Task
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm text-slate-500">Project:</label>
        <select
          className="input max-w-xs"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading tasks..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="card flex min-h-[320px] flex-col p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {colTasks.length}
                  </span>
                </div>

                {colTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-xs text-slate-400">
                    No tasks here
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-2">
                    {colTasks.map((task) => (
                      <div key={task.id} className="rounded-xl border border-border bg-white p-3">
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800">{task.title}</p>
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
                        {!selectedProjectId && (
                          <p className="mb-1.5 text-xs text-primary-600">
                            {projectName(task.project_id) || `Project #${task.project_id}`}
                          </p>
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
                          {task.assignee && <Avatar name={task.assignee.full_name} size={24} />}
                        </div>
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
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="label">Project</label>
            <select
              className="input"
              value={form.projectId}
              disabled={Boolean(editingTask)}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
            >
              <option value="" disabled>
                Select a project
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {editingTask && (
              <p className="mt-1 text-xs text-slate-400">
                A task&apos;s project can&apos;t be changed after it&apos;s created.
              </p>
            )}
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assignee</label>
            <select
              className="input"
              value={form.assignedTo}
              onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </form>
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
