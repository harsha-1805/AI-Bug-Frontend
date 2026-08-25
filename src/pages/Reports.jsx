import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import PageHeader from "../components/PageHeader.jsx";
import ChartCard from "../components/ChartCard.jsx";
import Select from "../components/Select.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { reportsService } from "../services/reportsService";
import { sprintService } from "../services/sprintService";
import { taskService } from "../services/taskService";
import { getErrorMessage } from "../utils/apiError.js";
import { useProjectFilter } from "../hooks/useProjectFilter";
import { isDateRangeValid } from "../utils/validation.js";

const EXPORT_TYPES = [
  { value: "bugs", label: "Bugs" },
  { value: "tasks", label: "Tasks" },
  { value: "audit", label: "Audit Log" },
];

export default function Reports() {
  // Universal project filter (Navbar dropdown) — "" = all projects. Shared
  // across Tasks/Sprints/Bugs/Dashboard/Reports/AI Assistant via context,
  // see context/ProjectFilterContext.jsx.
  const { selectedProjectId: projectId } = useProjectFilter();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [bugAnalytics, setBugAnalytics] = useState(null);
  const [sprintReport, setSprintReport] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState(null);
  const [aiStats, setAiStats] = useState(null);

  const [exportType, setExportType] = useState("bugs");
  const [exporting, setExporting] = useState(false);

  // Sprint <-> Task cascading filter, scoped to bugs/tasks exports only
  // (the audit log has no sprint/task of its own). Picking a sprint
  // narrows the task list to that sprint; picking a task the other way
  // auto-fills which sprint it belongs to — either order works.
  const [sprintFilter, setSprintFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [reportSprints, setReportSprints] = useState([]);
  const [reportTasks, setReportTasks] = useState([]);

  const loadReports = useCallback(async () => {
    if (!isDateRangeValid(dateFrom, dateTo)) {
      toast.error("'To' date can't be before 'From' date");
      return;
    }
    setLoading(true);
    const filters = { projectId: projectId ? Number(projectId) : undefined, dateFrom, dateTo };
    try {
      const [bugs, sprints, team, ai] = await Promise.all([
        reportsService.getBugAnalytics(filters),
        reportsService.getSprintReport(filters),
        reportsService.getTeamPerformance(filters),
        reportsService.getAiBugStats(filters),
      ]);
      setBugAnalytics(bugs);
      setSprintReport(sprints);
      setTeamPerformance(team);
      setAiStats(ai);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  }, [projectId, dateFrom, dateTo]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Sprint options for the export filter — scoped to the active project.
  // No project selected ("All Projects") means no sprint list to scope
  // to, so the filter stays empty/disabled until one is picked.
  useEffect(() => {
    setSprintFilter("");
    setTaskFilter("");
    if (!projectId) {
      setReportSprints([]);
      return;
    }
    sprintService
      .listSprints({ projectId: Number(projectId) })
      .then(setReportSprints)
      .catch(() => setReportSprints([]));
  }, [projectId]);

  // Task options cascade from the sprint filter: narrows to that
  // sprint's tasks once one is picked, otherwise shows every task in
  // the project so a task can be picked first instead.
  useEffect(() => {
    if (!projectId) {
      setReportTasks([]);
      return;
    }
    taskService
      .listTasks({ projectId: Number(projectId), sprintId: sprintFilter ? Number(sprintFilter) : undefined })
      .then(setReportTasks)
      .catch(() => setReportTasks([]));
  }, [projectId, sprintFilter]);

  // Picking a task directly (before a sprint is chosen) auto-fills
  // which sprint it belongs to, so the two filters stay in sync
  // whichever order they're set in.
  const handleTaskFilterChange = (value) => {
    setTaskFilter(value);
    if (!value) return;
    const task = reportTasks.find((t) => String(t.id) === String(value));
    if (task?.sprint_id) setSprintFilter(String(task.sprint_id));
  };

  const handleExport = async () => {
    if (!isDateRangeValid(dateFrom, dateTo)) {
      toast.error("'To' date can't be before 'From' date");
      return;
    }
    setExporting(true);
    try {
      await reportsService.downloadExport({
        type: exportType,
        projectId: projectId ? Number(projectId) : undefined,
        dateFrom,
        dateTo,
        sprintId: exportType !== "audit" && sprintFilter ? Number(sprintFilter) : undefined,
        taskId: exportType !== "audit" && taskFilter ? Number(taskFilter) : undefined,
      });
      toast.success("Download started");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to export report"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Deep analytics across bugs, sprints, and your team's workload" />

      {/* Filters — project scope now comes from the Navbar's universal
          filter (see components/Navbar.jsx); date range and export
          type stay local to this page. */}
      <div className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="w-full sm:w-44">
          <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="w-full sm:w-44">
          <Input label="To" type="date" min={dateFrom || undefined} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {exportType !== "audit" && (
          <>
            <div className="w-full sm:w-44">
              <label className="label">Sprint</label>
              <Select
                value={sprintFilter}
                disabled={!projectId}
                onChange={(v) => setSprintFilter(v)}
                placeholder={projectId ? "All sprints" : "Select a project first"}
                ariaLabel="Sprint filter"
                options={reportSprints.map((s) => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div className="w-full sm:w-44">
              <label className="label">Task</label>
              <Select
                value={taskFilter}
                disabled={!projectId}
                onChange={handleTaskFilterChange}
                placeholder={projectId ? "All tasks" : "Select a project first"}
                ariaLabel="Task filter"
                options={reportTasks.map((t) => ({ value: t.id, label: t.title }))}
              />
            </div>
          </>
        )}

        <div className="flex w-full items-end gap-2 sm:ml-auto sm:w-auto">
          <div className="w-40">
            <label className="label">Export as Excel</label>
            <Select
              value={exportType}
              onChange={setExportType}
              ariaLabel="Export type"
              options={EXPORT_TYPES}
            />
          </div>
          <Button icon={Download} loading={exporting} onClick={handleExport}>
            Download
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center p-16">
          <Loader label="Loading reports..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bug Analytics */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Bugs by Severity">
              {!bugAnalytics?.by_severity?.length ? (
                <EmptyState icon={BarChart3} title="No bugs in this range" description="Try widening the date filter." />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={bugAnalytics.by_severity}>
                    <CartesianGrid vertical={false} stroke="#eef0f4" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Bugs by Module">
              {!bugAnalytics?.by_module?.length ? (
                <EmptyState icon={BarChart3} title="No module data" description="Tag bugs with a module to see this breakdown." />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={bugAnalytics.by_module}>
                    <CartesianGrid vertical={false} stroke="#eef0f4" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Summary numbers */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-slate-500">Resolution rate</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">
                {bugAnalytics?.resolution_rate_pct ?? 0}%
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Avg. resolution time</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">
                {bugAnalytics?.avg_resolution_hours != null ? `${bugAnalytics.avg_resolution_hours}h` : "—"}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">AI Bug Generator</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">
                {aiStats?.ai_generated_count ?? 0}
                <span className="ml-1 text-sm font-normal text-slate-400">
                  / {aiStats?.manual_count ?? 0} manual
                </span>
              </p>
              {aiStats?.avg_confidence_score != null && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Avg confidence: {aiStats.avg_confidence_score}%
                  {aiStats.low_confidence_count > 0 && ` · ${aiStats.low_confidence_count} need review`}
                </p>
              )}
            </div>
          </div>

          {/* Sprint velocity */}
          <ChartCard title="Sprint Velocity (last 10)">
            {!sprintReport?.sprints?.length ? (
              <EmptyState icon={BarChart3} title="No sprints yet" description="Create a sprint to see velocity here." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sprintReport.sprints}>
                  <CartesianGrid vertical={false} stroke="#eef0f4" />
                  <XAxis dataKey="sprint_name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total_tasks" fill="#e2e8f0" radius={[6, 6, 0, 0]} name="Total tasks" />
                  <Bar dataKey="completed_tasks" fill="#10b981" radius={[6, 6, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Team workload */}
          <ChartCard title="Team Workload">
            {!teamPerformance?.workload?.length ? (
              <EmptyState icon={BarChart3} title="Nothing assigned yet" description="Assign bugs/tasks to see workload distribution." />
            ) : (
              <div className="space-y-3">
                {teamPerformance.workload.map((w) => {
                  const total = w.open_bugs + w.open_tasks;
                  const max = Math.max(...teamPerformance.workload.map((x) => x.open_bugs + x.open_tasks), 1);
                  const pct = Math.round((total / max) * 100);
                  return (
                    <div key={w.user_id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-600">{w.full_name}</span>
                        <span className="font-medium text-slate-700">
                          {w.open_bugs} bugs · {w.open_tasks} tasks
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
