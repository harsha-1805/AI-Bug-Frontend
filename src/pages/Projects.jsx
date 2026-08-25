// import { useCallback, useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import { FolderKanban, Plus, MoreVertical, Pencil, Trash2, Users, X } from "lucide-react";
// import PageHeader from "../components/PageHeader.jsx";
// import SearchBar from "../components/SearchBar.jsx";
// import Button from "../components/Button.jsx";
// import Table from "../components/Table.jsx";
// import Modal from "../components/Modal.jsx";
// import Input from "../components/Input.jsx";
// import Textarea from "../components/Textarea.jsx";
// import Dropdown from "../components/Dropdown.jsx";
// import Select from "../components/Select.jsx";
// import Avatar from "../components/Avatar.jsx";
// import EmptyState from "../components/EmptyState.jsx";
// import Loader from "../components/Loader.jsx";
// import MultiSelectCheckboxes from "../components/MultiSelectCheckboxes.jsx";
// import { projectService } from "../services/projectService";
// import { adminService } from "../services/adminService";
// import { getErrorMessage } from "../utils/apiError.js";
// import { validateRequiredText, validateOptionalText, TEXT_MAX_LENGTH, TEXTAREA_MAX_LENGTH } from "../utils/validation.js";
// import { useAuth } from "../hooks/useAuth";
// import { hasPermission } from "../utils/rbac.js";

// export default function Projects() {
//   const { user } = useAuth();
//   // Permission-driven action gating — mirrors the backend's
//   // require_permission(...) checks in projects_router.py, so a role
//   // without a given permission simply doesn't see that action here;
//   // every other role's buttons render exactly as before.
//   const canCreateProject = hasPermission(user, "projects.create");
//   const canEditProject = hasPermission(user, "projects.edit");
//   const canDeleteProject = hasPermission(user, "projects.delete");
//   const [loading, setLoading] = useState(true);
//   const [projects, setProjects] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState("");

//   const [users, setUsers] = useState([]);

//   const [formOpen, setFormOpen] = useState(false);
//   const [editingProject, setEditingProject] = useState(null); // null = creating
//   const [form, setForm] = useState({ name: "", description: "", ownerId: "", memberIds: [] });
//   const [saving, setSaving] = useState(false);

//   const [confirmDelete, setConfirmDelete] = useState(null);

//   // Team management modal (existing projects only)
//   const [teamProject, setTeamProject] = useState(null); // project the "Manage Team" modal is open for
//   const [teamMembers, setTeamMembers] = useState([]);
//   const [teamLoading, setTeamLoading] = useState(false);
//   const [addMemberIds, setAddMemberIds] = useState([]);
//   const [addingMembers, setAddingMembers] = useState(false);
//   const [removingMemberId, setRemovingMemberId] = useState(null);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await projectService.listProjects({ search, pageSize: 50 });
//       setProjects(data.items);
//       setTotal(data.total);
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to load projects"));
//     } finally {
//       setLoading(false);
//     }
//   }, [search]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   useEffect(() => {
//     // Used to populate the "Owner" dropdown and the team-member picker.
//     // Best-effort — if the signed-in user can't list users (no
//     // users.view permission) this silently no-ops.
//     adminService
//       .listUsers({ pageSize: 100 })
//       .then((data) => setUsers(data.items))
//       .catch(() => { });
//   }, []);

//   const openCreate = () => {
//     setEditingProject(null);
//     setForm({ name: "", description: "", ownerId: "", memberIds: [] });
//     setFormOpen(true);
//   };

//   const openEdit = (project) => {
//     setEditingProject(project);
//     setForm({
//       name: project.name,
//       description: project.description || "",
//       ownerId: project.owner?.id ? String(project.owner.id) : "",
//       memberIds: [],
//     });
//     setFormOpen(true);
//   };

//   const handleSave = async (e) => {
//     e.preventDefault();
//     const nameError = validateRequiredText(form.name, { label: "Project name", maxLength: TEXT_MAX_LENGTH });
//     if (nameError) {
//       toast.error(nameError);
//       return;
//     }
//     const descriptionError = validateOptionalText(form.description, {
//       label: "Description",
//       maxLength: TEXTAREA_MAX_LENGTH,
//     });
//     if (descriptionError) {
//       toast.error(descriptionError);
//       return;
//     }
//     setSaving(true);
//     try {
//       if (editingProject) {
//         await projectService.updateProject(editingProject.id, {
//           name: form.name.trim(),
//           description: form.description.trim() || undefined,
//           ownerId: form.ownerId ? Number(form.ownerId) : undefined,
//         });
//         toast.success("Project updated");
//       } else {
//         await projectService.createProject({
//           name: form.name.trim(),
//           description: form.description.trim() || undefined,
//           ownerId: form.ownerId ? Number(form.ownerId) : undefined,
//           memberIds: form.memberIds,
//         });
//         toast.success("Project created");
//       }
//       setFormOpen(false);
//       load();
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to save project"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await projectService.deleteProject(confirmDelete.id);
//       toast.success("Project deleted");
//       setConfirmDelete(null);
//       load();
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to delete project"));
//     }
//   };

