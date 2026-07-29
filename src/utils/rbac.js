// Client-side RBAC helper (Phase 3/4).
//
// IMPORTANT: this only controls what the UI *shows*. The backend is the
// real gatekeeper — every admin endpoint is protected server-side with
// `require_permission(...)` (see app/dependencies.py). This file just
// mirrors which roles get the "User Management" nav item / page so we
// don't render a 403-doomed screen for roles that can't use it.
//
// Matches the current role catalog in app/services/role_service.py:
// Admin (full users.* access) and HR (view/invite/edit/deactivate/
// assign_role, but not delete) both get real use out of this screen.
// Lead only holds "users.view", so it's excluded here even though a
// Lead calling GET /admin/users would still succeed server-side.
const ROLES_WITH_USER_MANAGEMENT_ACCESS = ["Admin", "HR"];

export function canManageUsers(user) {
  const roleNames = (user?.roles?.length ? user.roles : [user?.role]).filter(Boolean).map((r) => r.name);
  return roleNames.some((name) => ROLES_WITH_USER_MANAGEMENT_ACCESS.includes(name));
}
