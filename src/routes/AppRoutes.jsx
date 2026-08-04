import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Projects from "../pages/Projects.jsx";
import AIBugGenerator from "../pages/AIBugGenerator.jsx";
import Bugs from "../pages/Bugs.jsx";
import Tasks from "../pages/Tasks.jsx";
import Sprints from "../pages/Sprints.jsx";
import Reports from "../pages/Reports.jsx";
import AIAssistant from "../pages/AIAssistant.jsx";
import AuditLog from "../pages/AuditLog.jsx";
import Settings from "../pages/Settings.jsx";
import UserManagement from "../pages/UserManagement.jsx";
import NotFound from "../pages/NotFound.jsx";
import RoleRoute from "../routes/RoleRoute.jsx"

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes — everything below requires a valid session */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/ai-bug-generator" element={<AIBugGenerator />} />
          <Route path="/bugs" element={<Bugs />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/sprints" element={<Sprints />} />
          {/* <Route path="/reports" element={<Reports />} /> */}
          <Route path="/ai-assistant" element={<AIAssistant />} />
          {/* <Route path="/audit-log" element={<AuditLog />} /> */}
          <Route path="/settings" element={<Settings />} />

          {/* Admin + HR */}
          <Route element={<RoleRoute allowedRoles={["Admin", "HR"]} />}>
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>

          {/* Admin + HR + Lead + QA */}
          <Route element={<RoleRoute allowedRoles={["Admin", "HR", "Lead", "QA"]} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Admin + Lead + QA */}
          <Route element={<RoleRoute allowedRoles={["Admin", "Lead", "QA"]} />}>
            <Route path="/audit-log" element={<AuditLog />} />
          </Route>

        </Route>
      </Route>

      {/* Default + fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

