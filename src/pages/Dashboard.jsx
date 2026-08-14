import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Rocket,
  Sparkles,
  Activity,
  Layers3,
  TrendingUp,
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

/* =========================================================
   WIDGET COLOR THEMES
========================================================= */

const WIDGET_COLORS = {
  bug: {
    border: "border-amber-200",
    header: "bg-gradient-to-r from-amber-50 to-white",
    icon: "bg-amber-100 text-amber-600",
    accent: "bg-amber-500",
  },

  ai: {
    border: "border-violet-200",
    header: "bg-gradient-to-r from-violet-50 to-white",
    icon: "bg-violet-100 text-violet-600",
    accent: "bg-violet-500",
  },

  activity: {
    border: "border-sky-200",
    header: "bg-gradient-to-r from-sky-50 to-white",
    icon: "bg-sky-100 text-sky-600",
    accent: "bg-sky-500",
  },

  modules: {
    border: "border-rose-200",
    header: "bg-gradient-to-r from-rose-50 to-white",
    icon: "bg-rose-100 text-rose-600",
    accent: "bg-rose-500",
  },

  trend: {
    border: "border-emerald-200",
    header: "bg-gradient-to-r from-emerald-50 to-white",
    icon: "bg-emerald-100 text-emerald-600",
    accent: "bg-emerald-500",
  },
};

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  /*
   * Universal project filter.
   * "" means all projects.
   */
  const { selectedProjectId: projectId } =
    useProjectFilter();

  /* =========================================================
     LOAD DASHBOARD
  ========================================================== */

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
     LOADING STATE
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
            flex
            min-h-[320px]
            items-center
            justify-center
            sm:mt-6
          "
        >
          <Loader label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  /* =========================================================
     SUMMARY DATA
  ========================================================== */

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

  /* =========================================================
     STAT CARDS
  ========================================================== */

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

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0 w-full">
      {/* =======================================================
          PAGE HEADER
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
          XL      -> 5
      ======================================================== */}

      <div
        className="
          grid
          min-w-0
          grid-cols-1
          gap-3
          sm:grid-cols-2
          md:grid-cols-3
          xl:grid-cols-5
          sm:gap-4
        "
      >
        {statCards.map((stat) => (
          <ColorfulStatCard
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

          Mobile  -> 1
          Tablet  -> 2
          Desktop -> 3

          Fixed height: 320px
          Header fixed
          Content scrollable
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
          color="bug"
          icon={<Bug size={16} />}
        >
          {totalBugs === 0 ? (
            <EmptyWidget
              title="No bugs reported yet."
              description="Bug status data will appear here when bugs are created."
            />
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
              {/* Pie chart */}

              <div
                className="
                  relative
                  h-36
                  w-36
                  shrink-0
                  sm:h-40
                  sm:w-40
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
                    absolute
                    inset-0
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

              {/* Status list */}

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
                          transition-colors
                          hover:bg-amber-50
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
                              h-2
                              w-2
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
                          {entry.count}

                          <span
                            className="
                              ml-1
                              text-slate-400
                            "
                          >
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
          color="ai"
          icon={<Sparkles size={16} />}
        >
          {ai_insights.length === 0 ? (
            <EmptyWidget
              title="No AI insights available."
              description="AI insights will appear when dashboard data is available."
            />
          ) : (
            <ul className="space-y-3">
              {ai_insights.map(
                (insight, index) => (
                  <li
                    key={index}
                    className="
                      group
                      min-w-0
                      rounded-xl
                      border
                      border-violet-100
                      bg-gradient-to-br
                      from-violet-50
                      via-white
                      to-fuchsia-50
                      px-3
                      py-3
                      shadow-sm
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:border-violet-200
                      hover:shadow-md
                    "
                  >
                    <div className="flex min-w-0 gap-3">
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-violet-100
                          text-violet-600
                        "
                      >
                        <Sparkles size={15} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="
                            break-words
                            whitespace-normal
                            text-sm
                            font-medium
                            leading-5
                            text-slate-700
                            transition-colors
                            group-hover:text-violet-700
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
                      </div>
                    </div>
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
          color="activity"
          icon={<Activity size={16} />}
        >
          {recent_activity.length === 0 ? (
            <EmptyWidget
              title="No activity yet."
              description="Recent project activity will appear here."
            />
          ) : (
            <ul
              className="
                min-w-0
                space-y-2
              "
            >
              {recent_activity.map(
                (item) => (
                  <li
                    key={item.id}
                    className="
                      group
                      min-w-0
                      rounded-lg
                      border
                      border-transparent
                      p-2.5
                      transition-all
                      duration-200
                      hover:border-sky-100
                      hover:bg-sky-50/50
                    "
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        gap-2.5
                      "
                    >
                      <span
                        className="
                          mt-1.5
                          h-2
                          w-2
                          shrink-0
                          rounded-full
                          bg-sky-400
                          ring-4
                          ring-sky-50
                        "
                      />

                      <div className="min-w-0 flex-1">
                        <p
                          className="
                            min-w-0
                            break-words
                            whitespace-normal
                            text-sm
                            leading-5
                            text-slate-600
                            transition-colors
                            group-hover:text-sky-700
                          "
                        >
                          {item.description}
                        </p>

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
                      </div>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </FixedWidget>
      </div>

      {/* =======================================================
          BOTTOM WIDGETS
          
          Mobile  -> 1
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

        <ColorfulChartCard
          title="Top Buggy Modules"
          color="modules"
          icon={<Layers3 size={16} />}
        >
          {top_buggy_modules.length === 0 ? (
            <EmptyWidget
              title="No module data yet."
              description="Module statistics will appear here."
            />
          ) : (
            <div
              className="
                min-w-0
                max-h-[320px]
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
                      className="
                        min-w-0
                        rounded-lg
                        p-2
                        transition-colors
                        hover:bg-rose-50/50
                      "
                    >
                      <div
                        className="
                          mb-1
                          flex
                          min-w-0
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
                            rounded-md
                            bg-rose-50
                            px-2
                            py-0.5
                            font-medium
                            text-rose-600
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
                          bg-rose-50
                        "
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                            bg-gradient-to-r
                            from-rose-500
                            to-pink-500
                            transition-all
                            duration-500
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
        </ColorfulChartCard>

        {/* =====================================================
            BUG TREND
        ====================================================== */}

        <ColorfulChartCard
          title="Bug Trend (30 days)"
          color="trend"
          icon={<TrendingUp size={16} />}
        >
          {bug_trend.length === 0 ? (
            <EmptyWidget
              title="No trend data yet."
              description="Bug trend information will appear here."
            />
          ) : (
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

                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border:
                        "1px solid #e2e8f0",
                      boxShadow:
                        "0 4px 12px rgba(15, 23, 42, 0.08)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Created"
                  />

                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ColorfulChartCard>
      </div>
    </div>
  );
}

/* =========================================================
   COLORFUL STAT CARD
========================================================= */

function ColorfulStatCard({
  icon: Icon,
  iconTone,
  label,
  value,
}) {
  return (
    <div
      className="
        group
        min-w-0
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-md
        sm:p-5
      "
    >
      <div
        className="
          flex
          min-w-0
          items-start
          gap-3
        "
      >
        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            transition-transform
            duration-200
            group-hover:scale-105
            ${iconTone}
          `}
        >
          <Icon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
              break-words
              text-sm
              leading-5
              text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-2
              text-2xl
              font-bold
              leading-none
              text-slate-800
              sm:text-3xl
            "
          >
            {value ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FIXED COLORFUL WIDGET

   - Fixed height: 320px
   - Header does not scroll
   - Content scrolls
   - Responsive width
========================================================= */

function FixedWidget({
  title,
  children,
  action,
  icon,
  color = "bug",
}) {
  const styles =
    WIDGET_COLORS[color] ||
    WIDGET_COLORS.bug;

  return (
    <div
      className={`
        group
        relative
        flex
        h-[320px]
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
        rounded-xl
        border
        bg-white
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
        ${styles.border}
      `}
    >
      {/* Top color accent */}

      <div
        className={`
          absolute
          left-0
          right-0
          top-0
          h-1
          ${styles.accent}
        `}
      />

      {/* Header */}

      <div
        className={`
          flex
          h-[58px]
          shrink-0
          items-center
          justify-between
          gap-3
          border-b
          border-slate-100
          px-4
          pt-1
          sm:px-5
          ${styles.header}
        `}
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2.5
          "
        >
          {icon && (
            <div
              className={`
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                ${styles.icon}
              `}
            >
              {icon}
            </div>
          )}

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
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Scrollable content */}

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

          [scrollbar-width:thin]
          [scrollbar-color:#cbd5e1_transparent]

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

/* =========================================================
   COLORFUL CHART CARD
========================================================= */

function ColorfulChartCard({
  title,
  children,
  icon,
  color = "modules",
}) {
  const styles =
    WIDGET_COLORS[color] ||
    WIDGET_COLORS.modules;

  return (
    <div
      className={`
        group
        relative
        min-w-0
        overflow-hidden
        rounded-xl
        border
        bg-white
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
        ${styles.border}
      `}
    >
      {/* Top accent */}

      <div
        className={`
          absolute
          left-0
          right-0
          top-0
          h-1
          ${styles.accent}
        `}
      />

      {/* Header */}

      <div
        className={`
          flex
          min-w-0
          items-center
          gap-2.5
          border-b
          border-slate-100
          px-4
          py-3.5
          sm:px-5
          sm:py-4
          ${styles.header}
        `}
      >
        {icon && (
          <div
            className={`
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              ${styles.icon}
            `}
          >
            {icon}
          </div>
        )}

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
      </div>

      {/* Content */}

      <div
        className="
          min-w-0
          p-4
          sm:p-5
        "
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY WIDGET
========================================================= */

function EmptyWidget({
  title,
  description,
}) {
  return (
    <div
      className="
        flex
        min-h-[210px]
        flex-col
        items-center
        justify-center
        px-4
        py-8
        text-center
      "
    >
      <div
        className="
          mb-3
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-slate-50
          text-slate-400
        "
      >
        <span className="text-lg">
          —
        </span>
      </div>

      <p
        className="
          text-sm
          font-medium
          text-slate-500
        "
      >
        {title}
      </p>

      {description && (
        <p
          className="
            mt-1
            max-w-xs
            text-xs
            leading-5
            text-slate-400
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}