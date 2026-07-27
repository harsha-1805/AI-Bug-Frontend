import { Bug, AlertTriangle, CheckCircle2, FolderOpen, Clock, Sparkles } from "lucide-react";
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
  BarChart,
  Bar,
} from "recharts";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import {
  statCards,
  bugStatusBreakdown,
  bugTrend,
  topBuggyModules,
  recentActivity,
  aiInsights,
} from "../utils/dummyData";

const STAT_ICONS = {
  total: { icon: Bug, tone: "text-primary-600 bg-primary-50" },
  critical: { icon: AlertTriangle, tone: "text-red-600 bg-red-50" },
  resolved: { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  open: { icon: FolderOpen, tone: "text-amber-600 bg-amber-50" },
  inProgress: { icon: Clock, tone: "text-sky-600 bg-sky-50" },
};

export default function Dashboard() {
  const totalBugs = bugStatusBreakdown.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="An overview of bugs, trends, and AI insights across all projects" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <StatCard
            key={stat.key}
            icon={STAT_ICONS[stat.key].icon}
            iconTone={STAT_ICONS[stat.key].tone}
            label={stat.label}
            value={stat.value}
            delta={`${stat.delta} vs last week`}
            deltaDirection={stat.direction}
          />
        ))}
      </div>

      {/* Row 2: Bug status, AI insights, recent activity */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Bug Status">
          <div className="flex items-center gap-6">
            <div className="relative h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bugStatusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {bugStatusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
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
              {bugStatusBreakdown.map((entry) => (
                <li key={entry.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="font-medium text-slate-700">
                    {entry.value} ({Math.round((entry.value / totalBugs) * 100)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>

        <ChartCard title="AI Insights" action={<Sparkles size={16} className="text-primary-500" />}>
          <ul className="space-y-3">
            {aiInsights.map((insight) => (
              <li key={insight.id} className="rounded-xl bg-primary-50/60 px-3 py-2.5">
                <p className="text-sm font-medium text-slate-700">{insight.text}</p>
                <p className="mt-0.5 text-xs text-slate-500">{insight.meta}</p>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Recent Activity">
          <ul className="space-y-4">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-start justify-between text-sm">
                <span className="text-slate-600">{item.text}</span>
                <span className="whitespace-nowrap text-xs text-slate-400">{item.time}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Row 3: Top buggy modules + bug trend */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top Buggy Modules">
          <div className="space-y-3">
            {topBuggyModules.map((mod) => {
              const max = topBuggyModules[0].count;
              const pct = Math.round((mod.count / max) * 100);
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
        </ChartCard>

        <ChartCard title="Bug Trend">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bugTrend} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6e6ee", fontSize: 12 }} />
              <Line type="monotone" dataKey="created" stroke="#7c3aed" strokeWidth={2} dot={false} name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
