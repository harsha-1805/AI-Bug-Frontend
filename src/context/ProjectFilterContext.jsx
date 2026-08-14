import { createContext, useCallback, useEffect, useState } from "react";
import { projectService } from "../services/projectService";

export const ProjectFilterContext = createContext(null);

/**
 * Universal "current project" filter, selected from the dropdown in the
 * Navbar. Pages that show project-scoped data (Tasks, Sprints, Bugs,
 * Dashboard, Reports, AI Assistant) read `selectedProjectId` from here
 * instead of keeping their own local filter state, so picking a project
 * once in the Navbar scopes the whole app to it until "All Projects" is
 * picked again.
 *
 * `selectedProjectId` is "" for "All Projects". Intentionally NOT
 * persisted to localStorage — it resets to "All Projects" on every fresh
 * load/login, per product decision.
 *
 * The project list itself is also fetched once here (already team-scoped
 * server-side — see GET /api/v1/projects -> project_access.
 * accessible_project_ids) so the Navbar dropdown doesn't need its own
 * fetch. Pages that need the list for other purposes (e.g. populating a
 * "create task" form) keep their own existing fetch — this context only
 * centralizes the *filter* concern.
 */
export function ProjectFilterProvider({ children }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const data = await projectService.listProjects({ pageSize: 100 });
      setProjects(data.items || []);
    } catch {
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const selectedProject = projects.find((p) => String(p.id) === String(selectedProjectId)) || null;

  const value = {
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    isAllProjects: !selectedProjectId,
    projects,
    projectsLoading,
    refreshProjects: loadProjects,
  };

  return <ProjectFilterContext.Provider value={value}>{children}</ProjectFilterContext.Provider>;
}
