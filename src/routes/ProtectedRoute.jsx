import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/Loader.jsx";

/**
 * Guards all routes nested under it. Redirects to /login when the user
 * is not authenticated, and shows a loader while the initial /me check
 * (see AuthContext.getCurrentUser) is in flight so we don't flash the
 * login page for an already-logged-in user on refresh.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <Loader label="Checking your session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
