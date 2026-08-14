import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Rocket,
  Sparkles,
} from "lucide-react";

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

  const { selectedProjectId: projectId } =
    useProjectFilter();

  const loadSummary = useCallback(async () => {
    setLoading(true);

    try {
      const data =
        await dashboardService.getSummary({
          projectId: projectId
            ? Number(projectId)
            : undefined,
        });

      setSummary(data);
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to load dashboard"
        )
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading && !summary) {
    return (
      <div className="min-w-0 w-full">
        <PageHeader
          title="Dashboard"
          subtitle="An overview of bugs, tasks, and sprints across your projects"
        />

        <div
          className="
            card
            mt-4
            flex min-h-[320px]
            items-center justify-center
            sm:mt-6
          "
        >
          <Loader label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const {
    stat_cards: stats,
    bug_status_breakdown = [],
    bug_trend = [],
    top_buggy_modules = [],
    recent_activity = [],
    ai_insights = [],
  } = summary;

  const totalBugs =
    bug_status_breakdown.reduce(
      (sum, item) => sum + item.count,
      0
    );

  const statCards = [
    {
      key: "total",
      label: "Total Bugs",
      value: stats.total_bugs,
      icon: Bug,
      tone: "text-primary-600 bg-primary-50",
    },
    {
      key: "critical",
      label: "Critical (Open)",
      value: stats.critical_open,
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50",
    },
    {
      key: "resolved",
      label: "Resolved This Week",
      value: stats.resolved_this_week,
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      key: "overdue",
      label: "Overdue Tasks",
      value: stats.overdue_tasks,
      icon: Clock3,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      key: "sprints",
      label: "Active Sprints",
      value: stats.active_sprints,
      icon: Rocket,
      tone: "text-sky-600 bg-sky-50",
    },
  ];

  return (
    <div className="min-w-0 w-full">
      {/* =======================================================
          HEADER
      ======================================================== */}

      <PageHeader
        title="Dashboard"
        subtitle="An overview of bugs, tasks, and sprints across your projects"
      />

      {/* =======================================================
          STAT CARDS

          Mobile  -> 1
          Small   -> 2
          Medium  -> 3
          Large   -> 5
      ======================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-3
          xl:grid-cols-5
          sm:gap-4
        "
      >
        {statCards.map((stat) => (
          <StatCard
            key={stat.key}
            icon={stat.icon}
            iconTone={stat.tone}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      {/* =======================================================
          TOP THREE WIDGETS

          These widgets KEEP THE SAME HEIGHT.

          Mobile -> 1 column
          Tablet -> 2 columns
          Desktop -> 3 columns

          The CONTENT scrolls.
          The HEADER stays visible.
      ======================================================== */}

      <div
        className="
          mt-6
          grid
          min-w-0
          grid-cols-1
          gap-4
          md:grid-cols-2
          lg:grid-cols-3
        "
      >
        {/* =====================================================
            BUG STATUS
        ====================================================== */}

        <FixedWidget
          title="Bug Status"
          action={null}
        >
          {totalBugs === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No bugs reported yet.
            </p>
          ) : (
            <div
              className="
                flex
                min-w-0
                flex-col
                items-center
                gap-5
                sm:gap-6
                lg:flex-row
                lg:items-center
              "
            >
              {/* PIE */}

              <div
                className="
                  relative
                  h-36 w-36
                  shrink-0
                  sm:h-40 sm:w-40
                "
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={bug_status_breakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={48}
                      outerRadius={66}
                      paddingAngle={2}
                    >
                      {bug_status_breakdown.map(
                        (entry) => (
                          <Cell
                            key={entry.status}
                            fill={
                              STATUS_COLORS[
                                entry.status
                              ] || "#94a3b8"
                            }
                            stroke="none"
                          />
                        )
                      )}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div
                  className="
                    pointer-events-none
                    absolute inset-0
                    flex
                    flex-col
                    items-center
                    justify-center
                  "
                >
                  <span
                    className="
                      text-xl
                      font-semibold
                      text-slate-800
                    "
                  >
                    {totalBugs}
                  </span>

                  <span
                    className="
                      text-xs
                      text-slate-400
                    "
                  >
                    Total
                  </span>
                </div>
              </div>

              {/* STATUS LIST */}

              <ul
                className="
                  w-full
                  min-w-0
                  space-y-2
                "
              >
                {bug_status_breakdown.map(
                  (entry) => {
                    const percentage = totalBugs
                      ? Math.round(
                          (entry.count /
                            totalBugs) *
                            100
                        )
                      : 0;

                    return (
                      <li
                        key={entry.status}
                        className="
                          flex
                          min-w-0
                          items-center
                          justify-between
                          gap-2
                          rounded-lg
                          px-2
                          py-1.5
                          text-sm
                          hover:bg-slate-50
                        "
                      >
                        <span
                          className="
                            flex
                            min-w-0
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              h-2 w-2
                              shrink-0
                              rounded-full
                            "
                            style={{
                              backgroundColor:
                                STATUS_COLORS[
                                  entry.status
                                ] || "#94a3b8",
                            }}
                          />

                          <span
                            className="
                              min-w-0
                              break-words
                              text-slate-600
                            "
                          >
                            {entry.status}
                          </span>
                        </span>

                        <span
                          className="
                            shrink-0
                            font-medium
                            text-slate-700
                          "
                        >
                          {entry.count}{" "}
                          <span className="text-slate-400">
                            ({percentage}%)
                          </span>
                        </span>
                      </li>
                    );
                  }
                )}
              </ul>
            </div>
          )}
        </FixedWidget>

        {/* =====================================================
            AI INSIGHTS
        ====================================================== */}

        <FixedWidget
          title="AI Insights"
          action={
            <Sparkles
              size={16}
              className="text-primary-500"
            />
          }
        >
          {ai_insights.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No AI insights available.
            </p>
          ) : (
            <ul className="space-y-3">
              {ai_insights.map(
                (insight, index) => (
                  <li
                    key={index}
                    className="
                      min-w-0
                      rounded-xl
                      border
                      border-primary-100
                      bg-primary-50/60
                      px-3
                      py-2.5
                      transition-colors
                      hover:bg-primary-50
                    "
                  >
                    <p
                      className="
                        break-words
                        whitespace-normal
                        text-sm
                        font-medium
                        leading-5
                        text-slate-700
                      "
                    >
                      {insight.text}
                    </p>

                    {insight.meta && (
                      <p
                        className="
                          mt-1
                          break-words
                          whitespace-normal
                          text-xs
                          leading-5
                          text-slate-500
                        "
                      >
                        {insight.meta}
                      </p>
                    )}
                  </li>
                )
              )}
            </ul>
          )}
        </FixedWidget>

        {/* =====================================================
            RECENT ACTIVITY
        ====================================================== */}

        <FixedWidget
          title="Recent Activity"
        >
          {recent_activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No activity yet.
            </p>
          ) : (
            <ul
              className="
                min-w-0
                space-y-4
              "
            >
              {recent_activity.map(
                (item) => (
                  <li
                    key={item.id}
                    className="
                      min-w-0
                      border-b
                      border-slate-100
                      pb-4
                      last:border-0
                      last:pb-0
                    "
                  >
                    {/* Activity text */}

                    <p
                      className="
                        min-w-0
                        break-words
                        whitespace-normal
                        text-sm
                        leading-5
                        text-slate-600
                      "
                    >
                      {item.description}
                    </p>

                    {/* Date */}

                    <p
                      className="
                        mt-1.5
                        break-words
                        text-xs
                        leading-4
                        text-slate-400
                      "
                    >
                      {new Date(
                        item.created_at
                      ).toLocaleString()}
                    </p>
                  </li>
                )
              )}
            </ul>
          )}
        </FixedWidget>
      </div>

      {/* =======================================================
          BOTTOM WIDGETS

          Mobile -> 1
          Desktop -> 2
      ======================================================== */}

      <div
        className="
          mt-6
          grid
          min-w-0
          grid-cols-1
          gap-4
          lg:grid-cols-2
        "
      >
        {/* =====================================================
            TOP BUGGY MODULES
        ====================================================== */}

        <ChartCard title="Top Buggy Modules">
          {top_buggy_modules.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No module data yet.
            </p>
          ) : (
            <div
              className="
                max-h-[320px]
                min-w-0
                space-y-3
                overflow-y-auto
                pr-1
              "
            >
              {top_buggy_modules.map(
                (mod) => {
                  const max =
                    top_buggy_modules[0]
                      ?.count || 0;

                  const pct = max
                    ? Math.round(
                        (mod.count / max) *
                          100
                      )
                    : 0;

                  return (
                    <div
                      key={mod.module}
                      className="min-w-0"
                    >
                      <div
                        className="
                          mb-1
                          flex
                          items-start
                          justify-between
                          gap-3
                          text-sm
                        "
                      >
                        <span
                          className="
                            min-w-0
                            break-words
                            text-slate-600
                          "
                        >
                          {mod.module}
                        </span>

                        <span
                          className="
                            shrink-0
                            font-medium
                            text-slate-700
                          "
                        >
                          {mod.count}
                        </span>
                      </div>

                      <div
                        className="
                          h-2
                          w-full
                          overflow-hidden
                          rounded-full
                          bg-slate-100
                        "
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                            bg-primary-500
                          "
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </ChartCard>

        {/* =====================================================
            BUG TREND
        ====================================================== */}

        <ChartCard title="Bug Trend (30 days)">
          <div
            className="
              h-[220px]
              w-full
              min-w-0
              sm:h-[230px]
            "
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={bug_trend}
                margin={{
                  left: -20,
                  right: 5,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#eef0f4"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d) =>
                    d.slice(5)
                  }
                  interval={Math.max(
                    0,
                    Math.floor(
                      bug_trend.length / 6
                    )
                  )}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Created"
                />

                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* =========================================================
   FIXED WIDGET

   IMPORTANT:
   Header does NOT scroll.
   Only content scrolls.

   All three widgets have the same height.
========================================================= */

function FixedWidget({
  title,
  children,
  action,
}) {
  return (
    <div
      className="
        flex
        h-[320px]
        min-w-0
        min-h-0
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* =====================================================
          FIXED HEADER
      ====================================================== */}

      <div
        className="
          flex
          h-[58px]
          shrink-0
          items-center
          justify-between
          gap-3
          border-b
          border-slate-100
          px-4
          sm:px-5
        "
      >
        <h2
          className="
            min-w-0
            truncate
            text-sm
            font-semibold
            text-slate-800
            sm:text-[15px]
          "
        >
          {title}
        </h2>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* =====================================================
          SCROLLABLE CONTENT

          Fixed height:
          320px total

          Header:
          58px

          Content:
          remaining height
      ====================================================== */}

      <div
        className="
          min-h-0
          min-w-0
          flex-1
          overflow-x-hidden
          overflow-y-auto
          px-4
          py-4
          sm:px-5
          sm:py-4

          /* Firefox */
          [scrollbar-width:thin]
          [scrollbar-color:#cbd5e1_transparent]

          /* WebKit */
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-slate-300
          hover:[&::-webkit-scrollbar-thumb]:bg-slate-400
        "
      >
        {children}
      </div>
    </div>
  );
}