//   // --- Team management (Phase 8: project-scoped access control) ----------
//   // Only members of a project's team (plus Admin/Lead org-wide) can see
//   // the project or be assigned its tasks/bugs/subtasks — see
//   // app/services/project_access.py on the backend.
//   const openTeam = async (project) => {
//     setTeamProject(project);
//     setAddMemberIds([]);
//     setTeamLoading(true);
//     try {
//       const members = await projectService.listProjectMembers(project.id);
//       setTeamMembers(members);
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to load team members"));
//     } finally {
//       setTeamLoading(false);
//     }
//   };

//   const handleAddMembers = async (e) => {
//     e.preventDefault();
//     if (addMemberIds.length === 0) return;
//     setAddingMembers(true);
//     try {
//       const members = await projectService.addProjectMembers(teamProject.id, addMemberIds);
//       setTeamMembers(members);
//       setAddMemberIds([]);
//       toast.success("Team updated");
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to add members"));
//     } finally {
//       setAddingMembers(false);
//     }
//   };

//   const handleRemoveMember = async (userId) => {
//     setRemovingMemberId(userId);
//     try {
//       await projectService.removeProjectMember(teamProject.id, userId);
//       setTeamMembers((prev) => prev.filter((m) => m.user_id !== userId));
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to remove member"));
//     } finally {
//       setRemovingMemberId(null);
//     }
//   };

//   // Read-only project preview (name/description/owner/team) — separate
//   // from "Manage Team" above, which is the add/remove editing modal.
//   const [previewProject, setPreviewProject] = useState(null);
//   const [previewMembers, setPreviewMembers] = useState([]);
//   const [previewLoading, setPreviewLoading] = useState(false);

//   const openPreview = async (project) => {
//     setPreviewProject(project);
//     setPreviewLoading(true);
//     try {
//       const members = await projectService.listProjectMembers(project.id);
//       setPreviewMembers(members);
//     } catch (err) {
//       toast.error(getErrorMessage(err, "Failed to load project details"));
//     } finally {
//       setPreviewLoading(false);
//     }
//   };

//   const memberUserIds = new Set(teamMembers.map((m) => m.user_id));
//   const availableToAdd = users.filter((u) => !memberUserIds.has(u.id));

//   const columns = [
//     {
//       key: "name",
//       header: "Project",
//       render: (row) => (
//         <button type="button" onClick={() => openPreview(row)} className="text-left">
//           <p className="font-medium text-slate-800 hover:text-primary-600">{row.name}</p>
//           {row.description && (
//             <p className="mt-0.5 max-w-md truncate text-xs text-slate-400">{row.description}</p>
//           )}
//         </button>
//       ),
//     },
//     {
//       key: "owner",
//       header: "Owner",
//       render: (row) => row.owner?.full_name || <span className="text-slate-300">Unassigned</span>,
//     },
//     {
//       key: "created_at",
//       header: "Created",
//       render: (row) => new Date(row.created_at).toLocaleDateString(),
//     },
//     {
//       key: "actions",
//       header: "Actions",
//       render: (row) => {
//         const items = [
//           {
//             label: "Manage team",
//             icon: Users,
//             onClick: () => openTeam(row),
//             disabled: !canEditProject,
//             disabledReason: "You don't have permission to manage the team",
//           },
//           {
//             label: "Edit project",
//             icon: Pencil,
//             onClick: () => openEdit(row),
//             disabled: !canEditProject,
//             disabledReason: "You don't have permission to edit projects",
//           },
//           {
//             label: "Delete project",
//             icon: Trash2,
//             danger: true,
//             onClick: () => setConfirmDelete(row),
//             disabled: !canDeleteProject,
//             disabledReason: "You don't have permission to delete projects",
//           },
//         ];
//         return <Dropdown label={<MoreVertical size={16} />} showChevron={false} items={items} />;
//       },
//     },
//   ];

//   return (
//     <div>
//       <PageHeader
//         title="Projects"
//         subtitle="Organize your work by product or team"
//         actions={
//           <Button
//             icon={Plus}
//             onClick={openCreate}
//             permissionLocked={!canCreateProject}
//             lockedReason="You don't have permission to create projects"
//           >
//             New Project
//           </Button>
//         }
//       />

//       <div className="mb-5 flex items-center gap-3">
//         <SearchBar
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search projects..."
//           className="max-w-sm"
//         />
//         <span className="text-sm text-slate-400">
//           {total} project{total === 1 ? "" : "s"}
//         </span>
//       </div>

//       {loading ? (
//         <div className="card flex items-center justify-center p-10">
//           <Loader label="Loading projects..." />
//         </div>
//       ) : projects.length === 0 ? (
//         <EmptyState
//           icon={FolderKanban}
//           title="No projects yet"
//           description="Create your first project to start tracking tasks, sprints, and bugs against it."
//           action={
//             <Button
//               icon={Plus}
//               onClick={openCreate}
//               permissionLocked={!canCreateProject}
//               lockedReason="You don't have permission to create projects"
//             >
//               New Project
//             </Button>
//           }
//         />
//       ) : (
//         <Table columns={columns} data={projects} />
//       )}

