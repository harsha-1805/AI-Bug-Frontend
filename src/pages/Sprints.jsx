import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Rocket, MoreVertical, Pencil, Trash2, ListTree } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import CollapsibleTable from "../components/CollapsibleTable.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import Avatar from "../components/Avatar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import DueDateBadge from "../components/DueDateBadge.jsx";
import { sprintService } from "../services/sprintService";
import { projectService } from "../services/projectService";
import { taskService } from "../services/taskService";
import { getErrorMessage } from "../utils/apiError.js";

const TASK_STATUS_TONE = { "To Do": "neutral", "In Progress": "medium", Done: "success" };

const STATUS_TONE = { Planned: "neutral", Active: "info", Completed: "success" };

const emptyForm = { name: "", startDate: "", endDate: "", status: "Planned", projectId: "" };

// Today's date as YYYY-MM-DD — used as the HTML date input's `min` so a
// past start/end date can't even be picked in the browser. The backend
// (SprintCreate/SprintUpdate validators) is still the real enforcement.
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Sprints() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    // Project list is already team-scoped server-side, and leaving
    // selectedProjectId as "" (All projects) here — rather than
    // auto-picking the first project — is what makes "All projects" the
    // default landing view, same as Tasks/Bugs.
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => setProjects(data.items))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // project_id is optional server-side (GET /api/v1/sprints already
      // defaults to every project this user can access), so "" here just
      // means "don't filter" instead of an early-return empty state.
      const data = await sprintService.listSprints({
        projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
      });
      setSprints(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load sprints"));
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingSprint(null);
    setForm({ ...emptyForm, projectId: selectedProjectId || "" });
    setFormOpen(true);
  };

  const openEdit = (sprint) => {
    setEditingSprint(sprint);
    setForm({
      name: sprint.name,
      startDate: sprint.start_date || "",
      endDate: sprint.end_date || "",
      status: sprint.status,
      projectId: String(sprint.project_id || ""),
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.projectId && !editingSprint) {
      toast.error("Select a project first");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Sprint name is required");
      return;
    }
    if (form.startDate && form.startDate < todayStr()) {
      toast.error("Start date can't be in the past");
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error("End date can't be before the start date");
      return;
    }
    setSaving(true);
    try {
      if (editingSprint) {
        await sprintService.updateSprint(editingSprint.id, {
          name: form.name.trim(),
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          status: form.status,
        });
        toast.success("Sprint updated");
      } else {
        await sprintService.createSprint({
          projectId: Number(form.projectId),
          name: form.name.trim(),
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          status: form.status,
        });
        toast.success("Sprint created");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save sprint"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await sprintService.deleteSprint(confirmDelete.id);
      toast.success("Sprint deleted");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete sprint"));
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name || `#${id}`;

  // Tasks-in-this-sprint, lazily loaded the first time a sprint row is
  // expanded (Task.status doesn't include a per-sprint task list, so this
  // is fetched via GET /api/v1/tasks?sprint_id=... on demand rather than
  // up front for every sprint).
  const [tasksBySprint, setTasksBySprint] = useState({});
  const [loadingSprintId, setLoadingSprintId] = useState(null);

  const loadSprintTasks = async (sprint) => {
    if (tasksBySprint[sprint.id]) return;
    setLoadingSprintId(sprint.id);
    try {
      const data = await taskService.listTasks({ sprintId: sprint.id });
      setTasksBySprint((prev) => ({ ...prev, [sprint.id]: data }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load sprint tasks"));
    } finally {
      setLoadingSprintId(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Sprint",
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.name}</span>
          {!selectedProjectId && <p className="mt-0.5 text-xs text-primary-600">{projectName(row.project_id)}</p>}
        </div>
      ),
    },
    {
      key: "start_date",
      header: "Start",
      render: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : "—"),
    },
    {
      key: "end_date",
      header: "End",
      render: (row) =>
        row.end_date ? (
          <DueDateBadge date={row.end_date} doneLike={row.status === "Completed"} />
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={STATUS_TONE[row.status] || "neutral"}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Dropdown
          label={<MoreVertical size={16} />}
          items={[
            { label: "Edit sprint", icon: Pencil, onClick: () => openEdit(row) },
            { label: "Delete sprint", icon: Trash2, onClick: () => setConfirmDelete(row) },
          ]}
        />
      ),
    },
  ];

  const renderSprintTasks = (sprint) => {
    if (loadingSprintId === sprint.id) {
      return (
        <div className="flex items-center justify-center py-3">
          <Loader label="Loading tasks..." />
        </div>
      );
    }
    const tasks = tasksBySprint[sprint.id];
    if (!tasks) return null;
    if (tasks.length === 0) {
      return <p className="py-2 text-center text-xs text-slate-400">No tasks in this sprint yet.</p>;
    }
    return (
      <ul className="space-y-1.5">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <ListTree size={14} className="shrink-0 text-slate-400" />
              <span className="truncate text-sm text-slate-700">{t.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {t.due_date && <DueDateBadge date={t.due_date} doneLike={t.status === "Done"} />}
              <Badge tone={TASK_STATUS_TONE[t.status] || "neutral"}>{t.status}</Badge>
              {t.assignee && <Avatar name={t.assignee.full_name} size={20} />}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <PageHeader
        title="Sprints"
        subtitle="Plan, run, and review sprint cycles"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New Sprint
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
          ariaLabel="Project"
          options={[{ value: "", label: "All projects" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
        />

      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No projects yet"
          description="Create a project first — sprints are scoped to a single project."
        />
      ) : loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading sprints..." />
        </div>
      ) : sprints.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No sprints yet"
          description="Create your first sprint to start scoping bugs and tasks by time-box."
          action={
            <Button icon={Plus} onClick={openCreate}>
              New Sprint
            </Button>
          }
        />
      ) : (
        <CollapsibleTable
          columns={columns}
          data={sprints}
          renderExpanded={renderSprintTasks}
          onExpand={loadSprintTasks}
          emptyMessage="No sprints match these filters."
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingSprint ? "Edit sprint" : "New sprint"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editingSprint ? "Save changes" : "Create sprint"}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          {!editingSprint && (
            <div>
              <label className="label">Project</label>
              <Select
                value={form.projectId}
                onChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
                placeholder="Select a project"
                ariaLabel="Project"
                options={projects.map((p) => ({ value: String(p.id), label: p.name }))}
              />
            </div>
          )}
          <Input
            label="Sprint name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Sprint 12"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start date"
              type="date"
              min={todayStr()}
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="End date"
              type="date"
              min={form.startDate || todayStr()}
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <Select
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              ariaLabel="Status"
              options={[
                { value: "Planned", label: "Planned" },
                { value: "Active", label: "Active" },
                { value: "Completed", label: "Completed" },
              ]}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete sprint"
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
          Delete <strong>{confirmDelete?.name}</strong>? Any bugs scoped to it will lose that
          sprint reference. This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}
