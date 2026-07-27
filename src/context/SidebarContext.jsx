import { createContext, useEffect, useState } from "react";

export const SidebarContext = createContext(null);

/**
 * Drives the responsive sidebar behavior across breakpoints:
 * - Desktop/tablet (md+): `collapsed` toggles between full (w-64) and
 *   icon-only (w-20) navigation.
 * - Mobile (< md): `mobileOpen` toggles the off-canvas drawer + overlay.
 *
 * Lifted to a context (instead of DashboardLayout props) so both Sidebar
 * and Navbar (which owns the hamburger button) can read/update it
 * without prop drilling through DashboardLayout.
 */
export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = (event) => {
      setIsMobile(event.matches);
      if (!event.matches) setMobileOpen(false);
    };

    updateViewport(mediaQuery);
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const value = {
    mobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
    toggleMobile: () => setMobileOpen((prev) => !prev),
    collapsed,
    toggleCollapsed: () => setCollapsed((prev) => !prev),
    isMobile,
    toggleSidebar: () => {
      if (isMobile) {
        setMobileOpen((prev) => !prev);
      } else {
        setCollapsed((prev) => !prev);
      }
    },
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
