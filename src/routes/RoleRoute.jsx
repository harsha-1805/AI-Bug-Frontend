import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  const roleNames = (user?.roles?.length
    ? user.roles
    : [user?.role]
  )
    .filter(Boolean)
    .map((r) => r.name);

  const hasAccess = roleNames.some((role) =>
    allowedRoles.includes(role)
  );

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}