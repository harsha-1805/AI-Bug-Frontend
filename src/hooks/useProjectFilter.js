import { useContext } from "react";
import { ProjectFilterContext } from "../context/ProjectFilterContext.jsx";

export function useProjectFilter() {
  const ctx = useContext(ProjectFilterContext);
  if (!ctx) {
    throw new Error("useProjectFilter must be used within a ProjectFilterProvider");
  }
  return ctx;
}
