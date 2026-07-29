import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FolderKanban, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import { projectService } from "../services/projectService";
import { adminService } from "../services/adminService";

export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = creating
  const [form, setForm] = useState({ name: "", description: "", ownerId: "" });
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectService.listProjects({ search, pageSize: 50 });
      setProjects(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Best-effort — only used to populate the "Owner" dropdown. If the
    // signed-in user can't list users (no users.view permission) this
    // silently no-ops and the dropdown just stays empty; ownership still
    // defaults to "yourself" on create.
    adminService
      .listUsers({ pageSize: 100 })
      .then((data) => setUsers(data.items))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: "", description: "", ownerId: "" });
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      ownerId: project.owner?.id ? String(project.owner.id) : "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
      };
      if (editingProject) {
        await projectService.updateProject(editingProject.id, payload);
        toast.success("Project updated");
      } else {
        await projectService.createProject(payload);
        toast.success("Project created");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await projectService.deleteProject(confirmDelete.id);
      toast.success("Project deleted");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete project");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Project",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.description && (
            <p className="mt-0.5 max-w-md truncate text-xs text-slate-400">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) => row.owner?.full_name || <span className="text-slate-300">Unassigned</span>,
    },
    {
      key: "created_at",
      header: "Created",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Dropdown
          label={<MoreVertical size={16} />}
          items={[
            { label: "Edit project", icon: Pencil, onClick: () => openEdit(row) },
            { label: "Delete project", icon: Trash2, onClick: () => setConfirmDelete(row) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Organize your work by product or team"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New Project
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="max-w-sm"
        />
        <span className="text-sm text-slate-400">
          {total} project{total === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading projects..." />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start tracking tasks, sprints, and bugs against it."
          action={
            <Button icon={Plus} onClick={openCreate}>
              New Project
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={projects} />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingProject ? "Edit project" : "New project"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editingProject ? "Save changes" : "Create project"}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <Input
            label="Project name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Retail Portal"
          />
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What is this project for?"
            />
          </div>
          <div>
            <label className="label">Owner</label>
            <Select
              value={form.ownerId}
              onChange={(v) => setForm((f) => ({ ...f, ownerId: v }))}
              placeholder="You (default)"
              ariaLabel="Owner"
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete project"
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
          This will permanently delete <strong>{confirmDelete?.name}</strong> along with every bug,
          task, and sprint that belongs to it. This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}
