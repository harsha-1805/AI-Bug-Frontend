import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Bug,
  ListChecks,
  Rocket,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  Bot,
  Wand2,
  Users,
  ScrollText,
  X,
} from "lucide-react";
import Avatar from "./Avatar.jsx";
import { useAuth } from "../hooks/useAuth";
import { useSidebar } from "../hooks/useSidebar";
import { canManageUsers, canViewAuditLog } from "../utils/rbac";

// AI Bug Generator is flagged `highlight: true` so it visually stands out
// as the main Phase 2 feature.
//
// Releases module removed from the nav per team decision — the route
// and backend data still exist, this is purely a visibility change.
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/ai-bug-generator", label: "AI Bug Generator", icon: Wand2, highlight: true },
  { to: "/bugs", label: "Bugs", icon: Bug },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/sprints", label: "Sprints", icon: Rocket },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  // Audit Log: QA, Lead ("Project Manager") and Admin only — see
  // utils/rbac.js canViewAuditLog, mirroring "audit.view" server-side.
  { to: "/audit-log", label: "Audit Log", icon: ScrollText, auditOnly: true },
  // Phase 3/4: only rendered for roles with user-management access — see
  // the `.filter()` below. Placed right before Settings so it reads as
  // an admin/workspace-level item, not a personal one.
  { to: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { mobileOpen, closeMobile, collapsed, isMobile } = useSidebar();

  // Icon-only rail on tablet when collapsed; full labels everywhere else.
  const showLabels = isMobile || !collapsed;

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !canManageUsers(user)) return false;
    if (item.auditOnly && !canViewAuditLog(user)) return false;
    return true;
  });

  return (
    <>
      {/* Mobile overlay backdrop — only rendered (and only visible below
          md) while the drawer is open. Tapping it closes the drawer. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-white
          transition-all duration-300 ease-in-out
          w-64 ${collapsed ? "md:w-20" : "md:w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-5">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Bot size={18} />
            </div>
            {showLabels && (
              <span className="truncate text-base font-semibold text-slate-800">BugPilot AI</span>
            )}
          </div>
          {/* Close button — mobile drawer only */}
          <button
            onClick={closeMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          {visibleNavItems.map(({ to, label, icon: Icon, highlight }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobile}
              title={showLabels ? undefined : label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : highlight
                    ? "text-primary-700 bg-primary-50/60 hover:bg-primary-50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {showLabels && (
                <span className="flex-1 truncate">{label}</span>
              )}
              {showLabels && highlight && (
                <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  AI
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User / logout */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={user?.full_name || "User"} size={36} />
            {showLabels && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{user?.full_name || "User"}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || ""}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title={showLabels ? undefined : "Logout"}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut size={18} className="shrink-0" />
            {showLabels && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}

