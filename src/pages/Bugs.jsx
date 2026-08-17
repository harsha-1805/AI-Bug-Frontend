import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, MoreVertical, Pencil, Trash2, UserPlus, UploadCloud, X, Eye, PanelRightClose, Sparkles, ExternalLink, FileSpreadsheet } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Textarea from "../components/Textarea.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import Avatar from "../components/Avatar.jsx";
import Loader from "../components/Loader.jsx";
import DueDateBadge from "../components/DueDateBadge.jsx";
import { bugService } from "../services/bugService";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { getErrorMessage } from "../utils/apiError.js";
import {
  validateRequiredText,
  validateOptionalText,
  TEXT_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from "../utils/validation.js";
import { useAuth } from "../hooks/useAuth";
import { useProjectFilter } from "../hooks/useProjectFilter";
import { resolveMediaUrl } from "../api/axiosInstance.js";
import { AI_ENTITY_DRAG_MIME, setPendingTestCaseRequest } from "../utils/aiHandoff.js";

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
  imageUrl: "",
};

export default function Bugs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRoleName = user?.role?.name || (user?.roles?.[0]?.name) || "";
  const canDeleteBug = ["Admin", "Lead", "QA"].includes(userRoleName);
  const [loading, setLoading] = useState(true);
  const [bugs, setBugs] = useState([]);
  const [total, setTotal] = useState(0);

  const [projects, setProjects] = useState([]);
  // Project-scoped team members for whichever project is selected in the
  // create/edit form — a bug can only be assigned to someone on that
  // project's team (or Admin/Lead), see app/services/project_access.py.
  const [formMembers, setFormMembers] = useState([]);
  const [formSprints, setFormSprints] = useState([]); // sprints for whichever project is selected in the form

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  // Universal project filter (Navbar dropdown) — "" = all projects. Shared
  // across Tasks/Sprints/Bugs/Dashboard/Reports/AI Assistant via context,
  // see context/ProjectFilterContext.jsx.
  const { selectedProjectId: projectFilter } = useProjectFilter();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Assign modal — members scoped to the bug being assigned's project
  const [assigningBug, setAssigningBug] = useState(null);
  const [assigningMembers, setAssigningMembers] = useState([]);
  const [assigningMembersLoading, setAssigningMembersLoading] = useState(false);
  const [assigneeChoice, setAssigneeChoice] = useState("");

  const [previewImage, setPreviewImage] = useState(null); // { url, title } for the lightbox modal
  const [previewBug, setPreviewBug] = useState(null); // bug shown in the split-pane preview panel

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
      toast.error(getErrorMessage(err, "Failed to load bugs"));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, severityFilter, projectFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the split-pane preview in sync with the underlying row after an
  // edit/status-change/assign triggers a reload, instead of showing stale
  // data until the panel is closed and reopened.
  useEffect(() => {
    setPreviewBug((prev) => {
      if (!prev) return prev;
      const updated = bugs.find((b) => b.id === prev.id);
      return updated || prev;
    });
  }, [bugs]);

  useEffect(() => {
    // The project list itself is already team-scoped server-side (see
    // GET /api/v1/projects -> project_access.accessible_project_ids), so
    // every dropdown fed from `projects` automatically only shows
    // projects this user can actually use.
    projectService.listProjects({ pageSize: 100 }).then((data) => setProjects(data.items)).catch(() => {});
  }, []);

  // Whenever the form's selected project changes, refresh which sprints
  // AND which team members are offered — a bug's sprint has to belong to
  // the same project, and its assignee has to be a member of that
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
      imageUrl: bug.image_url || "",
    });
    setFormOpen(true);
  };

  const handleImageSelect = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const { image_url } = await bugService.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: image_url }));
      toast.success("Screenshot uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload screenshot"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingBug && !form.projectId) {
      toast.error("Every bug needs to belong to a project — pick one");
      return;
    }
    const titleError = validateRequiredText(form.title, { label: "Bug title", maxLength: TEXT_MAX_LENGTH });
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
        imageUrl: form.imageUrl || undefined,
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
      toast.error(getErrorMessage(err, "Failed to save bug"));
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
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const openAssign = async (bug) => {
    setAssigningBug(bug);
    setAssigneeChoice(bug.assignee?.id ? String(bug.assignee.id) : "");
    setAssigningMembersLoading(true);
    try {
      const members = await projectService.listProjectMembers(bug.project_id);
      setAssigningMembers(members);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load project team"));
      setAssigningMembers([]);
    } finally {
      setAssigningMembersLoading(false);
    }
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
      toast.error(getErrorMessage(err, "Failed to assign bug"));
    }
  };

  const handleDelete = async () => {
    try {
      await bugService.deleteBug(confirmDelete.id);
      toast.success("Bug deleted");
      if (previewBug?.id === confirmDelete.id) setPreviewBug(null);
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete bug"));
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name || `#${id}`;

  // Drop this bug on the Sidebar's "AI Assistant" link, or click
  // "Generate test cases" directly — either way it hands the bug off
  // (see utils/aiHandoff.js) and jumps to the AI Assistant, which
  // generates the test cases grounded in this bug's recorded fields.
  const handleGenerateTestCases = (bug) => {
    setPendingTestCaseRequest("bug", bug.id, bug.title);
    navigate("/ai-assistant");
  };

  const handleTitleDragStart = (bug) => (e) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(AI_ENTITY_DRAG_MIME, JSON.stringify({ entityType: "bug", entityId: bug.id, title: bug.title }));
  };

  const columns = [
    {
      key: "title",
      header: "Bug",
      minWidth: 220,
      render: (row) => (
        <div
          className="flex items-center gap-3"
          draggable
          onDragStart={handleTitleDragStart(row)}
          title="Drag onto AI Assistant to generate test cases"
        >
          {row.image_url ? (
            <button
              type="button"
              onClick={() => setPreviewImage({ url: resolveMediaUrl(row.image_url), title: row.title })}
              className="shrink-0 overflow-hidden rounded-lg border border-border"
              title="View screenshot"
            >
              <img
                src={resolveMediaUrl(row.image_url)}
                alt=""
                className="h-10 w-10 object-cover"
              />
            </button>
          ) : (
            <div className="h-10 w-10 shrink-0" />
          )}
          <button
            type="button"
            onClick={() => setPreviewBug(row)}
            className="min-w-0 text-left"
            title="Open preview"
          >
            <p className="font-medium text-slate-800 hover:text-primary-600">
              {row.custom_id && (
                <span className="mr-1.5 inline-block rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 align-middle">{row.custom_id}</span>
              )}
              {row.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{projectName(row.project_id)}</p>
          </button>
          <button
            type="button"
            onClick={() => setPreviewBug(row)}
            title="Preview"
            className="ml-auto shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-primary-600"
          >
            <Eye size={15} />
          </button>
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
      key: "reporter",
      header: "Reported by",
      render: (row) =>
        row.reporter ? (
          <div className="flex items-center gap-2">
            <Avatar name={row.reporter.full_name} size={24} />
            <span className="text-sm text-slate-600">{row.reporter.full_name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
    {
      key: "task",
      header: "Task",
      render: (row) =>
        row.task ? (
          <div>
            <p className="max-w-[160px] truncate text-sm text-slate-600">{row.task.title}</p>
            <div className="flex flex-wrap items-center gap-1">
              {row.task.sprint && <Badge tone="info">{row.task.sprint.name}</Badge>}
              {row.subtask && (
                <span className="max-w-[160px] truncate text-xs text-slate-400">
                  ↳ {row.subtask.title}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-300">No task</span>
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
            { label: "Generate test cases", icon: Sparkles, onClick: () => handleGenerateTestCases(row) },
            ...STATUSES.filter((s) => s !== row.status).map((s) => ({
              label: `Mark as ${s}`,
              onClick: () => changeStatus(row, s),
            })),
            ...(canDeleteBug ? [{ label: "Delete bug", icon: Trash2, onClick: () => setConfirmDelete(row) }] : []),
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
        <Select
          className="w-auto min-w-[9.5rem]"
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All statuses"
          ariaLabel="Filter by status"
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <Select
          className="w-auto min-w-[9.5rem]"
          value={severityFilter}
          onChange={setSeverityFilter}
          placeholder="All severities"
          ariaLabel="Filter by severity"
          options={SEVERITIES.map((s) => ({ value: s, label: s }))}
        />
        <span className="text-sm text-slate-400">
          {bugs.length} of {total} bug{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
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
        </div>

        {/* Split-pane preview — opens beside the table (not over it) when
            a bug's title or preview icon is clicked, Jira-issue-panel
            style, instead of a full-screen modal. */}
        {previewBug && (
          <BugPreviewPanel
            bug={previewBug}
            projectName={projectName}
            onClose={() => setPreviewBug(null)}
            onEdit={() => {
              openEdit(previewBug);
            }}
            onAssign={() => openAssign(previewBug)}
            onDelete={() => setConfirmDelete(previewBug)}
            onGenerateTestCases={() => handleGenerateTestCases(previewBug)}
            onViewScreenshot={() =>
              setPreviewImage({ url: resolveMediaUrl(previewBug.image_url), title: previewBug.title })
            }
          />
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBug ? "Edit bug" : "Create bug"}
        className="max-w-xl"
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
            <label className="label">Screenshot (optional)</label>
            {form.imageUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img
                  src={resolveMediaUrl(form.imageUrl)}
                  alt="Bug evidence"
                  className="max-h-48 w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  className="absolute right-2 top-2 rounded-lg bg-slate-900/60 p-1.5 text-white hover:bg-slate-900/80"
                  aria-label="Remove screenshot"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-canvas px-4 py-6 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/30"
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!uploadingImage) handleImageSelect(e.dataTransfer.files?.[0]);
                }}
              >
                {uploadingImage ? (
                  <Loader label="Uploading..." />
                ) : (
                  <>
                    <UploadCloud size={22} className="text-primary-500" />
                    <p className="text-xs text-slate-500">Click or drag a screenshot here (optional)</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => handleImageSelect(e.target.files?.[0])}
                />
              </div>
            )}
          </div>
          <div>
            <label className="label">Project</label>
            <Select
              value={form.projectId}
              disabled={Boolean(editingBug)}
              onChange={(v) => setForm((f) => ({ ...f, projectId: v, sprintId: "", assignedTo: "" }))}
              placeholder="Select a project"
              ariaLabel="Project"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
          <Input
            label="Title"
            value={form.title}
            maxLength={TEXT_MAX_LENGTH}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Login fails after password update"
          />
          <Textarea
            label="Description"
            value={form.description}
            maxLength={TEXTAREA_MAX_LENGTH}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Severity</label>
              <Select
                value={form.severity}
                onChange={(v) => setForm((f) => ({ ...f, severity: v }))}
                ariaLabel="Severity"
                options={SEVERITIES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <Select
                value={form.priority}
                onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                ariaLabel="Priority"
                options={PRIORITIES.map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <Select
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                ariaLabel="Status"
                options={STATUSES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Sprint (optional)</label>
              <Select
                value={form.sprintId}
                disabled={!form.projectId}
                onChange={(v) => setForm((f) => ({ ...f, sprintId: v }))}
                placeholder="No sprint"
                ariaLabel="Sprint"
                options={formSprints.map((s) => ({ value: s.id, label: s.name }))}
              />
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
            <Button onClick={handleAssign} disabled={!assigneeChoice || assigningMembersLoading}>
              Assign
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssign}>
          <label className="label">Assignee</label>
          {assigningMembersLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader label="Loading team..." />
            </div>
          ) : (
            <Select
              value={assigneeChoice}
              onChange={setAssigneeChoice}
              placeholder="Select a teammate"
              ariaLabel="Assignee"
              options={assigningMembers.map((m) => ({ value: m.user_id, label: m.full_name }))}
            />
          )}
          <p className="mt-1 text-xs text-slate-400">
            Only this project's team members can be assigned.
          </p>
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
      <Modal
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.title || "Screenshot"}
        footer={
          <Button variant="secondary" onClick={() => setPreviewImage(null)}>
            Close
          </Button>
        }
      >
        {previewImage && (
          <img
            src={previewImage.url}
            alt={previewImage.title}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        )}
      </Modal>
    </div>
  );
}

/**
 * Split-pane bug detail panel — sits beside the bugs table (see the flex
 * wrapper above) instead of covering it, so the list stays visible while
 * reviewing a bug, similar to Jira's issue side-panel.
 */
function BugPreviewPanel({ bug, projectName, onClose, onEdit, onAssign, onDelete, onViewScreenshot, onGenerateTestCases }) {
  // Open the bug detail in a dedicated full-screen tab so the user can
  // review the full bug without losing their place in the bugs list.
  const openInNewTab = () => {
    const html = buildBugDetailHtml(bug, projectName(bug.project_id));
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <aside className="sticky top-4 flex w-full max-w-sm shrink-0 flex-col rounded-2xl border border-border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{projectName(bug.project_id)}</p>
          <h3 className="truncate text-base font-semibold text-slate-800">{bug.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Open full-screen in new tab */}
          <button
            type="button"
            onClick={openInNewTab}
            aria-label="Open in new tab"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
            title="Open full screen in new tab"
          >
            <ExternalLink size={15} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Close preview"
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {bug.image_url && (
          <button type="button" onClick={onViewScreenshot} className="block w-full overflow-hidden rounded-xl border border-border">
            <img src={resolveMediaUrl(bug.image_url)} alt="" className="max-h-48 w-full object-cover" />
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge tone={SEVERITY_TONE[bug.severity] || "neutral"}>{bug.severity}</Badge>
          <Badge tone="neutral">{bug.priority}</Badge>
          <Badge tone={STATUS_TONE[bug.status] || "neutral"}>{bug.status}</Badge>
        </div>

        {bug.description && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Description</p>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{bug.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Assignee</p>
            {bug.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar name={bug.assignee.full_name} size={22} />
                <span className="text-sm text-slate-600">{bug.assignee.full_name}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-300">Unassigned</span>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Reported by</p>
            {bug.reporter ? (
              <div className="flex items-center gap-2">
                <Avatar name={bug.reporter.full_name} size={22} />
                <span className="text-sm text-slate-600">{bug.reporter.full_name}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-300">—</span>
            )}
          </div>
        </div>

        {bug.task && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Linked task</p>
            <p className="text-sm text-slate-600">{bug.task.title}</p>
            {bug.task.sprint && <Badge tone="info">{bug.task.sprint.name}</Badge>}
          </div>
        )}

        {bug.subtask && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Linked subtask</p>
            <p className="text-sm text-slate-600">{bug.subtask.title}</p>
          </div>
        )}

        {bug.due_date && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Due</p>
            <DueDateBadge date={bug.due_date} doneLike={bug.status === "Closed" || bug.status === "Resolved"} />
          </div>
        )}

        {/* AI test cases shortcut */}
        <button
          type="button"
          onClick={onGenerateTestCases}
          className="flex w-full items-center gap-2 rounded-xl border border-primary-100 bg-primary-50/50 px-3 py-2.5 text-left text-xs font-medium text-primary-700 hover:bg-primary-50"
        >
          <FileSpreadsheet size={14} className="shrink-0" />
          Generate AI test cases for this bug
        </button>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-border px-4 py-3">
        <Button variant="secondary" icon={Pencil} onClick={onEdit} className="flex-1">
          Edit
        </Button>
        <Button variant="secondary" icon={UserPlus} onClick={onAssign} className="flex-1">
          Assign
        </Button>
        <Button variant="danger" icon={Trash2} onClick={onDelete}>
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </aside>
  );
}

// ── Full-screen bug detail (new tab) ────────────────────────────────────────
function buildBugDetailHtml(bug, projectName) {
  const field = (label, val) =>
    val
      ? `<div class="field"><p class="label">${label}</p><p class="val">${String(val).replace(/\n/g, "<br>")}</p></div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${bug.title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;font-size:13px;background:#f8fafc;color:#1e293b;padding:32px;max-width:800px;margin:0 auto}
  h1{font-size:1.3rem;font-weight:700;margin-bottom:4px}
  .project{font-size:12px;color:#94a3b8;margin-bottom:16px}
  .badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .badge{padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;border:1px solid #e2e8f0;background:#f1f5f9}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
  .field{margin-bottom:20px}
  .label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:600;margin-bottom:4px}
  .val{font-size:13px;color:#334155;line-height:1.6;white-space:pre-wrap}
  img{max-width:100%;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:20px}
</style>
</head>
<body>
<p class="project">${projectName}</p>
<h1>${bug.title}</h1>
<div class="badges">
  <span class="badge">${bug.severity}</span>
  <span class="badge">${bug.priority}</span>
  <span class="badge">${bug.status}</span>
</div>
${bug.image_url ? `<img src="http://localhost:8003${bug.image_url}" alt="Screenshot"/>` : ""}
${field("Description", bug.description)}
${field("Steps to reproduce", bug.steps_to_reproduce)}
${field("Expected result", bug.expected_result)}
${field("Actual result", bug.actual_result)}
<div class="grid">
  ${field("Assignee", bug.assignee?.full_name)}
  ${field("Reported by", bug.reporter?.full_name)}
</div>
${field("Module", bug.module)}
</body>
</html>`;
}
