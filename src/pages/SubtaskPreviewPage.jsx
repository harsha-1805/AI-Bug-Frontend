import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, Circle, Clock3 } from "lucide-react";

import Badge from "../components/Badge.jsx";
import Avatar from "../components/Avatar.jsx";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";

import { subtaskService } from "../services/subtaskService";
import { taskService } from "../services/taskService";
import { getErrorMessage } from "../utils/apiError.js";

/**
 * Standalone, read-only Subtask preview page.
 *
 * Responsive layout:
 * - Mobile: single column
 * - Tablet: two-column information layout
 * - Desktop: four-column information layout
 * - Large desktop: max-w-7xl
 *
 * Styling:
 * - Colored header
 * - Status-specific colors
 * - Colored information cards
 * - Colored section accents
 * - Responsive spacing
 * - Hover/focus states
 */
export default function SubtaskPreviewPage() {
  const { subtaskId } = useParams();
  const navigate = useNavigate();

  const [subtask, setSubtask] = useState(null);
  const [parentTaskTitle, setParentTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setNotFound(false);

    subtaskService
      .getSubtask(subtaskId)
      .then((data) => {
        if (!active) return;

        setSubtask(data);

        if (data?.task_id) {
          taskService
            .getTask(data.task_id)
            .then((task) => {
              if (active) {
                setParentTaskTitle(task?.title || "");
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (!active) return;

        setNotFound(true);

        toast.error(
          getErrorMessage(err, "Failed to load subtask")
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [subtaskId]);

  /*
   * Status styling.
   */
  const statusStyle = getStatusStyle(subtask?.status);

  return (
    <div className="min-h-full w-full bg-slate-50">
      <div
        className="
          mx-auto w-full max-w-7xl
          px-3 py-4
          sm:px-5 sm:py-6
          lg:px-8
        "
      >
        {/* =========================================================
            BACK BUTTON
        ========================================================== */}
        <div className="mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              inline-flex min-h-9 items-center gap-2
              rounded-lg
              border border-slate-200
              bg-white
              px-3 py-2
              text-sm font-semibold
              text-slate-600
              shadow-sm
              transition-all duration-200
              hover:border-primary-200
              hover:bg-primary-50
              hover:text-primary-600
              hover:shadow
              active:scale-[0.98]
              focus:outline-none
              focus:ring-2
              focus:ring-primary-500/20
            "
          >
            <ArrowLeft size={17} />
            <span>Back</span>
          </button>
        </div>

        {/* =========================================================
            LOADING
        ========================================================== */}
        {loading ? (
          <div
            className="
              flex min-h-[360px]
              items-center justify-center
              rounded-xl
              border border-slate-200
              bg-white
              shadow-sm
            "
          >
            <Loader label="Loading subtask..." />
          </div>
        ) : notFound || !subtask ? (
          <div
            className="
              rounded-xl
              border border-slate-200
              bg-white
              p-6
              shadow-sm
              sm:p-10
            "
          >
            <EmptyState
              title="Subtask not found"
              description="This subtask may have been deleted or you no longer have access to it."
            />
          </div>
        ) : (
          <div
            className="
              overflow-hidden
              rounded-xl
              border border-slate-200
              bg-white
              shadow-sm
            "
          >
            {/* =====================================================
                HEADER
            ====================================================== */}
            <div
              className="
                border-b border-slate-200
                bg-gradient-to-r
                from-primary-50
                via-white
                to-white
                px-4 py-5
                sm:px-6 sm:py-6
                lg:px-8
              "
            >
              <div
                className="
                  flex flex-col gap-5
                  lg:flex-row
                  lg:items-start
                  lg:justify-between
                "
              >
                {/* Title */}
                <div className="min-w-0 flex-1">
                  {parentTaskTitle && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />

                      <p
                        className="
                          min-w-0
                          break-words
                          text-xs font-semibold
                          uppercase tracking-wide
                          text-primary-600
                        "
                      >
                        Subtask of {parentTaskTitle}
                      </p>
                    </div>
                  )}

                  <h1
                    className="
                      break-words
                      text-xl font-bold
                      leading-tight
                      text-slate-800
                      sm:text-2xl
                      lg:text-3xl
                    "
                  >
                    {subtask.title}
                  </h1>
                </div>

                {/* Header Status */}
                <div className="flex shrink-0 flex-wrap gap-2">
                  <StatusPill status={subtask.status} />
                </div>
              </div>
            </div>

            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}
            <div
              className="
                px-4 py-5
                sm:px-6 sm:py-7
                lg:px-8 lg:py-8
              "
            >
              {/* ===================================================
                  INFORMATION CARDS
              ==================================================== */}
              <div
                className="
                  grid grid-cols-1 gap-3
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >
                {/* Status */}
                <InfoCard
                  label="Status"
                  accent={statusStyle.cardAccent}
                  background={statusStyle.cardBackground}
                >
                  <StatusPill status={subtask.status} />
                </InfoCard>

                {/* Assignee */}
                <InfoCard
                  label="Assignee"
                  accent="blue"
                  background="blue"
                >
                  {subtask.assignee ? (
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        name={subtask.assignee.full_name}
                        size={32}
                      />

                      <span
                        className="
                          min-w-0 break-words
                          text-sm font-semibold
                          text-slate-700
                        "
                      >
                        {subtask.assignee.full_name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Circle
                        size={17}
                        className="text-slate-300"
                      />

                      <span className="text-sm text-slate-500">
                        Unassigned
                      </span>
                    </div>
                  )}
                </InfoCard>

                {/* Reporter */}
                <InfoCard
                  label="Reported by"
                  accent="violet"
                  background="violet"
                >
                  {subtask.reporter ? (
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        name={subtask.reporter.full_name}
                        size={32}
                      />

                      <span
                        className="
                          min-w-0 break-words
                          text-sm font-semibold
                          text-slate-700
                        "
                      >
                        {subtask.reporter.full_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      —
                    </span>
                  )}
                </InfoCard>

                {/* Parent task */}
                <InfoCard
                  label="Parent task"
                  accent="amber"
                  background="amber"
                >
                  {parentTaskTitle ? (
                    <div className="flex min-w-0 items-start gap-2">
                      <div
                        className="
                          mt-0.5 flex h-7 w-7
                          shrink-0 items-center
                          justify-center
                          rounded-lg
                          bg-amber-100
                          text-amber-600
                        "
                      >
                        <Clock3 size={15} />
                      </div>

                      <span
                        className="
                          min-w-0 break-words
                          text-sm font-semibold
                          text-slate-700
                        "
                      >
                        {parentTaskTitle}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      —
                    </span>
                  )}
                </InfoCard>
              </div>

              {/* ===================================================
                  DIVIDER
              ==================================================== */}
              <div className="my-7 border-t border-slate-200 sm:my-8" />

              {/* ===================================================
                  DETAILS
              ==================================================== */}
              <div
                className="
                  grid grid-cols-1 gap-6
                  lg:grid-cols-2
                  lg:gap-8
                "
              >
                {/* Subtask details */}
                <ContentSection
                  title="Subtask details"
                  accent="primary"
                >
                  <div className="space-y-4">
                    <DetailRow
                      label="Status"
                      value={
                        <StatusPill
                          status={subtask.status}
                          small
                        />
                      }
                    />

                    <DetailRow
                      label="Assignee"
                      value={
                        subtask.assignee?.full_name ||
                        "Unassigned"
                      }
                    />

                    <DetailRow
                      label="Reported by"
                      value={
                        subtask.reporter?.full_name || "—"
                      }
                    />

                    <DetailRow
                      label="Parent task"
                      value={parentTaskTitle || "—"}
                    />
                  </div>
                </ContentSection>

                {/* Summary */}
                <ContentSection
                  title="Summary"
                  accent="blue"
                >
                  <div className="space-y-4">
                    <div
                      className="
                        rounded-xl
                        border border-blue-100
                        bg-blue-50/60
                        p-4
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="
                            flex h-9 w-9
                            shrink-0 items-center
                            justify-center
                            rounded-lg
                            bg-blue-100
                            text-blue-600
                          "
                        >
                          <CheckCircle2 size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            Read-only preview
                          </p>

                          <p
                            className="
                              mt-1
                              text-sm leading-6
                              text-blue-700/80
                            "
                          >
                            This page displays the details
                            of the selected subtask.
                          </p>
                        </div>
                      </div>
                    </div>

                    {parentTaskTitle && (
                      <div
                        className="
                          rounded-lg
                          border border-slate-200
                          bg-slate-50
                          px-4 py-3
                        "
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Parent task
                        </p>

                        <p
                          className="
                            mt-1
                            break-words
                            text-sm font-semibold
                            text-slate-700
                          "
                        >
                          {parentTaskTitle}
                        </p>
                      </div>
                    )}
                  </div>
                </ContentSection>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STATUS CONFIG
========================================================= */

function getStatusStyle(status) {
  switch (status) {
    case "Done":
      return {
        cardAccent: "emerald",
        cardBackground: "emerald",
      };

    case "In Progress":
      return {
        cardAccent: "blue",
        cardBackground: "blue",
      };

    case "To Do":
    default:
      return {
        cardAccent: "slate",
        cardBackground: "slate",
      };
  }
}

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({ status, small = false }) {
  const styles = {
    Done: {
      wrapper:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      icon: <CheckCircle2 size={small ? 13 : 15} />,
    },

    "In Progress": {
      wrapper:
        "border-blue-200 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
      icon: <Clock3 size={small ? 13 : 15} />,
    },

    "To Do": {
      wrapper:
        "border-slate-200 bg-slate-50 text-slate-600",
      dot: "bg-slate-400",
      icon: <Circle size={small ? 13 : 15} />,
    },
  };

  const style =
    styles[status] || styles["To Do"];

  return (
    <div
      className={`
        inline-flex items-center gap-2
        rounded-full border
        font-semibold
        ${small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}
        ${style.wrapper}
      `}
    >
      <span
        className={`
          h-2 w-2 shrink-0 rounded-full
          ${style.dot}
        `}
      />

      {style.icon}

      <span>{status || "To Do"}</span>
    </div>
  );
}

/* =========================================================
   INFORMATION CARD
========================================================= */

function InfoCard({
  label,
  children,
  accent = "blue",
  background = "blue",
}) {
  const accentStyles = {
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-400",
    primary: "bg-primary-500",
  };

  const backgroundStyles = {
    blue: "from-blue-50/70 to-white",
    violet: "from-violet-50/70 to-white",
    amber: "from-amber-50/70 to-white",
    emerald: "from-emerald-50/70 to-white",
    slate: "from-slate-50 to-white",
    primary: "from-primary-50/70 to-white",
  };

  return (
    <div
      className={`
        group relative min-w-0
        overflow-hidden
        rounded-xl
        border border-slate-200
        bg-gradient-to-br
        p-4
        shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-md
        ${backgroundStyles[background]}
      `}
    >
      {/* Colored accent */}
      <div
        className={`
          absolute left-0 top-0
          h-full w-1
          ${accentStyles[accent]}
        `}
      />

      <p
        className="
          mb-3
          pl-1
          text-[11px] font-semibold
          uppercase tracking-wider
          text-slate-400
        "
      >
        {label}
      </p>

      <div className="min-h-8 pl-1">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   CONTENT SECTION
========================================================= */

function ContentSection({
  title,
  children,
  accent = "primary",
}) {
  const accentStyles = {
    primary: "bg-primary-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`
            h-5 w-1
            rounded-full
            ${accentStyles[accent]}
          `}
        />

        <h2 className="text-sm font-bold text-slate-800">
          {title}
        </h2>
      </div>

      <div
        className="
          rounded-xl
          border border-slate-200
          bg-white
          p-4
          shadow-sm
          sm:p-5
        "
      >
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({ label, value }) {
  return (
    <div
      className="
        flex flex-col gap-1.5
        border-b border-slate-100
        pb-3
        last:border-0
        last:pb-0
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:gap-4
      "
    >
      <span
        className="
          text-xs font-semibold
          uppercase tracking-wide
          text-slate-400
        "
      >
        {label}
      </span>

      <span
        className="
          min-w-0
          break-words
          text-sm font-medium
          text-slate-700
          sm:text-right
        "
      >
        {value}
      </span>
    </div>
  );
}