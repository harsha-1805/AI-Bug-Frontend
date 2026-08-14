import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import Badge from "../components/Badge.jsx";
import Avatar from "../components/Avatar.jsx";
import DueDateBadge from "../components/DueDateBadge.jsx";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";

import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import { getErrorMessage } from "../utils/apiError.js";
import { resolveMediaUrl } from "../api/axiosInstance.js";

const STATUS_TONE = {
  "To Do": "neutral",
  "In Progress": "medium",
  Done: "success",
};

export default function TaskPreviewPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  return (
    <div className="min-h-full w-full bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              inline-flex min-h-9 items-center gap-2
              rounded-lg px-3 py-2
              text-sm font-medium text-slate-600
              transition-colors
              hover:bg-white hover:text-primary-600
              focus:outline-none
              focus:ring-2 focus:ring-primary-500/20
            "
          >
            <ArrowLeft size={17} />
            <span>Back</span>
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div
            className="
              flex min-h-[320px]
              items-center justify-center
              rounded-xl border border-border
              bg-white shadow-sm
            "
          >
            <Loader label="Loading task..." />
          </div>
        ) : notFound || !task ? (
          <div
            className="
              rounded-xl border border-border
              bg-white p-6 shadow-sm
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
              rounded-xl border border-border
              bg-white shadow-sm
            "
          >
            {/* =========================================================
                HEADER
            ========================================================== */}
            <div className="border-b border-border px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                {/* Title */}
                <div className="min-w-0 flex-1">
                  {(projectName || task.project_id) && (
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {projectName || `Project #${task.project_id}`}
                    </p>
                  )}

                  <h1
                    className="
                      break-words
                      text-xl font-semibold leading-tight
                      text-slate-800
                      sm:text-2xl
                      lg:text-3xl
                    "
                  >
                    {task.title}
                  </h1>

                  {task.custom_id && (
                    <p className="mt-2 text-sm text-slate-400">
                      Task ID: {task.custom_id}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge tone={STATUS_TONE[task.status]}>
                    {task.status}
                  </Badge>

                  {task.custom_id && (
                    <Badge tone="info">
                      {task.custom_id}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* =========================================================
                CONTENT
            ========================================================== */}
            <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
              {/* Task metadata */}
              <div
                className="
                  grid grid-cols-1 gap-5
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >
                {/* Sprint */}
                <InfoItem label="Sprint">
                  {task.sprint?.name ? (
                    <span className="text-sm font-medium text-slate-700">
                      {task.sprint.name}
                    </span>
                  ) : (
                    <EmptyValue />
                  )}
                </InfoItem>

                {/* Due date */}
                <InfoItem label="Due date">
                  {task.due_date ? (
                    <DueDateBadge
                      date={task.due_date}
                      doneLike={task.status === "Done"}
                    />
                  ) : (
                    <EmptyValue />
                  )}
                </InfoItem>

                {/* Assignee */}
                <InfoItem label="Assignee">
                  {task.assignee ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={task.assignee.full_name}
                        size={30}
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {task.assignee.full_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">
                      Unassigned
                    </span>
                  )}
                </InfoItem>

                {/* Reporter */}
                <InfoItem label="Reported by">
                  {task.reporter ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={task.reporter.full_name}
                        size={30}
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {task.reporter.full_name}
                      </span>
                    </div>
                  ) : (
                    <EmptyValue />
                  )}
                </InfoItem>
              </div>

              {/* Divider */}
              <div className="my-7 border-t border-border sm:my-8" />

              {/* =========================================================
                  DESCRIPTION + ACCEPTANCE CRITERIA
              ========================================================== */}
              <div className="grid grid-cols-1 gap-7 lg:grid-cols-2 lg:gap-10">
                {/* Description */}
                <ContentSection
                  title="Description"
                  visible={Boolean(task.description)}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 sm:text-[15px]">
                    {task.description}
                  </p>
                </ContentSection>

                {/* Acceptance criteria */}
                <ContentSection
                  title="Acceptance criteria"
                  visible={Boolean(task.acceptance_criteria)}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 sm:text-[15px]">
                    {task.acceptance_criteria}
                  </p>
                </ContentSection>
              </div>

              {/* =========================================================
                  ATTACHMENTS
              ========================================================== */}
              {task.attachments?.length > 0 && (
                <>
                  <div className="my-7 border-t border-border sm:my-8" />

                  <section>
                    <div className="mb-4">
                      <h2 className="text-sm font-semibold text-slate-700">
                        Reference screenshots
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        {task.attachments.length}{" "}
                        {task.attachments.length === 1
                          ? "attachment"
                          : "attachments"}
                      </p>
                    </div>

                    <div
                      className="
                        grid grid-cols-1 gap-3
                        sm:grid-cols-2
                        lg:grid-cols-3
                        xl:grid-cols-4
                      "
                    >
                      {task.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="
                            group overflow-hidden
                            rounded-xl border border-border
                            bg-slate-50
                          "
                        >
                          <img
                            src={resolveMediaUrl(att.image_url)}
                            alt="Task reference"
                            loading="lazy"
                            className="
                              aspect-video
                              h-auto w-full
                              object-cover
                              transition-transform
                              duration-200
                              group-hover:scale-[1.02]
                            "
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Reusable UI helpers
========================================================= */

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="min-h-8 flex items-center">
        {children}
      </div>
    </div>
  );
}

function EmptyValue() {
  return (
    <span className="text-sm text-slate-300">
      —
    </span>
  );
}

function ContentSection({ title, visible, children }) {
  if (!visible) return null;

  return (
    <section className="min-w-0">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        {title}
      </h2>

      <div
        className="
          rounded-lg
          bg-slate-50
          px-4 py-3.5
          ring-1 ring-inset ring-slate-100
          sm:px-5 sm:py-4
        "
      >
        {children}
      </div>
    </section>
  );
}