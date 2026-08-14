import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import Badge from "../components/Badge.jsx";
import Avatar from "../components/Avatar.jsx";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";

import { subtaskService } from "../services/subtaskService";
import { taskService } from "../services/taskService";
import { getErrorMessage } from "../utils/apiError.js";

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

  return (
    <div className="min-h-full w-full bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {/* =========================================================
            BACK
        ========================================================== */}
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

        {/* =========================================================
            LOADING
        ========================================================== */}
        {loading ? (
          <div
            className="
              flex min-h-[320px]
              items-center justify-center
              rounded-xl border border-border
              bg-white shadow-sm
            "
          >
            <Loader label="Loading subtask..." />
          </div>
        ) : notFound || !subtask ? (
          <div
            className="
              rounded-xl border border-border
              bg-white p-6 shadow-sm
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
              rounded-xl border border-border
              bg-white shadow-sm
            "
          >
            {/* =========================================================
                HEADER
            ========================================================== */}
            <div
              className="
                border-b border-border
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
                    <p
                      className="
                        mb-2
                        break-words
                        text-xs font-medium
                        uppercase tracking-wide
                        text-slate-400
                      "
                    >
                      Subtask of {parentTaskTitle}
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
                    {subtask.title}
                  </h1>
                </div>

                {/* Status */}
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge
                    tone={
                      subtask.status === "Done"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {subtask.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* =========================================================
                CONTENT
            ========================================================== */}
            <div
              className="
                px-4 py-5
                sm:px-6 sm:py-7
                lg:px-8 lg:py-8
              "
            >
              {/* =====================================================
                  SUBTASK INFORMATION
              ====================================================== */}
              <div
                className="
                  grid grid-cols-1 gap-5
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >
                {/* Status */}
                <InfoItem label="Status">
                  <Badge
                    tone={
                      subtask.status === "Done"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {subtask.status}
                  </Badge>
                </InfoItem>

                {/* Assignee */}
                <InfoItem label="Assignee">
                  {subtask.assignee ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={subtask.assignee.full_name}
                        size={30}
                      />

                      <span
                        className="
                          break-words
                          text-sm font-medium
                          text-slate-700
                        "
                      >
                        {subtask.assignee.full_name}
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
                  {subtask.reporter ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={subtask.reporter.full_name}
                        size={30}
                      />

                      <span
                        className="
                          break-words
                          text-sm font-medium
                          text-slate-700
                        "
                      >
                        {subtask.reporter.full_name}
                      </span>
                    </div>
                  ) : (
                    <EmptyValue />
                  )}
                </InfoItem>

                {/* Parent task */}
                <InfoItem label="Parent task">
                  {parentTaskTitle ? (
                    <span
                      className="
                        break-words
                        text-sm font-medium
                        text-slate-700
                      "
                    >
                      {parentTaskTitle}
                    </span>
                  ) : (
                    <EmptyValue />
                  )}
                </InfoItem>
              </div>

              {/* =====================================================
                  DIVIDER
              ====================================================== */}
              <div className="my-7 border-t border-border sm:my-8" />

              {/* =====================================================
                  SUBTASK DETAILS
              ====================================================== */}
              <div className="grid grid-cols-1 gap-7 lg:grid-cols-2 lg:gap-10">
                <ContentSection title="Subtask details">
                  <div className="space-y-4">
                    <DetailRow
                      label="Status"
                      value={subtask.status}
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

                <ContentSection title="Summary">
                  <p className="text-sm leading-6 text-slate-600 sm:text-[15px]">
                    This is a read-only preview of the selected
                    subtask.
                  </p>

                  {parentTaskTitle && (
                    <p
                      className="
                        mt-3
                        text-sm leading-6
                        text-slate-500
                      "
                    >
                      This subtask belongs to{" "}
                      <span className="font-medium text-slate-700">
                        {parentTaskTitle}
                      </span>
                      .
                    </p>
                  )}
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
   REUSABLE UI HELPERS
========================================================= */

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
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
  );
}

function EmptyValue() {
  return (
    <span className="text-sm text-slate-300">
      —
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      className="
        flex flex-col gap-1
        border-b border-slate-100
        pb-3 last:border-0 last:pb-0
        sm:flex-row sm:items-center
        sm:justify-between sm:gap-4
      "
    >
      <span
        className="
          text-xs font-medium
          uppercase tracking-wide
          text-slate-400
        "
      >
        {label}
      </span>

      <span
        className="
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

function ContentSection({ title, children }) {
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