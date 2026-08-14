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

/**
 * Standalone, read-only SubTask preview page — replaces the old
 * PreviewModal popup used inside the Subtasks modal on pages/Tasks.jsx.
 * Reached by clicking the Eye icon next to a subtask, which now navigates
 * here instead of opening a popup on top of the Subtasks modal. The only
 * navigation affordance is the "Back" button (navigate(-1)), which returns
 * to wherever the user came from.
 *
 * Fetches the subtask by id, then its parent task (for the "Subtask of ..."
 * subtitle) — both existing endpoints, no backend changes required.
 *
 * This route is intentionally not listed in the Sidebar — it's only ever
 * reached via the preview (eye) icon.
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
        taskService
          .getTask(data.task_id)
          .then((t) => active && setParentTaskTitle(t?.title || ""))
          .catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        setNotFound(true);
        toast.error(getErrorMessage(err, "Failed to load subtask"));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [subtaskId]);

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-primary-600"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading subtask..." />
        </div>
      ) : notFound || !subtask ? (
        <EmptyState title="Subtask not found" description="This subtask may have been deleted or you no longer have access to it." />
      ) : (
        <div className="card space-y-4 p-5">
          <div className="min-w-0">
            {parentTaskTitle && (
              <p className="truncate text-xs font-normal text-slate-400">{`Subtask of ${parentTaskTitle}`}</p>
            )}
            <h1 className="truncate text-lg font-semibold text-slate-800">{subtask.title}</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={subtask.status === "Done" ? "success" : "neutral"}>{subtask.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Assignee</p>
              <div className="text-sm text-slate-700">
                {subtask.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={subtask.assignee.full_name} size={20} />
                    <span>{subtask.assignee.full_name}</span>
                  </div>
                ) : (
                  "Unassigned"
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Reported by</p>
              <div className="text-sm text-slate-700">
                {subtask.reporter ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={subtask.reporter.full_name} size={20} />
                    <span>{subtask.reporter.full_name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
