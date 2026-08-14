import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bug, AlertTriangle, CheckCircle2, Clock3, ListChecks, Rocket, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import Loader from "../components/Loader.jsx";
import { dashboardService } from "../services/dashboardService";
import { getErrorMessage } from "../utils/apiError.js";
import { useProjectFilter } from "../hooks/useProjectFilter";

const STATUS_COLORS = {
  Open: "#f59e0b",
  "In Progress": "#0ea5e9",
  Resolved: "#10b981",
  Closed: "#94a3b8",
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  // Universal project filter (Navbar dropdown) — "" = all projects. Shared
  // across Tasks/Sprints/Bugs/Dashboard/Reports/AI Assistant via context,
  // see context/ProjectFilterContext.jsx.
  const { selectedProjectId: projectId } = useProjectFilter();

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getSummary({
        projectId: projectId ? Number(projectId) : undefined,
      });
      setSummary(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  if (loading && !summary) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="An overview of bugs, tasks, and sprints across your projects" />
        <div className="card flex items-center justify-center p-16">
          <Loader label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const { stat_cards: stats, bug_status_breakdown, bug_trend, top_buggy_modules, recent_activity, ai_insights } = summary;
  const totalBugs = bug_status_breakdown.reduce((sum, s) => sum + s.count, 0);

  const statCards = [
    { key: "total", label: "Total Bugs", value: stats.total_bugs, icon: Bug, tone: "text-primary-600 bg-primary-50" },
    { key: "critical", label: "Critical (Open)", value: stats.critical_open, icon: AlertTriangle, tone: "text-red-600 bg-red-50" },
    { key: "resolved", label: "Resolved This Week", value: stats.resolved_this_week, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
    { key: "overdue", label: "Overdue Tasks", value: stats.overdue_tasks, icon: Clock3, tone: "text-amber-600 bg-amber-50" },
    { key: "sprints", label: "Active Sprints", value: stats.active_sprints, icon: Rocket, tone: "text-sky-600 bg-sky-50" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of bugs, tasks, and sprints across your projects"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <StatCard key={stat.key} icon={stat.icon} iconTone={stat.tone} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Bug Status">
          {totalBugs === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No bugs reported yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bug_status_breakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {bug_status_breakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold text-slate-800">{totalBugs}</span>
                  <span className="text-xs text-slate-400">Total</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2">
                {bug_status_breakdown.map((entry) => (
                  <li key={entry.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] }} />
                      {entry.status}
                    </span>
                    <span className="font-medium text-slate-700">
                      {entry.count} ({totalBugs ? Math.round((entry.count / totalBugs) * 100) : 0}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>

        <ChartCard title="AI Insights" action={<Sparkles size={16} className="text-primary-500" />}>
          <ul className="space-y-3">
            {ai_insights.map((insight, i) => (
              <li key={i} className="rounded-xl bg-primary-50/60 px-3 py-2.5">
                <p className="text-sm font-medium text-slate-700">{insight.text}</p>
                <p className="mt-0.5 text-xs text-slate-500">{insight.meta}</p>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Recent Activity">
          {recent_activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No activity yet.</p>
          ) : (
            <ul className="space-y-4">
              {recent_activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-slate-600">{item.description}</span>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top Buggy Modules">
          {top_buggy_modules.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No module data yet.</p>
          ) : (
            <div className="space-y-3">
              {top_buggy_modules.map((mod) => {
                const max = top_buggy_modules[0].count;
                const pct = max ? Math.round((mod.count / max) * 100) : 0;
                return (
                  <div key={mod.module}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{mod.module}</span>
                      <span className="font-medium text-slate-700">{mod.count}</span>
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

        <ChartCard title="Bug Trend (30 days)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bug_trend} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="#eef0f4" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => d.slice(5)}
                interval={Math.max(0, Math.floor(bug_trend.length / 6))}
              />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} dot={false} name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
