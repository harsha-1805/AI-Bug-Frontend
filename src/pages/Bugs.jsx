import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, MoreVertical, Pencil, Trash2, UserPlus } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Avatar from "../components/Avatar.jsx";
import Loader from "../components/Loader.jsx";
import { bugService } from "../services/bugService";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { adminService } from "../services/adminService";

const SEVERITY_TONE = { Critical: "critical", High: "high", Medium: "medium", Low: "low" };
const STATUS_TONE = { Open: "info", "In Progress": "medium", Resolved: "success", Closed: "neutral" };
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];

const emptyForm = {
  projectId: "",
  sprintId: "",
  title: "",
  severity: "Medium",
  priority: "P2",
  status: "Open",
  description: "",
  assignedTo: "",
};

export default function Bugs() {
  const [loading, setLoading] = useState(true);
  const [bugs, setBugs] = useState([]);
  const [total, setTotal] = useState(0);

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [formSprints, setFormSprints] = useState([]); // sprints for whichever project is selected in the form

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [assigningBug, setAssigningBug] = useState(null);
  const [assigneeChoice, setAssigneeChoice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bugService.listBugs({
        search,
        status: statusFilter || undefined,
        projectId: projectFilter ? Number(projectFilter) : undefined,
        pageSize: 50,
      });
      // severity has no server-side filter param today — filter client-side
      // rather than adding a query param the backend doesn't accept yet.
      const items = severityFilter
        ? data.items.filter((b) => b.severity === severityFilter)
        : data.items;
      setBugs(items);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load bugs");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, severityFilter, projectFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    projectService.listProjects({ pageSize: 100 }).then((data) => setProjects(data.items)).catch(() => {});
    adminService.listUsers({ pageSize: 100 }).then((data) => setUsers(data.items)).catch(() => {});
  }, []);

  // Whenever the form's selected project changes, refresh which sprints
  // are offered — a bug's sprint has to belong to the same project.
  useEffect(() => {
    if (!form.projectId) {
      setFormSprints([]);
      return;
    }
    sprintService
      .listSprints({ projectId: Number(form.projectId) })
      .then(setFormSprints)
      .catch(() => setFormSprints([]));
  }, [form.projectId]);

  const openCreate = () => {
    setEditingBug(null);
    setForm({ ...emptyForm, projectId: projectFilter || "" });
    setFormOpen(true);
  };

  const openEdit = (bug) => {
    setEditingBug(bug);
    setForm({
      projectId: String(bug.project_id),
      sprintId: bug.sprint_id ? String(bug.sprint_id) : "",
      title: bug.title,
      severity: bug.severity,
      priority: bug.priority,
      status: bug.status,
      description: bug.description || "",
      assignedTo: bug.assignee?.id ? String(bug.assignee.id) : "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingBug && !form.projectId) {
      toast.error("Every bug needs to belong to a project — pick one");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Bug title is required");
      return;
    }
    setSaving(true);
    try {
      const shared = {
        title: form.title.trim(),
        severity: form.severity,
        priority: form.priority,
        status: form.status,
        sprintId: form.sprintId ? Number(form.sprintId) : undefined,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
        description: form.description.trim() || undefined,
      };
      if (editingBug) {
        await bugService.updateBug(editingBug.id, shared);
        toast.success("Bug updated");
      } else {
        await bugService.createBug({ projectId: Number(form.projectId), ...shared });
        toast.success("Bug reported");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save bug");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (bug, status) => {
    try {
      await bugService.updateBug(bug.id, { status });
      toast.success(`Marked as ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update status");
    }
  };

  const openAssign = (bug) => {
    setAssigningBug(bug);
    setAssigneeChoice(bug.assignee?.id ? String(bug.assignee.id) : "");
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assigneeChoice) return;
    try {
      await bugService.assignBug(assigningBug.id, Number(assigneeChoice));
      toast.success("Bug assigned");
      setAssigningBug(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to assign bug");
    }
  };

  const handleDelete = async () => {
    try {
      await bugService.deleteBug(confirmDelete.id);
      toast.success("Bug deleted");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete bug");
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name || `#${id}`;

  const columns = [
    {
      key: "title",
      header: "Bug",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.title}</p>
          <p className="mt-0.5 text-xs text-slate-400">{projectName(row.project_id)}</p>
        </div>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (row) => <Badge tone={SEVERITY_TONE[row.severity] || "neutral"}>{row.severity}</Badge>,
    },
    { key: "priority", header: "Priority", render: (row) => <Badge tone="neutral">{row.priority}</Badge> },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={STATUS_TONE[row.status] || "neutral"}>{row.status}</Badge>,
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (row) =>
        row.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar name={row.assignee.full_name} size={24} />
            <span className="text-sm text-slate-600">{row.assignee.full_name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">Unassigned</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Dropdown
          label={<MoreVertical size={16} />}
          items={[
            { label: "Edit bug", icon: Pencil, onClick: () => openEdit(row) },
            { label: "Assign", icon: UserPlus, onClick: () => openAssign(row) },
            ...STATUSES.filter((s) => s !== row.status).map((s) => ({
              label: `Mark as ${s}`,
              onClick: () => changeStatus(row, s),
            })),
            { label: "Delete bug", icon: Trash2, onClick: () => setConfirmDelete(row) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bugs"
        subtitle="Track, triage, and resolve issues across every project"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Create Bug
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bugs..."
          className="max-w-sm"
        />
        <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">
          {bugs.length} of {total} bug{total === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading bugs..." />
        </div>
      ) : (
        <Table
          columns={columns}
          data={bugs}
          emptyMessage="No bugs match these filters."
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBug ? "Edit bug" : "Create bug"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editingBug ? "Save changes" : "Create bug"}
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
              disabled={Boolean(editingBug)}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, sprintId: "" }))}
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
          </div>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Login fails after password update"
          />
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[70px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Severity</label>
              <select
                className="input"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sprint (optional)</label>
              <select
                className="input"
                value={form.sprintId}
                disabled={!form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, sprintId: e.target.value }))}
              >
                <option value="">No sprint</option>
                {formSprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(assigningBug)}
        onClose={() => setAssigningBug(null)}
        title={`Assign — ${assigningBug?.title || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssigningBug(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssign}>Assign</Button>
          </>
        }
      >
        <form onSubmit={handleAssign}>
          <label className="label">Assignee</label>
          <select
            className="input"
            value={assigneeChoice}
            onChange={(e) => setAssigneeChoice(e.target.value)}
          >
            <option value="" disabled>
              Select a teammate
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete bug"
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
