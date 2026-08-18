import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  MoreVertical,
  ShieldCheck,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Select from "../components/Select.jsx";
import Loader from "../components/Loader.jsx";
import MultiSelectCheckboxes from "../components/MultiSelectCheckboxes.jsx";
import { useAuth } from "../hooks/useAuth";
import { adminService, rolesService } from "../services/adminService";
import { getErrorMessage } from "../utils/apiError.js";
import { isEmailDomainAllowed, ALLOWED_EMAIL_DOMAINS, isEmailLocalPartValid, EMAIL_LOCAL_PART_ERROR } from "../utils/emailValidation.js";

// Matches the 5 roles actually seeded by the backend
// (app/services/role_service.py -> DEFAULT_ROLE_DESCRIPTIONS).
const ROLE_TONE = {
  Admin: "info",
  Lead: "success",
  HR: "medium",
  QA: "neutral",
  Employee: "low",
};

// Plain-language "what can this role do" reference, shown in the Roles
// legend panel on this page. Kept here (not fetched from the backend)
// since it's just a friendlier restatement of role_service.ROLE_PERMISSIONS
// for people who aren't going to read raw permission codes.
const ROLE_ACCESS_SUMMARY = {
  Admin: "Full access to every module — projects, sprints, tasks, subtasks, bugs, releases, reports, user management, and the audit log.",
  Lead: "Manages projects, sprints, tasks, subtasks and bugs end-to-end for their team; can view (not manage) users; can view the audit log. Acts as the Project Manager role.",
  HR: "Manages people: invite/edit/deactivate users, assign roles, reset passwords. Read-only on dashboard/reports; no access to projects, tasks, or bugs.",
  QA: "Reports, triages and verifies bugs; runs the AI Bug Generator; can view/update tasks & subtasks and view sprints; can view the audit log.",
  Employee: "Works day-to-day on tasks/subtasks and bugs assigned to them; can create bugs; read-only on projects, sprints and releases.",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");

  const [roles, setRoles] = useState([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: "", email: "", roleId: "" });
  const [inviting, setInviting] = useState(false);
  const [invitedCreds, setInvitedCreds] = useState(null); // { email, temporary_password }

  const [editUser, setEditUser] = useState(null); // user being edited, or null
  const [editForm, setEditForm] = useState({ fullName: "", email: "" });
  const [saving, setSaving] = useState(false);

  const [assignRoleUser, setAssignRoleUser] = useState(null);
  const [assignRoleIds, setAssignRoleIds] = useState([]); // multi-select: array of role ids
  const [assigningRole, setAssigningRole] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null); // user.id currently being (de)activated

  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const [showRolesLegend, setShowRolesLegend] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.listUsers({ search, page, pageSize });
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    rolesService
      .listRoles()
      .then(setRoles)
      .catch(() => {
        // Non-fatal: role dropdowns just stay empty if this fails.
      });
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) {
      toast.error("Full name and email are required");
      return;
    }
    if (!isEmailLocalPartValid(inviteForm.email.trim())) {
      toast.error(EMAIL_LOCAL_PART_ERROR);
      return;
    }
    if (!isEmailDomainAllowed(inviteForm.email.trim())) {
      toast.error(
        `Please use a standard email domain (${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")}).`
      );
      return;
    }
    setInviting(true);
    try {
      const data = await adminService.inviteUser({
        fullName: inviteForm.fullName.trim(),
        email: inviteForm.email.trim(),
        roleId: inviteForm.roleId ? Number(inviteForm.roleId) : null,
      });
      toast.success(`Invited ${data.user.full_name}`);
      setInvitedCreds({ email: data.user.email, temporary_password: data.temporary_password });
      setInviteForm({ fullName: "", email: "", roleId: "" });
      loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to invite user"));
    } finally {
      setInviting(false);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({ fullName: user.full_name, email: user.email });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (editForm.email && !isEmailLocalPartValid(editForm.email.trim())) {
      toast.error(EMAIL_LOCAL_PART_ERROR);
      return;
    }
    if (editForm.email && !isEmailDomainAllowed(editForm.email.trim())) {
      toast.error(
        `Please use a standard email domain (${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")}).`
      );
      return;
    }
    setSaving(true);
    try {
      await adminService.updateUser(editUser.id, editForm);
      toast.success("User updated");
      setEditUser(null);
      loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update user"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPasswordValue.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setResettingPassword(true);
    try {
      await adminService.resetPassword(resetPasswordUser.id, resetPasswordValue);
      toast.success(`Password reset for ${resetPasswordUser.full_name}`);
      setResetPasswordUser(null);
      setResetPasswordValue("");
      loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setResettingPassword(false);
    }
  };

  const openAssignRole = (user) => {
    setAssignRoleUser(user);
    // Seed the checkbox list from whichever roles the user already holds
    // (falls back to the legacy single `role` field for older records).
    const existingIds = user.roles?.length
      ? user.roles.map((r) => r.id)
      : user.role?.id
        ? [user.role.id]
        : [];
    setAssignRoleIds(existingIds);
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (assignRoleIds.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    setAssigningRole(true);
    try {
      await adminService.assignRoles(assignRoleUser.id, assignRoleIds);
      toast.success("Roles updated");
      setAssignRoleUser(null);
      loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update roles"));
    } finally {
      setAssigningRole(false);
    }
  };

  // Bound directly to the Status column's toggle switch: flipping it on
  // calls the activate endpoint, flipping it off calls deactivate — same
  // API the old "Activate/Deactivate" menu item used, just one click away.
  const toggleActive = async (user, nextActive) => {
    setTogglingUserId(user.id);
    // Optimistic UI update so the switch flips instantly; rolled back on error.
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: nextActive } : u)));
    try {
      if (nextActive) {
        await adminService.activateUser(user.id);
        toast.success(`${user.full_name} activated`);
      } else {
        await adminService.deactivateUser(user.id);
        toast.success(`${user.full_name} deactivated`);
      }
    } catch (err) {
      // Roll back the optimistic flip.
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: user.is_active } : u)));
      toast.error(getErrorMessage(err, "Action failed"));
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteUser(confirmDelete.id);
      toast.success("User deleted");
      setConfirmDelete(null);
      loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete user"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = [
    {
      key: "user",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.full_name} size={32} />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{row.full_name}</p>
            <p className="truncate text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Roles",
      render: (row) => {
        const roleList = row.roles?.length ? row.roles : row.role ? [row.role] : [];
        if (roleList.length === 0) {
          return <Badge tone="neutral">No role</Badge>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roleList.map((r) => (
              <Badge key={r.id} tone={ROLE_TONE[r.name] || "neutral"}>
                {r.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={row.is_active ? "success" : "low"}>
            {row.is_active ? "Active" : "Deactivated"}
          </Badge>
          {row.must_change_password && <Badge tone="medium">Invited</Badge>}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={Boolean(row.is_active)}
            aria-label={`${row.is_active ? "Deactivate" : "Activate"} ${row.full_name}`}
            title={row.is_active ? "Deactivate user" : "Activate user"}
            disabled={togglingUserId === row.id || (row.id === currentUser?.id && row.is_active)}
            onClick={() => toggleActive(row, !row.is_active)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-50 ${
              row.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            {row.is_active ? <ToggleRight size={26} aria-hidden="true" /> : <ToggleLeft size={26} aria-hidden="true" />}
          </button>
          <Dropdown
            label={<MoreVertical size={16} />}
            ariaLabel={`Actions for ${row.full_name}`}
            showChevron={false}
            buttonClassName="border-0 p-2 hover:bg-slate-100"
            items={[
              { label: "Edit details", icon: Pencil, onClick: () => openEdit(row) },
              { label: "Assign roles", icon: ShieldCheck, onClick: () => openAssignRole(row) },
              { label: "Reset password", icon: KeyRound, onClick: () => setResetPasswordUser(row) },
              {
                label: "Delete user",
                icon: Trash2,
                danger: true,
                onClick: () => setConfirmDelete(row),
              },
            ].filter((item) => row.id !== currentUser?.id || item.label !== "Deactivate")}
          />
        </div>

      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Invite teammates, manage access, and assign global roles"
        actions={
          <Button icon={Plus} onClick={() => setInviteOpen(true)}>
            Invite User
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBar
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-full max-w-sm sm:w-auto"
        />
        <span className="text-sm text-slate-400">{total} user{total === 1 ? "" : "s"} total</span>
        <button
          type="button"
          onClick={() => setShowRolesLegend((v) => !v)}
          className="ml-auto flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Info size={16} />
          What can each role do?
          {showRolesLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showRolesLegend && (
        <div className="mb-5 grid gap-3 rounded-xl border border-border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(ROLE_ACCESS_SUMMARY).map(([role, summary]) => (
            <div key={role} className="rounded-lg bg-white p-3 shadow-sm">
              <Badge tone={ROLE_TONE[role] || "neutral"}>{role}</Badge>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{summary}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading users..." />
        </div>
      ) : (
        <>
          <Table columns={columns} data={users} emptyMessage="No users found." showPagination={false} />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInvitedCreds(null);
        }}
        title="Invite a user"
        footer={
          invitedCreds ? (
            <Button
              variant="primary"
              onClick={() => {
                setInviteOpen(false);
                setInvitedCreds(null);
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button loading={inviting} onClick={handleInvite}>
                Send Invite
              </Button>
            </>
          )
        }
      >
        {invitedCreds ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Account created for <strong>{invitedCreds.email}</strong>. Share this temporary
              password with them — there&apos;s no email delivery configured yet, so this is shown
              once and won&apos;t be retrievable again.
            </p>
            <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800">
              {invitedCreds.temporary_password}
            </div>
            <p className="text-xs text-slate-400">
              They&apos;ll be asked to change this password after logging in for the first time.
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleInvite}>
            <Input
              label="Full name"
              value={inviteForm.fullName}
              onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Jane Doe"
            />
            <Input
              label="Email address"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jane@gmail.com"
            />
            <p className="-mt-2 text-xs text-slate-400">
              Accepted domains: {ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")}
            </p>
            <div>
              <label className="label">Role</label>
              <Select
                value={inviteForm.roleId}
                onChange={(v) => setInviteForm((f) => ({ ...f, roleId: v }))}
                placeholder="Default (Developer)"
                ariaLabel="Role"
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Update modal */}
      <Modal
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title="Update user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleEditSave}>
              Save
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleEditSave}>
          <Input
            label="Full name"
            value={editForm.fullName}
            onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
          />
          <Input
            label="Email address"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Assign roles modal — multi-select: a user can hold more than one
          role at once (e.g. Lead + QA), so this is a checkbox list rather
          than a single dropdown. */}
      <Modal
        open={Boolean(assignRoleUser)}
        onClose={() => setAssignRoleUser(null)}
        title={`Assign roles — ${assignRoleUser?.full_name || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignRoleUser(null)}>
              Cancel
            </Button>
            <Button loading={assigningRole} onClick={handleAssignRole}>
              Update roles
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleAssignRole}>
          <div>
            <label className="label">Roles</label>
            <p className="mb-2 text-xs text-slate-400">
              Select one or more roles. A user can hold multiple roles at the same time.
            </p>
            <MultiSelectCheckboxes
              options={roles.map((r) => ({ id: r.id, name: r.name, description: r.description }))}
              selectedIds={assignRoleIds}
              onChange={setAssignRoleIds}
              disabled={assigningRole}
              emptyMessage="No roles available"
            />
          </div>
        </form>
      </Modal>

      {/* Reset password (admin/HR) */}
      <Modal
        open={Boolean(resetPasswordUser)}
        onClose={() => {
          setResetPasswordUser(null);
          setResetPasswordValue("");
        }}
        title={`Reset password — ${resetPasswordUser?.full_name || ""}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setResetPasswordUser(null);
                setResetPasswordValue("");
              }}
            >
              Cancel
            </Button>
            <Button loading={resettingPassword} onClick={handleResetPassword}>
              Reset password
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleResetPassword}>
          <p className="text-sm text-slate-600">
            Set a new password for <strong>{resetPasswordUser?.email}</strong>. They&apos;ll be
            asked to change it after logging in next.
          </p>
          <Input
            label="New password"
            type="password"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            placeholder="At least 8 characters"
          />
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete user"
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
          This will permanently delete <strong>{confirmDelete?.full_name}</strong> (
          {confirmDelete?.email}). This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}
