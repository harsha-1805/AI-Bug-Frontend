import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Rocket, MoreVertical, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import { sprintService } from "../services/sprintService";
import { projectService } from "../services/projectService";

const STATUS_TONE = { Planned: "neutral", Active: "info", Completed: "success" };

const emptyForm = { name: "", startDate: "", endDate: "", status: "Planned" };

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
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => {
        setProjects(data.items);
        if (data.items.length > 0) setSelectedProjectId(String(data.items[0].id));
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedProjectId) {
      setSprints([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await sprintService.listSprints({ projectId: Number(selectedProjectId) });
      setSprints(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load sprints");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingSprint(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (sprint) => {
    setEditingSprint(sprint);
    setForm({
      name: sprint.name,
      startDate: sprint.start_date || "",
      endDate: sprint.end_date || "",
      status: sprint.status,
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error("Select a project first");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Sprint name is required");
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
          projectId: Number(selectedProjectId),
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
      toast.error(err.response?.data?.detail || "Failed to save sprint");
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
      toast.error(err.response?.data?.detail || "Failed to delete sprint");
    }
  };

  const columns = [
    { key: "name", header: "Sprint", render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    {
      key: "start_date",
      header: "Start",
      render: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : "—"),
    },
    {
      key: "end_date",
      header: "End",
      render: (row) => (row.end_date ? new Date(row.end_date).toLocaleDateString() : "—"),
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

  return (
    <div>
      <PageHeader
        title="Sprints"
        subtitle="Plan, run, and review sprint cycles"
        actions={
          <Button icon={Plus} onClick={openCreate} disabled={!selectedProjectId}>
            New Sprint
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

      {!selectedProjectId ? (
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
        <Table columns={columns} data={sprints} />
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
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="Planned">Planned</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
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