//       <Modal
//         open={formOpen}
//         onClose={() => setFormOpen(false)}
//         title={editingProject ? "Edit project" : "New project"}
//         footer={
//           <>
//             <Button variant="secondary" onClick={() => setFormOpen(false)}>
//               Cancel
//             </Button>
//             <Button loading={saving} onClick={handleSave}>
//               {editingProject ? "Save changes" : "Create project"}
//             </Button>
//           </>
//         }
//       >
//         <form className="space-y-4" onSubmit={handleSave}>
//           <Input
//             label="Project name"
//             value={form.name}
//             maxLength={TEXT_MAX_LENGTH}
//             onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
//             placeholder="e.g. Retail Portal"
//           />
//           <Textarea
//             label="Description"
//             value={form.description}
//             maxLength={TEXTAREA_MAX_LENGTH}
//             onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
//             placeholder="What is this project for?"
//           />
//           <div>
//             <label className="label">Owner</label>
//             <Select
//               value={form.ownerId}
//               onChange={(v) => setForm((f) => ({ ...f, ownerId: v }))}
//               placeholder="You (default)"
//               ariaLabel="Owner"
//               options={users.map((u) => ({ value: u.id, label: u.full_name }))}
//             />
//           </div>
//           {!editingProject && (
//             <div>
//               <label className="label">Team members</label>
//               <p className="mb-2 text-xs text-slate-400">
//                 Only people added here (plus Admin/Lead) will be able to see this project and be
//                 assigned its tasks, bugs, and subtasks. You can add more later from "Manage team".
//               </p>
//               <MultiSelectCheckboxes
//                 options={users.map((u) => ({ id: u.id, name: u.full_name, description: u.email }))}
//                 selectedIds={form.memberIds}
//                 onChange={(ids) => setForm((f) => ({ ...f, memberIds: ids }))}
//                 emptyMessage="No users available"
//               />
//             </div>
//           )}
//         </form>
//       </Modal>

//       {/* Manage Team modal — add/remove members from an existing project */}
//       <Modal
//         open={Boolean(teamProject)}
//         onClose={() => setTeamProject(null)}
//         title={`Team — ${teamProject?.name || ""}`}
//         footer={
//           <Button variant="secondary" onClick={() => setTeamProject(null)}>
//             Close
//           </Button>
//         }
//       >
//         <div className="space-y-5">
//           <div>
//             <label className="label">Current members</label>
//             {teamLoading ? (
//               <div className="flex items-center justify-center py-6">
//                 <Loader label="Loading team..." />
//               </div>
//             ) : teamMembers.length === 0 ? (
//               <p className="py-2 text-sm text-slate-400">No team members yet.</p>
//             ) : (
//               <ul className="max-h-56 space-y-1 overflow-y-auto">
//                 {teamMembers.map((m) => (
//                   <li
//                     key={m.user_id}
//                     className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
//                   >
//                     <div className="flex min-w-0 flex-1 items-center gap-2">
//                       <Avatar name={m.full_name} size={24} />
//                       <div className="min-w-0">
//                         <p className="truncate text-sm text-slate-700">{m.full_name}</p>
//                         <p className="truncate text-xs text-slate-400">{m.email}</p>
//                       </div>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveMember(m.user_id)}
//                       disabled={removingMemberId === m.user_id}
//                       className="shrink-0 rounded p-1 text-slate-400 hover:text-red-600 disabled:opacity-40"
//                       title="Remove from team"
//                     >
//                       <X size={14} />
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>

//           <form className="space-y-2" onSubmit={handleAddMembers}>
//             <label className="label">Add members</label>
//             <MultiSelectCheckboxes
//               options={availableToAdd.map((u) => ({ id: u.id, name: u.full_name, description: u.email }))}
//               selectedIds={addMemberIds}
//               onChange={setAddMemberIds}
//               disabled={addingMembers}
//               emptyMessage="Everyone is already on the team"
//             />
//             <Button type="submit" loading={addingMembers} disabled={addMemberIds.length === 0} className="mt-2">
//               Add to team
//             </Button>
//           </form>
//         </div>
//       </Modal>

//       {/* Project preview — read-only overview + team, opened by clicking
//           the project name in the table. Separate from "Manage Team"
//           above, which is for actually adding/removing members. */}
//       <Modal
//         open={Boolean(previewProject)}
//         onClose={() => setPreviewProject(null)}
//         title={previewProject?.name || "Project"}
//         footer={
//           canEditProject && previewProject ? (
//             <>
//               <Button
//                 variant="secondary"
//                 icon={Users}
//                 onClick={() => {
//                   const p = previewProject;
//                   setPreviewProject(null);
//                   openTeam(p);
//                 }}
//               >
//                 Manage team
//               </Button>
//               <Button
//                 icon={Pencil}
//                 onClick={() => {
//                   const p = previewProject;
//                   setPreviewProject(null);
//                   openEdit(p);
//                 }}
//               >
//                 Edit project
//               </Button>
//             </>
//           ) : null
//         }
//       >
//         <div className="space-y-4">
//           {previewProject?.description && (
//             <p className="text-sm text-slate-600">{previewProject.description}</p>
//           )}
//           <div className="grid grid-cols-2 gap-3 text-sm">
//             <div>
//               <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Owner</p>
//               <p className="mt-0.5 text-slate-700">
//                 {previewProject?.owner?.full_name || <span className="text-slate-300">Unassigned</span>}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</p>
//               <p className="mt-0.5 text-slate-700">
//                 {previewProject?.created_at ? new Date(previewProject.created_at).toLocaleDateString() : "—"}
//               </p>
//             </div>
//           </div>
//           <div>
//             <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
//               Team ({previewMembers.length})
//             </p>
//             {previewLoading ? (
//               <div className="flex items-center justify-center py-6">
//                 <Loader label="Loading team..." />
//               </div>
//             ) : previewMembers.length === 0 ? (
//               <p className="text-sm text-slate-400">No team members added yet.</p>
//             ) : (
//               <ul className="space-y-2">
//                 {previewMembers.map((m) => (
//                   <li key={m.user_id} className="flex items-center gap-2">
//                     <Avatar name={m.full_name || m.email} size={28} />
//                     <div className="min-w-0">
//                       <p className="truncate text-sm font-medium text-slate-700">{m.full_name}</p>
//                       <p className="truncate text-xs text-slate-400">{m.email}</p>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </div>
//       </Modal>

