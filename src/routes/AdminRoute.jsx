import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { canManageUsers } from "../utils/rbac";

/**
 * Nested inside ProtectedRoute, so by the time this renders we already
 * know the user is authenticated. This just adds the role check on top.
 * The backend enforces the real permission check on every request
 * regardless — this is purely so an unauthorized role doesn't even see
 * the User Management screen flash before an API call 403s.
 */
export default function AdminRoute() {
  const { user } = useAuth();

  if (!canManageUsers(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
