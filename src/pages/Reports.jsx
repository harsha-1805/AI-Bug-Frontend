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

        <div className="flex w-full items-end gap-2 sm:ml-auto sm:w-auto">
          <div className="w-40">
            <label className="label">Export as CSV</label>
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
