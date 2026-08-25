import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  CalendarDays,
  Layers3,
  UserRound,
  Image as ImageIcon,
  X,
} from "lucide-react";

import Badge from "../components/Badge.jsx";
import Avatar from "../components/Avatar.jsx";
import DueDateBadge from "../components/DueDateBadge.jsx";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import CommentThread from "../components/CommentThread.jsx";

import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import { getErrorMessage } from "../utils/apiError.js";
import { resolveMediaUrl } from "../api/axiosInstance.js";

const STATUS_TONE = {
  "To Do": "neutral",
  "In Progress": "medium",
  Done: "success",
};

const STATUS_STYLES = {
  Done: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 size={15} />,
    accent: "emerald",
  },

  "In Progress": {
    wrapper: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    icon: <Clock3 size={15} />,
    accent: "blue",
  },

  "To Do": {
    wrapper: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
    icon: <Circle size={15} />,
    accent: "slate",
  },
};

export default function  TaskPreviewPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setNotFound(false);

    taskService
      .getTask(taskId)
      .then((data) => {
        if (!active) return;

        setTask(data);

        if (data?.project_id) {
          projectService
            .getProject(data.project_id)
            .then((project) => {
              if (active) {
                setProjectName(project?.name || "");
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (!active) return;

        setNotFound(true);

        toast.error(
          getErrorMessage(err, "Failed to load task")
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
  }, [taskId]);

  const statusStyle =
    STATUS_STYLES[task?.status] || STATUS_STYLES["To Do"];

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
            <Loader label="Loading task..." />
          </div>
        ) : notFound || !task ? (
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
              title="Task not found"
              description="This task may have been deleted or you no longer have access to it."
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
                  {(projectName || task.project_id) && (
                    <div className="mb-2 flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />

                      <p
                        className="
                          min-w-0
                          break-words
                          text-xs font-semibold
                          uppercase tracking-wide
                          text-primary-600
                        "
                      >
                        {projectName ||
                          `Project #${task.project_id}`}
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
                      xl:text-4xl
                    "
                  >
                    {task.title}
                  </h1>

                  {task.custom_id && (
                    <div className="mt-3">
                      <span
                        className="
                          inline-flex items-center gap-1.5
                          rounded-md
                          border border-slate-200
                          bg-white
                          px-2.5 py-1
                          text-xs font-semibold
                          text-slate-500
                          shadow-sm
                        "
                      >
                        <Layers3 size={13} />
                        {task.custom_id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Header status */}
                <div className="flex shrink-0 flex-wrap gap-2">
                  <StatusPill status={task.status} />

                  {task.custom_id && (
                    <Badge tone="info">
                      {task.custom_id}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* =====================================================
                CONTENT
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
                {/* Sprint */}
                <InfoCard
                  label="Sprint"
                  accent="primary"
                  background="primary"
                  icon={<Layers3 size={17} />}
                >
                  {task.sprint?.name ? (
                    <span
                      className="
                        break-words
                        text-sm font-semibold
                        text-slate-700
                      "
                    >
                      {task.sprint.name}
                    </span>
                  ) : (
                    <EmptyValue />
                  )}
                </InfoCard>

                {/* Due date */}
                <InfoCard
                  label="Due date"
                  accent={
                    task.status === "Done"
                      ? "emerald"
                      : "amber"
                  }
                  background={
                    task.status === "Done"
                      ? "emerald"
                      : "amber"
                  }
                  icon={<CalendarDays size={17} />}
                >
                  {task.due_date ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <DueDateBadge
                        date={task.due_date}
                        doneLike={task.status === "Done"}
                      />
                    </div>
                  ) : (
                    <EmptyValue />
                  )}
                </InfoCard>

                {/* Assignee */}
                <InfoCard
                  label="Assignee"
                  accent="blue"
                  background="blue"
                  icon={<UserRound size={17} />}
                >
                  {task.assignee ? (
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        name={task.assignee.full_name}
                        size={32}
                      />

                      <span
                        className="
                          min-w-0 break-words
                          text-sm font-semibold
                          text-slate-700
                        "
                      >
                        {task.assignee.full_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">
                      Unassigned
                    </span>
                  )}
                </InfoCard>

                {/* Reporter */}
                <InfoCard
                  label="Reported by"
                  accent="violet"
                  background="violet"
                  icon={<UserRound size={17} />}
                >
                  {task.reporter ? (
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        name={task.reporter.full_name}
                        size={32}
                      />

                      <span
                        className="
                          min-w-0 break-words
                          text-sm font-semibold
                          text-slate-700
                        "
                      >
                        {task.reporter.full_name}
                      </span>
                    </div>
                  ) : (
                    <EmptyValue />
                  )}
                </InfoCard>
              </div>

              {/* ===================================================
                  DIVIDER
              ==================================================== */}
              <div className="my-7 border-t border-slate-200 sm:my-8" />

              {/* ===================================================
                  DESCRIPTION + ACCEPTANCE
              ==================================================== */}
              <div
                className="
                  grid grid-cols-1 gap-6
                  lg:grid-cols-2
                  lg:gap-8
                "
              >
                {/* Description */}
                <ContentSection
                  title="Description"
                  visible={Boolean(task.description)}
                  accent="primary"
                >
                  <div
                    className="
                      rounded-xl
                      border border-primary-100
                      bg-primary-50/40
                      p-4
                      sm:p-5
                    "
                  >
                    <p
                      className="
                        whitespace-pre-wrap
                        break-words
                        text-sm leading-6
                        text-slate-600
                        sm:text-[15px]
                      "
                    >
                      {task.description}
                    </p>
                  </div>
                </ContentSection>

                {/* Acceptance criteria */}
                <ContentSection
                  title="Acceptance criteria"
                  visible={Boolean(task.acceptance_criteria)}
                  accent="emerald"
                >
                  <div
                    className="
                      rounded-xl
                      border border-emerald-100
                      bg-emerald-50/40
                      p-4
                      sm:p-5
                    "
                  >
                    <p
                      className="
                        whitespace-pre-wrap
                        break-words
                        text-sm leading-6
                        text-slate-600
                        sm:text-[15px]
                      "
                    >
                      {task.acceptance_criteria}
                    </p>
                  </div>
                </ContentSection>
              </div>

              {/* ===================================================
                  ATTACHMENTS
              ==================================================== */}
              {task.attachments?.length > 0 && (
                <>
                  <div className="my-7 border-t border-slate-200 sm:my-8" />

                  <section>
                    {/* Attachment heading */}
                    <div
                      className="
                        mb-4
                        flex flex-col gap-2
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="
                            flex h-8 w-8
                            items-center justify-center
                            rounded-lg
                            bg-violet-100
                            text-violet-600
                          "
                        >
                          <ImageIcon size={17} />
                        </span>

                        <div>
                          <h2
                            className="
                              text-sm font-bold
                              text-slate-800
                            "
                          >
                            Reference screenshots
                          </h2>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Visual references attached to this task
                          </p>
                        </div>
                      </div>

                      <span
                        className="
                          w-fit
                          rounded-full
                          border border-violet-200
                          bg-violet-50
                          px-2.5 py-1
                          text-xs font-semibold
                          text-violet-700
                        "
                      >
                        {task.attachments.length}{" "}
                        {task.attachments.length === 1
                          ? "attachment"
                          : "attachments"}
                      </span>
                    </div>

                    {/* Images */}
                    <div
                      className="
                        grid grid-cols-1 gap-3
                        sm:grid-cols-2
                        lg:grid-cols-3
                        xl:grid-cols-4
                      "
                    >
                      {task.attachments.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() =>
                            setSelectedImage(
                              resolveMediaUrl(att.image_url)
                            )
                          }
                          className="
                            group
                            block w-full
                            overflow-hidden
                            rounded-xl
                            border border-slate-200
                            bg-slate-50
                            text-left
                            shadow-sm
                            transition-all duration-200
                            hover:-translate-y-0.5
                            hover:border-violet-200
                            hover:shadow-md
                            focus:outline-none
                            focus:ring-2
                            focus:ring-violet-500/30
                          "
                          aria-label="Preview task reference image"
                        >
                          <div className="relative overflow-hidden">
                            <img
                              src={resolveMediaUrl(
                                att.image_url
                              )}
                              alt="Task reference"
                              loading="lazy"
                              className="
                                aspect-video
                                h-auto w-full
                                object-cover
                                transition-transform
                                duration-300
                                group-hover:scale-[1.03]
                              "
                            />

                            {/* Image overlay */}
                            <div
                              className="
                                pointer-events-none
                                absolute inset-0
                                flex items-center justify-center
                                bg-black/0
                                transition-all
                                duration-200
                                group-hover:bg-black/30
                              "
                            >
                              <span
                                className="
                                  rounded-full
                                  bg-white/90
                                  px-4 py-2
                                  text-xs font-semibold
                                  text-slate-700
                                  opacity-0
                                  shadow-lg
                                  transition-opacity
                                  duration-200
                                  group-hover:opacity-100
                                "
                              >
                                Click to preview
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* =================================================
                  COMMENTS
              ================================================== */}
              <section className="mt-6 rounded-2xl border border-border p-4 sm:p-5">
                <CommentThread entityType="Task" entityId={task.id} />
              </section>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          IMAGE PREVIEW MODAL
      ========================================================== */}
      {selectedImage && (
        <div
          className="
            fixed inset-0 z-[9999]
            flex items-center justify-center
            bg-black/80
            p-4
            backdrop-blur-sm
          "
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="
              absolute right-4 top-4
              z-10
              flex h-10 w-10
              items-center justify-center
              rounded-full
              bg-white/10
              text-white
              shadow-lg
              transition
              hover:bg-white/20
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
              sm:right-6 sm:top-6
            "
            aria-label="Close image preview"
          >
            <X size={24} />
          </button>

          {/* Preview image */}
          <img
            src={selectedImage}
            alt="Task reference preview"
            className="
              max-h-[90vh]
              max-w-[95vw]
              rounded-lg
              object-contain
              shadow-2xl
            "
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({ status }) {
  const style =
    STATUS_STYLES[status] ||
    STATUS_STYLES["To Do"];

  return (
    <div
      className={`
        inline-flex items-center gap-2
        rounded-full
        border
        px-3 py-1.5
        text-sm font-semibold
        shadow-sm
        ${style.wrapper}
      `}
    >
      <span
        className={`
          h-2 w-2
          shrink-0
          rounded-full
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
  icon,
}) {
  const accentStyles = {
    primary: "bg-primary-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-400",
  };

  const iconStyles = {
    primary: "bg-primary-100 text-primary-600",
    blue: "bg-blue-100 text-blue-600",
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
    slate: "bg-slate-100 text-slate-500",
  };

  const backgroundStyles = {
    primary: "from-primary-50/70 to-white",
    blue: "from-blue-50/70 to-white",
    violet: "from-violet-50/70 to-white",
    amber: "from-amber-50/70 to-white",
    emerald: "from-emerald-50/70 to-white",
    slate: "from-slate-50 to-white",
  };

  return (
    <div
      className={`
        group
        relative
        min-w-0
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
      {/* Colored side accent */}
      <div
        className={`
          absolute
          left-0 top-0
          h-full w-1
          ${accentStyles[accent]}
        `}
      />

      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={`
              flex h-8 w-8
              shrink-0
              items-center justify-center
              rounded-lg
              ${iconStyles[accent]}
            `}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            className="
              mb-2
              text-[11px] font-semibold
              uppercase tracking-wider
              text-slate-400
            "
          >
            {label}
          </p>

          <div className="min-h-8 flex items-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CONTENT SECTION
========================================================= */

function ContentSection({
  title,
  visible,
  children,
  accent = "primary",
}) {
  if (!visible) return null;

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
            shrink-0
            rounded-full
            ${accentStyles[accent]}
          `}
        />

        <h2
          className="
            text-sm font-bold
            text-slate-800
          "
        >
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   EMPTY VALUE
========================================================= */

function EmptyValue() {
  return (
    <span className="text-sm text-slate-300">
      —
    </span>
  );
}