//       <Modal
//         open={Boolean(confirmDelete)}
//         onClose={() => setConfirmDelete(null)}
//         title="Delete project"
//         footer={
//           <>
//             <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
//               Cancel
//             </Button>
//             <Button variant="danger" onClick={handleDelete}>
//               Delete permanently
//             </Button>
//           </>
//         }
//       >
//         <p className="text-sm text-slate-600">
//           This will permanently delete <strong>{confirmDelete?.name}</strong> along with every bug,
//           task, and sprint that belongs to it. This can&apos;t be undone.
//         </p>
//       </Modal>
//     </div>
//   );
// }


//new code style preview


import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FolderKanban,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  X,
  ArrowLeft,
  UserRound,
  CalendarDays,
  Layers3,
  FileText,
} from "lucide-react";

import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Textarea from "../components/Textarea.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import Avatar from "../components/Avatar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import MultiSelectCheckboxes from "../components/MultiSelectCheckboxes.jsx";

import { projectService } from "../services/projectService";
import { adminService } from "../services/adminService";
import { getErrorMessage } from "../utils/apiError.js";
import {
  validateRequiredText,
  validateOptionalText,
  TEXT_MAX_LENGTH,
  TEXTAREA_MAX_LENGTH,
} from "../utils/validation.js";
import { useAuth } from "../hooks/useAuth";
import { hasPermission } from "../utils/rbac.js";

