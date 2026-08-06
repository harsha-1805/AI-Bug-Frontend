import { Bell, Settings as SettingsIcon, LogOut, Menu, X, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import Dropdown from "./Dropdown.jsx";
import { useAuth } from "../hooks/useAuth";
import { useSidebar } from "../hooks/useSidebar";
import { useTheme } from "../context/ThemeContext.jsx";

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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-4 transition-all duration-300 ease-in-out sm:px-6
        ${collapsed ? "md:ml-20" : "md:ml-64"}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          aria-label={menuIsOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={menuIsOpen}
          aria-controls="app-sidebar"
        >
          {isMobile && mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark / Light theme toggle — excluded from sign-in/sign-up pages which use AuthLayout */}
        {/* <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button> */}

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
