import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FolderKanban, Plus, MoreVertical, Pencil, Trash2, Users, X } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import Avatar from "../components/Avatar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import MultiSelectCheckboxes from "../components/MultiSelectCheckboxes.jsx";
import { projectService } from "../services/projectService";
import { adminService } from "../services/adminService";
import { getErrorMessage } from "../utils/apiError.js";

export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = creating
  const [form, setForm] = useState({ name: "", description: "", ownerId: "", memberIds: [] });
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  // Team management modal (existing projects only)
  const [teamProject, setTeamProject] = useState(null); // project the "Manage Team" modal is open for
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [addMemberIds, setAddMemberIds] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectService.listProjects({ search, pageSize: 50 });
      setProjects(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load projects"));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Used to populate the "Owner" dropdown and the team-member picker.
    // Best-effort — if the signed-in user can't list users (no
    // users.view permission) this silently no-ops.
    adminService
      .listUsers({ pageSize: 100 })
      .then((data) => setUsers(data.items))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: "", description: "", ownerId: "", memberIds: [] });
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      ownerId: project.owner?.id ? String(project.owner.id) : "",
      memberIds: [],
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
      if (editingProject) {
        await projectService.updateProject(editingProject.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          ownerId: form.ownerId ? Number(form.ownerId) : undefined,
        });
        toast.success("Project updated");
      } else {
        await projectService.createProject({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          ownerId: form.ownerId ? Number(form.ownerId) : undefined,
          memberIds: form.memberIds,
        });
        toast.success("Project created");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save project"));
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
      toast.error(getErrorMessage(err, "Failed to delete project"));
    }
  };

  // --- Team management (Phase 8: project-scoped access control) ----------
  // Only members of a project's team (plus Admin/Lead org-wide) can see
  // the project or be assigned its tasks/bugs/subtasks — see
  // app/services/project_access.py on the backend.
  const openTeam = async (project) => {
    setTeamProject(project);
    setAddMemberIds([]);
    setTeamLoading(true);
    try {
      const members = await projectService.listProjectMembers(project.id);
      setTeamMembers(members);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load team members"));
    } finally {
      setTeamLoading(false);
    }
  };

  const handleAddMembers = async (e) => {
    e.preventDefault();
    if (addMemberIds.length === 0) return;
    setAddingMembers(true);
    try {
      const members = await projectService.addProjectMembers(teamProject.id, addMemberIds);
      setTeamMembers(members);
      setAddMemberIds([]);
      toast.success("Team updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add members"));
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingMemberId(userId);
    try {
      await projectService.removeProjectMember(teamProject.id, userId);
      setTeamMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove member"));
    } finally {
      setRemovingMemberId(null);
    }
  };

  const memberUserIds = new Set(teamMembers.map((m) => m.user_id));
  const availableToAdd = users.filter((u) => !memberUserIds.has(u.id));

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
            { label: "Manage team", icon: Users, onClick: () => openTeam(row) },
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
          {!editingProject && (
            <div>
              <label className="label">Team members</label>
              <p className="mb-2 text-xs text-slate-400">
                Only people added here (plus Admin/Lead) will be able to see this project and be
                assigned its tasks, bugs, and subtasks. You can add more later from "Manage team".
              </p>
              <MultiSelectCheckboxes
                options={users.map((u) => ({ id: u.id, name: u.full_name, description: u.email }))}
                selectedIds={form.memberIds}
                onChange={(ids) => setForm((f) => ({ ...f, memberIds: ids }))}
                emptyMessage="No users available"
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Manage Team modal — add/remove members from an existing project */}
      <Modal
        open={Boolean(teamProject)}
        onClose={() => setTeamProject(null)}
        title={`Team — ${teamProject?.name || ""}`}
        footer={
          <Button variant="secondary" onClick={() => setTeamProject(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label">Current members</label>
            {teamLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader label="Loading team..." />
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">No team members yet.</p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto">
                {teamMembers.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={m.full_name} size={24} />
                      <div>
                        <p className="text-sm text-slate-700">{m.full_name}</p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.user_id)}
                      disabled={removingMemberId === m.user_id}
                      className="rounded p-1 text-slate-400 hover:text-red-600 disabled:opacity-40"
                      title="Remove from team"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form className="space-y-2" onSubmit={handleAddMembers}>
            <label className="label">Add members</label>
            <MultiSelectCheckboxes
              options={availableToAdd.map((u) => ({ id: u.id, name: u.full_name, description: u.email }))}
              selectedIds={addMemberIds}
              onChange={setAddMemberIds}
              disabled={addingMembers}
              emptyMessage="Everyone is already on the team"
            />
            <Button type="submit" loading={addingMembers} disabled={addMemberIds.length === 0} className="mt-2">
              Add to team
            </Button>
          </form>
        </div>
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