export default function Projects() {
  const { user } = useAuth();

  // =========================================================
  // PERMISSIONS
  // =========================================================
  const canCreateProject = hasPermission(user, "projects.create");
  const canEditProject = hasPermission(user, "projects.edit");
  const canDeleteProject = hasPermission(user, "projects.delete");

  // =========================================================
  // PROJECT LIST
  // =========================================================
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // =========================================================
  // USERS
  // =========================================================
  const [users, setUsers] = useState([]);

  // =========================================================
  // CREATE / EDIT PROJECT
  // =========================================================
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    ownerId: "",
    memberIds: [],
  });

  const [saving, setSaving] = useState(false);

  // =========================================================
  // DELETE
  // =========================================================
  const [confirmDelete, setConfirmDelete] = useState(null);

  // =========================================================
  // TEAM MANAGEMENT
  // =========================================================
  const [teamProject, setTeamProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [addMemberIds, setAddMemberIds] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  // =========================================================
  // PROJECT PREVIEW
  //
  // Instead of opening a small modal, clicking a project name
  // switches the page into a full preview view.
  // =========================================================
  const [previewProject, setPreviewProject] = useState(null);
  const [previewMembers, setPreviewMembers] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // =========================================================
  // LOAD PROJECTS
  // =========================================================
  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await projectService.listProjects({
        search,
        pageSize: 50,
      });

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

  // =========================================================
  // LOAD USERS
  // =========================================================
  useEffect(() => {
    adminService
      .listUsers({ pageSize: 100 })
      .then((data) => setUsers(data.items))
      .catch(() => {});
  }, []);

  // =========================================================
  // CREATE PROJECT
  // =========================================================
  const openCreate = () => {
    setEditingProject(null);

    setForm({
      name: "",
      description: "",
      ownerId: "",
      memberIds: [],
    });

    setFormOpen(true);
  };

  // =========================================================
  // EDIT PROJECT
  // =========================================================
  const openEdit = (project) => {
    setEditingProject(project);

    setForm({
      name: project.name,
      description: project.description || "",
      ownerId: project.owner?.id
        ? String(project.owner.id)
        : "",
      memberIds: [],
    });

    setFormOpen(true);
  };

  // =========================================================
  // SAVE PROJECT
  // =========================================================
  const handleSave = async (e) => {
    e.preventDefault();

    const nameError = validateRequiredText(form.name, {
      label: "Project name",
      maxLength: TEXT_MAX_LENGTH,
    });

    if (nameError) {
      toast.error(nameError);
      return;
    }

    const descriptionError = validateOptionalText(
      form.description,
      {
        label: "Description",
        maxLength: TEXTAREA_MAX_LENGTH,
      }
    );

    if (descriptionError) {
      toast.error(descriptionError);
      return;
    }

    setSaving(true);

    try {
      if (editingProject) {
        await projectService.updateProject(
          editingProject.id,
          {
            name: form.name.trim(),
            description:
              form.description.trim() || undefined,
            ownerId: form.ownerId
              ? Number(form.ownerId)
              : undefined,
          }
        );

        toast.success("Project updated");
      } else {
        await projectService.createProject({
          name: form.name.trim(),
          description:
            form.description.trim() || undefined,
          ownerId: form.ownerId
            ? Number(form.ownerId)
            : undefined,
          memberIds: form.memberIds,
        });

        toast.success("Project created");
      }

      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Failed to save project")
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE PROJECT
  // =========================================================
  const handleDelete = async () => {
    try {
      await projectService.deleteProject(
        confirmDelete.id
      );

      toast.success("Project deleted");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Failed to delete project")
      );
    }
  };

  // =========================================================
  // OPEN TEAM
  // =========================================================
  const openTeam = async (project) => {
    setTeamProject(project);
    setAddMemberIds([]);
    setTeamLoading(true);

    try {
      const members =
        await projectService.listProjectMembers(
          project.id
        );

      setTeamMembers(members);
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to load team members"
        )
      );
    } finally {
      setTeamLoading(false);
    }
  };

  // =========================================================
  // ADD MEMBERS
  // =========================================================
  const handleAddMembers = async (e) => {
    e.preventDefault();

    if (addMemberIds.length === 0) return;

    setAddingMembers(true);

    try {
      const members =
        await projectService.addProjectMembers(
          teamProject.id,
          addMemberIds
        );

      setTeamMembers(members);
      setAddMemberIds([]);

      toast.success("Team updated");
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Failed to add members")
      );
    } finally {
      setAddingMembers(false);
    }
  };

  // =========================================================
  // REMOVE MEMBER
  // =========================================================
  const handleRemoveMember = async (userId) => {
    setRemovingMemberId(userId);

    try {
      await projectService.removeProjectMember(
        teamProject.id,
        userId
      );

      setTeamMembers((prev) =>
        prev.filter(
          (member) => member.user_id !== userId
        )
      );
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to remove member"
        )
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  // =========================================================
  // OPEN PROJECT PREVIEW
  //
  // This is the main new behavior.
  // =========================================================
  const openPreview = async (project) => {
    setPreviewProject(project);
    setPreviewMembers([]);
    setPreviewLoading(true);

    try {
      const members =
        await projectService.listProjectMembers(
          project.id
        );

      setPreviewMembers(members);
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to load project details"
        )
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // =========================================================
  // CLOSE PROJECT PREVIEW
  // =========================================================
  const closePreview = () => {
    setPreviewProject(null);
    setPreviewMembers([]);
  };

  // =========================================================
  // AVAILABLE TEAM MEMBERS
  // =========================================================
  const memberUserIds = new Set(
    teamMembers.map((member) => member.user_id)
  );

  const availableToAdd = users.filter(
    (userItem) =>
      !memberUserIds.has(userItem.id)
  );

  // =========================================================
  // PROJECT TABLE
  //
  // This stays the same conceptually as your old page.
  // =========================================================
  const columns = [
    {
      key: "name",
      header: "Project",

      render: (row) => (
        <button
          type="button"
          onClick={() => openPreview(row)}
          className="
            text-left
            transition-colors
            focus:outline-none
          "
        >
          <p
            className="
              font-medium
              text-slate-800
              hover:text-primary-600
            "
          >
            {row.name}
          </p>

          {row.description && (
            <p
              className="
                mt-0.5
                max-w-md
                truncate
                text-xs
                text-slate-400
              "
            >
              {row.description}
            </p>
          )}
        </button>
      ),
    },

    {
      key: "owner",
      header: "Owner",

      render: (row) =>
        row.owner?.full_name || (
          <span className="text-slate-300">
            Unassigned
          </span>
        ),
    },

    {
      key: "created_at",
      header: "Created",

      render: (row) =>
        new Date(
          row.created_at
        ).toLocaleDateString(),
    },

    {
      key: "actions",
      header: "Actions",

      render: (row) => {
        const items = [
          {
            label: "Manage team",
            icon: Users,
            onClick: () => openTeam(row),
            disabled: !canEditProject,
            disabledReason:
              "You don't have permission to manage the team",
          },

          {
            label: "Edit project",
            icon: Pencil,
            onClick: () => openEdit(row),
            disabled: !canEditProject,
            disabledReason:
              "You don't have permission to edit projects",
          },

          {
            label: "Delete project",
            icon: Trash2,
            danger: true,
            onClick: () => setConfirmDelete(row),
            disabled: !canDeleteProject,
            disabledReason:
              "You don't have permission to delete projects",
          },
        ];

        return (
          <Dropdown
            label={<MoreVertical size={16} />}
            showChevron={false}
            items={items}
          />
        );
      },
    },
  ];

  // =========================================================
  // IMPORTANT:
  //
  // If a project is selected, render the PREVIEW PAGE.
  // Otherwise render the ORIGINAL PROJECTS LIST PAGE.
  // =========================================================
  if (previewProject) {
    return (
      <ProjectPreview
        project={previewProject}
        members={previewMembers}
        loading={previewLoading}
        onBack={closePreview}
        onEdit={() => {
          closePreview();
          openEdit(previewProject);
        }}
        onManageTeam={() => {
          closePreview();
          openTeam(previewProject);
        }}
        canEditProject={canEditProject}
      />
    );
  }

  // =========================================================
  // ORIGINAL PROJECTS PAGE
  // =========================================================
  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Organize your work by product or team"
        actions={
          <Button
            icon={Plus}
            onClick={openCreate}
            permissionLocked={!canCreateProject}
            lockedReason={
              "You don't have permission to create projects"
            }
          >
            New Project
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search projects..."
          className="max-w-sm"
        />

        <span className="text-sm text-slate-400">
          {total} project
          {total === 1 ? "" : "s"}
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
            <Button
              icon={Plus}
              onClick={openCreate}
              permissionLocked={!canCreateProject}
              lockedReason={
                "You don't have permission to create projects"
              }
            >
              New Project
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={projects}
        />
      )}

      {/* =====================================================
          CREATE / EDIT PROJECT MODAL
      ====================================================== */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editingProject
            ? "Edit project"
            : "New project"
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setFormOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              loading={saving}
              onClick={handleSave}
            >
              {editingProject
                ? "Save changes"
                : "Create project"}
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={handleSave}
        >
          <Input
            label="Project name"
            value={form.name}
            maxLength={TEXT_MAX_LENGTH}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                name: e.target.value,
              }))
            }
            placeholder="e.g. Retail Portal"
          />

          <Textarea
            label="Description"
            value={form.description}
            maxLength={TEXTAREA_MAX_LENGTH}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            placeholder="What is this project for?"
          />

          <div>
            <label className="label">
              Owner
            </label>

            <Select
              value={form.ownerId}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ownerId: value,
                }))
              }
              placeholder="You (default)"
              ariaLabel="Owner"
              options={users.map((userItem) => ({
                value: userItem.id,
                label: userItem.full_name,
              }))}
            />
          </div>

          {!editingProject && (
            <div>
              <label className="label">
                Team members
              </label>

              <p className="mb-2 text-xs text-slate-400">
                Only people added here (plus
                Admin/Lead) will be able to see
                this project and be assigned its
                tasks, bugs, and subtasks. You can
                add more later from "Manage team".
              </p>

              <MultiSelectCheckboxes
                options={users.map(
                  (userItem) => ({
                    id: userItem.id,
                    name: userItem.full_name,
                    description: userItem.email,
                  })
                )}
                selectedIds={form.memberIds}
                onChange={(ids) =>
                  setForm((current) => ({
                    ...current,
                    memberIds: ids,
                  }))
                }
                emptyMessage="No users available"
              />
            </div>
          )}
        </form>
      </Modal>

      {/* =====================================================
          MANAGE TEAM MODAL
      ====================================================== */}
      <Modal
        open={Boolean(teamProject)}
        onClose={() =>
          setTeamProject(null)
        }
        title={`Team — ${
          teamProject?.name || ""
        }`}
        footer={
          <Button
            variant="secondary"
            onClick={() =>
              setTeamProject(null)
            }
          >
            Close
          </Button>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label">
              Current members
            </label>

            {teamLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader label="Loading team..." />
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">
                No team members yet.
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto">
                {teamMembers.map(
                  (member) => (
                    <li
                      key={member.user_id}
                      className="
                        flex items-center
                        justify-between
                        gap-2
                        rounded-lg
                        border border-border
                        px-3 py-2
                      "
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Avatar
                          name={
                            member.full_name
                          }
                          size={24}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-700">
                            {member.full_name}
                          </p>

                          <p className="truncate text-xs text-slate-400">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(
                            member.user_id
                          )
                        }
                        disabled={
                          removingMemberId ===
                          member.user_id
                        }
                        className="
                          shrink-0
                          rounded
                          p-1
                          text-slate-400
                          hover:text-red-600
                          disabled:opacity-40
                        "
                        title="Remove from team"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          <form
            className="space-y-2"
            onSubmit={handleAddMembers}
          >
            <label className="label">
              Add members
            </label>

            <MultiSelectCheckboxes
              options={availableToAdd.map(
                (userItem) => ({
                  id: userItem.id,
                  name: userItem.full_name,
                  description: userItem.email,
                })
              )}
              selectedIds={addMemberIds}
              onChange={setAddMemberIds}
              disabled={addingMembers}
              emptyMessage="Everyone is already on the team"
            />

            <Button
              type="submit"
              loading={addingMembers}
              disabled={
                addMemberIds.length === 0
              }
              className="mt-2"
            >
              Add to team
            </Button>
          </form>
        </div>
      </Modal>

      {/* =====================================================
          DELETE PROJECT MODAL
      ====================================================== */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() =>
          setConfirmDelete(null)
        }
        title="Delete project"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setConfirmDelete(null)
              }
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This will permanently delete{" "}
          <strong>
            {confirmDelete?.name}
          </strong>{" "}
          along with every bug, task, and sprint
          that belongs to it. This can&apos;t be
          undone.
        </p>
      </Modal>
    </div>
  );
}

/* =========================================================
   PROJECT PREVIEW PAGE

   This is the new part.

   It follows the same visual language as TaskPreviewPage:
   - slate background
   - max width
   - back button
   - white rounded container
   - gradient header
   - information cards
   - description section
   - team section
========================================================= */

function ProjectPreview({
  project,
  members,
  loading,
  onBack,
  onEdit,
  onManageTeam,
  canEditProject,
}) {
  return (
    <div className="min-h-full w-full bg-slate-50">
      <div
        className="
          mx-auto w-full max-w-7xl
          px-3 py-4
          sm:px-5 sm:py-6
          lg:px-8
        "
      >
        {/* =====================================================
            BACK BUTTON
        ====================================================== */}
        <div className="mb-4 sm:mb-6">
          <button
            type="button"
            onClick={onBack}
            className="
              inline-flex min-h-9
              items-center gap-2
              rounded-lg
              border border-slate-200
              bg-white
              px-3 py-2
              text-sm
              font-semibold
              text-slate-600
              shadow-sm
              transition-all duration-200
              hover:border-primary-200
              hover:bg-primary-50
              hover:text-primary-600
              hover:shadow
              active:scale-[0.98]
              focus:outline-none
              focus:ring-2
              focus:ring-primary-500/20
            "
          >
            <ArrowLeft size={17} />
            <span>Back</span>
          </button>
        </div>

        {/* =====================================================
            MAIN PREVIEW CARD
        ====================================================== */}
        <div
          className="
            overflow-hidden
            rounded-xl
            border border-slate-200
            bg-white
            shadow-sm
          "
        >
          {/* ===================================================
              HEADER
          ==================================================== */}
          <div
            className="
              border-b border-slate-200
              bg-gradient-to-r
              from-primary-50
              via-white
              to-white
              px-4 py-5
              sm:px-6 sm:py-6
              lg:px-8
            "
          >
            <div
              className="
                flex flex-col gap-5
                lg:flex-row
                lg:items-start
                lg:justify-between
              "
            >
              {/* Project title */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />

                  <p
                    className="
                      min-w-0
                      break-words
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-primary-600
                    "
                  >
                    Project
                  </p>
                </div>

                <h1
                  className="
                    break-words
                    text-xl
                    font-bold
                    leading-tight
                    text-slate-800
                    sm:text-2xl
                    lg:text-3xl
                    xl:text-4xl
                  "
                >
                  {project.name}
                </h1>

                {/* Project ID */}
                <div className="mt-3">
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-md
                      border border-slate-200
                      bg-white
                      px-2.5 py-1
                      text-xs
                      font-semibold
                      text-slate-500
                      shadow-sm
                    "
                  >
                    <Layers3 size={13} />
                    Project #{project.id}
                  </span>
                </div>
              </div>

              {/* Header actions */}
              {canEditProject && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onManageTeam}
                    className="
                      inline-flex
                      min-h-9
                      items-center
                      gap-2
                      rounded-lg
                      border border-slate-200
                      bg-white
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      text-slate-600
                      shadow-sm
                      transition-all
                      hover:border-primary-200
                      hover:bg-primary-50
                      hover:text-primary-600
                    "
                  >
                    <Users size={15} />
                    Manage team
                  </button>

                  <button
                    type="button"
                    onClick={onEdit}
                    className="
                      inline-flex
                      min-h-9
                      items-center
                      gap-2
                      rounded-lg
                      bg-primary-600
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      text-white
                      shadow-sm
                      transition-all
                      hover:bg-primary-700
                    "
                  >
                    <Pencil size={15} />
                    Edit project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ===================================================
              CONTENT
          ==================================================== */}
          <div
            className="
              px-4 py-5
              sm:px-6 sm:py-7
              lg:px-8 lg:py-8
            "
          >
            {/* =================================================
                INFORMATION CARDS
            ================================================== */}
            <div
              className="
                grid grid-cols-1 gap-3
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {/* Owner */}
              <ProjectInfoCard
                label="Owner"
                accent="blue"
                icon={<UserRound size={17} />}
              >
                {project.owner ? (
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar
                      name={project.owner.full_name}
                      size={32}
                    />

                    <span
                      className="
                        min-w-0
                        break-words
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      {project.owner.full_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">
                    Unassigned
                  </span>
                )}
              </ProjectInfoCard>

              {/* Created */}
              <ProjectInfoCard
                label="Created"
                accent="amber"
                icon={<CalendarDays size={17} />}
              >
                <span className="text-sm font-semibold text-slate-700">
                  {project.created_at
                    ? new Date(
                        project.created_at
                      ).toLocaleDateString()
                    : "—"}
                </span>
              </ProjectInfoCard>

              {/* Team count */}
              <ProjectInfoCard
                label="Team"
                accent="violet"
                icon={<Users size={17} />}
              >
                <span className="text-sm font-semibold text-slate-700">
                  {loading
                    ? "Loading..."
                    : `${members.length} member${
                        members.length === 1
                          ? ""
                          : "s"
                      }`}
                </span>
              </ProjectInfoCard>
            </div>

            {/* =================================================
                DIVIDER
            ================================================== */}
            <div className="my-7 border-t border-slate-200 sm:my-8" />

            {/* =================================================
                DESCRIPTION
            ================================================== */}
            <ProjectContentSection
              title="Description"
              visible={Boolean(project.description)}
              accent="primary"
            >
              <div
                className="
                  rounded-xl
                  border border-primary-100
                  bg-primary-50/40
                  p-4
                  sm:p-5
                "
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="
                      flex h-8 w-8
                      items-center justify-center
                      rounded-lg
                      bg-primary-100
                      text-primary-600
                    "
                  >
                    <FileText size={16} />
                  </span>

                  <span className="text-sm font-bold text-slate-800">
                    Project overview
                  </span>
                </div>

                <p
                  className="
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-6
                    text-slate-600
                    sm:text-[15px]
                  "
                >
                  {project.description}
                </p>
              </div>
            </ProjectContentSection>

            {!project.description && (
              <ProjectContentSection
                title="Description"
                visible={true}
                accent="primary"
              >
                <div
                  className="
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    p-4
                    sm:p-5
                  "
                >
                  <p className="text-sm text-slate-400">
                    No description has been added
                    for this project.
                  </p>
                </div>
              </ProjectContentSection>
            )}

            {/* =================================================
                DIVIDER
            ================================================== */}
            <div className="my-7 border-t border-slate-200 sm:my-8" />

            {/* =================================================
                TEAM
            ================================================== */}
            <ProjectContentSection
              title="Project team"
              visible={true}
              accent="violet"
            >
              <div
                className="
                  rounded-xl
                  border border-violet-100
                  bg-violet-50/30
                  p-4
                  sm:p-5
                "
              >
                {/* Team header */}
                <div
                  className="
                    mb-4
                    flex flex-col gap-2
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="
                        flex h-8 w-8
                        items-center justify-center
                        rounded-lg
                        bg-violet-100
                        text-violet-600
                      "
                    >
                      <Users size={17} />
                    </span>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Team members
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        People assigned to this project
                      </p>
                    </div>
                  </div>

                  {!loading && (
                    <span
                      className="
                        w-fit
                        rounded-full
                        border border-violet-200
                        bg-violet-50
                        px-2.5 py-1
                        text-xs
                        font-semibold
                        text-violet-700
                      "
                    >
                      {members.length}{" "}
                      {members.length === 1
                        ? "member"
                        : "members"}
                    </span>
                  )}
                </div>

                {/* Team loading */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader label="Loading team..." />
                  </div>
                ) : members.length === 0 ? (
                  <div
                    className="
                      rounded-xl
                      border border-slate-200
                      bg-white
                      px-4 py-6
                      text-center
                    "
                  >
                    <Users
                      size={24}
                      className="
                        mx-auto
                        mb-2
                        text-slate-300
                      "
                    />

                    <p className="text-sm font-medium text-slate-500">
                      No team members yet
                    </p>

                    {canEditProject && (
                      <p className="mt-1 text-xs text-slate-400">
                        Use "Manage team" to add
                        members.
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className="
                      grid grid-cols-1 gap-2
                      sm:grid-cols-2
                      lg:grid-cols-3
                    "
                  >
                    {members.map((member) => (
                      <div
                        key={member.user_id}
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                          rounded-xl
                          border border-slate-200
                          bg-white
                          px-3 py-3
                          shadow-sm
                          transition-all
                          hover:border-violet-200
                          hover:shadow-md
                        "
                      >
                        <Avatar
                          name={
                            member.full_name ||
                            member.email
                          }
                          size={34}
                        />

                        <div className="min-w-0">
                          <p
                            className="
                              truncate
                              text-sm
                              font-semibold
                              text-slate-700
                            "
                          >
                            {member.full_name}
                          </p>

                          <p
                            className="
                              truncate
                              text-xs
                              text-slate-400
                            "
                          >
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ProjectContentSection>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROJECT INFORMATION CARD
   Same visual pattern as TaskPreviewPage InfoCard.
========================================================= */

function ProjectInfoCard({
  label,
  children,
  accent = "blue",
  icon,
}) {
  const accentStyles = {
    primary: "bg-primary-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-400",
  };

  const iconStyles = {
    primary:
      "bg-primary-100 text-primary-600",
    blue:
      "bg-blue-100 text-blue-600",
    violet:
      "bg-violet-100 text-violet-600",
    amber:
      "bg-amber-100 text-amber-600",
    emerald:
      "bg-emerald-100 text-emerald-600",
    slate:
      "bg-slate-100 text-slate-500",
  };

  const backgroundStyles = {
    primary:
      "from-primary-50/70 to-white",
    blue:
      "from-blue-50/70 to-white",
    violet:
      "from-violet-50/70 to-white",
    amber:
      "from-amber-50/70 to-white",
    emerald:
      "from-emerald-50/70 to-white",
    slate:
      "from-slate-50 to-white",
  };

  return (
    <div
      className={`
        group
        relative
        min-w-0
        overflow-hidden
        rounded-xl
        border border-slate-200
        bg-gradient-to-br
        p-4
        shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-md
        ${backgroundStyles[backgroundStyles ? accent : "blue"]}
      `}
    >
      {/* Accent */}
      <div
        className={`
          absolute
          left-0 top-0
          h-full w-1
          ${accentStyles[accent]}
        `}
      />

      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={`
              flex h-8 w-8
              shrink-0
              items-center justify-center
              rounded-lg
              ${iconStyles[accent]}
            `}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            className="
              mb-2
              text-[11px]
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            {label}
          </p>

          <div className="min-h-8 flex items-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CONTENT SECTION
========================================================= */

function ProjectContentSection({
  title,
  visible,
  children,
  accent = "primary",
}) {
  if (!visible) return null;

  const accentStyles = {
    primary: "bg-primary-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`
            h-5 w-1
            shrink-0
            rounded-full
            ${accentStyles[accent]}
          `}
        />

        <h2
          className="
            text-sm
            font-bold
            text-slate-800
          "
        >
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

