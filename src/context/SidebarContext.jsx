import { createContext, useState } from "react";

export const SidebarContext = createContext(null);

/**
 * Drives the responsive sidebar behavior across breakpoints:
 * - Desktop (lg+): sidebar is always fixed and expanded, this state is ignored.
 * - Tablet (md): `collapsed` toggles between full (w-64) and icon-only (w-20).
 * - Mobile (< md): `mobileOpen` toggles the off-canvas drawer + overlay.
 *
 * Lifted to a context (instead of DashboardLayout props) so both Sidebar
 * and Navbar (which owns the hamburger button) can read/update it
 * without prop drilling through DashboardLayout.
 */
export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const value = {
    mobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
    toggleMobile: () => setMobileOpen((prev) => !prev),
    collapsed,
    toggleCollapsed: () => setCollapsed((prev) => !prev),
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
