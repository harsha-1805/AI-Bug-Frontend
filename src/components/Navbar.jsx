import { Bell, Settings as SettingsIcon, LogOut, Menu, X, Moon, Sun, FolderKanban } from "lucide-react";
import { useLocation } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Dropdown from "./Dropdown.jsx";
import Select from "./Select.jsx";
import { useAuth } from "../hooks/useAuth";
import { useSidebar } from "../hooks/useSidebar";
import { useTheme } from "../context/ThemeContext.jsx";
import { useProjectFilter } from "../hooks/useProjectFilter";

const TITLES = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/ai-bug-generator": "AI Bug Generator",
  "/bugs": "Bugs",
  "/tasks": "Tasks",
  "/sprints": "Sprints",
  "/releases": "Releases",
  "/reports": "Reports",
  "/ai-assistant": "AI Assistant",
  "/settings": "Settings",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = TITLES[location.pathname] || "BugPilot AI";
  const { mobileOpen, collapsed, isMobile, toggleSidebar } = useSidebar();
  const menuIsOpen = isMobile ? mobileOpen : !collapsed;
  const { isDark, toggleTheme } = useTheme();
  const { selectedProjectId, setSelectedProjectId, projects } = useProjectFilter();

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-white px-4 transition-all duration-300 ease-in-out sm:px-6
        ${collapsed ? "md:ml-20" : "md:ml-64"}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          aria-label={menuIsOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={menuIsOpen}
          aria-controls="app-sidebar"
        >
          {isMobile && mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <h2 className="hidden truncate text-lg font-semibold text-slate-800 sm:block">{title}</h2>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        {/* Universal project filter — selecting a project here scopes
            Tasks, Sprints, Bugs, Dashboard, Reports, and AI Assistant to
            that project until "All Projects" is picked again. Resets to
            "All Projects" on every fresh load/login (not persisted). */}
        <div className="flex min-w-0 items-center gap-1.5">
          <FolderKanban size={16} className="hidden shrink-0 text-slate-400 sm:block" />
          <Select
            className="w-36 sm:w-52"
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            placeholder="All Projects"
            ariaLabel="Universal project filter"
            options={[{ value: "", label: "All Projects" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
          />
        </div>

        <button className="relative shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-50">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-600" />
        </button>

        <Dropdown
          label={<Avatar name={user?.full_name || "User"} size={30} />}
          items={[
            { label: "Settings", icon: SettingsIcon, onClick: () => (window.location.href = "/settings") },
            { label: "Logout", icon: LogOut, onClick: logout },
          ]}
        />
      </div>
    </header>
  );
}
