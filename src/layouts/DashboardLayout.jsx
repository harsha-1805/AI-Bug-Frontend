import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import { SidebarProvider } from "../context/SidebarContext.jsx";
import { useSidebar } from "../hooks/useSidebar";

function DashboardShell() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <Navbar />
      <main
        className={`ml-0 mt-16 min-h-[calc(100vh-4rem)] p-4 transition-all duration-300 ease-in-out sm:p-6
          ${collapsed ? "md:ml-20" : "md:ml-64"} lg:ml-64`}
      >
        <Outlet />
      </main>
    </div>
  );
}

/**
 * Shared shell for every authenticated page: responsive Sidebar (fixed
 * on desktop, collapsible on tablet, off-canvas drawer on mobile) +
 * fixed Navbar, with only the routed page content scrolling underneath.
 * New pages automatically get this layout by nesting under the route
 * that renders <DashboardLayout /> (see routes/AppRoutes.jsx).
 */
export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardShell />
    </SidebarProvider>
  );
}
