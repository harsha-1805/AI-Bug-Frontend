import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import AIAssistantWidget from "../components/AIAssistantWidget.jsx";
import { SidebarProvider } from "../context/SidebarContext.jsx";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { ProjectFilterProvider } from "../context/ProjectFilterContext.jsx";
import { AIChatProvider } from "../context/AIChatContext.jsx";
import { useSidebar } from "../hooks/useSidebar";

function DashboardShell() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <Navbar />
      <main
        className={`ml-0 mt-16 min-h-[calc(100vh-4rem)] p-4 transition-all duration-300 ease-in-out sm:p-6
          ${collapsed ? "md:ml-20" : "md:ml-64"}`}
      >
        <div className="flex-1 pb-[50px]">
          <Outlet />
        </div>
      </main>
      <AIAssistantWidget />
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <ThemeProvider>
      <ProjectFilterProvider>
        <AIChatProvider>
          <SidebarProvider>
            <DashboardShell />
          </SidebarProvider>
        </AIChatProvider>
      </ProjectFilterProvider>
    </ThemeProvider>
  );
}
