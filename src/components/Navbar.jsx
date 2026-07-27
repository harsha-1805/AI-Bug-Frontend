import { Bell, Settings as SettingsIcon, LogOut, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Dropdown from "./Dropdown.jsx";
import { useAuth } from "../hooks/useAuth";
import { useSidebar } from "../hooks/useSidebar";

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
  const { openMobile, collapsed, toggleCollapsed } = useSidebar();

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-4 transition-all duration-300 ease-in-out sm:px-6
        ${collapsed ? "md:ml-20" : "md:ml-64"} lg:ml-64`}
    >
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only, opens the off-canvas drawer */}
        <button
          onClick={openMobile}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Collapse toggle — tablet only (desktop stays fully expanded) */}
        <button
          onClick={toggleCollapsed}
          className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-50 md:flex lg:hidden"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-50">
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
