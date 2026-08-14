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

// Same status -> badge tone mapping used on the Tasks kanban/table page —
// kept in sync with STATUS_TONE in pages/Tasks.jsx.
const STATUS_TONE = { "To Do": "neutral", "In Progress": "medium", Done: "success" };

/**
 * Standalone, read-only Task preview page — replaces the old PreviewModal
 * popup. Reached by clicking the Eye icon on a task (kanban card or table
 * row) in pages/Tasks.jsx, which now navigates here instead of opening a
 * modal. The only navigation affordance is the "Back" button, which just
 * goes to the previous entry in history (navigate(-1)) so it returns to
 * whichever view (kanban or table) the user came from.
 *
 * This route is intentionally not listed in the Sidebar — it's only ever
 * reached via the preview (eye) icon.
 */
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
        projectService
          .getProject(data.project_id)
          .then((p) => active && setProjectName(p?.name || ""))
          .catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        setNotFound(true);
        toast.error(getErrorMessage(err, "Failed to load task"));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [taskId]);

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
          <Loader label="Loading task..." />
        </div>
      ) : notFound || !task ? (
        <EmptyState title="Task not found" description="This task may have been deleted or you no longer have access to it." />
      ) : (
        <div className="card space-y-4 p-5">
          <div className="min-w-0">
            {(projectName || task.project_id) && (
              <p className="truncate text-xs font-normal text-slate-400">
                {projectName || `Project #${task.project_id}`}
              </p>
            )}
            <h1 className="truncate text-lg font-semibold text-slate-800">{task.title}</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={STATUS_TONE[task.status]}>{task.status}</Badge>
            {task.custom_id && <Badge tone="info">{task.custom_id}</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Sprint</p>
              <div className="text-sm text-slate-700">
                {task.sprint?.name ?? <span className="text-xs text-slate-300">—</span>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Due date</p>
              <div className="text-sm text-slate-700">
                {task.due_date ? (
                  <DueDateBadge date={task.due_date} doneLike={task.status === "Done"} />
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Assignee</p>
              <div className="text-sm text-slate-700">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={task.assignee.full_name} size={20} />
                    <span>{task.assignee.full_name}</span>
                  </div>
                ) : (
                  "Unassigned"
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Reported by</p>
              <div className="text-sm text-slate-700">
                {task.reporter ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={task.reporter.full_name} size={20} />
                    <span>{task.reporter.full_name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>
            </div>
          </div>

          {task.description && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Description</p>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>
            </div>
          )}

          {task.acceptance_criteria && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Acceptance criteria</p>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{task.acceptance_criteria}</p>
            </div>
          )}

          {task.attachments?.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Reference screenshots</p>
              <div className="grid grid-cols-4 gap-2">
                {task.attachments.map((att) => (
                  <img
                    key={att.id}
                    src={resolveMediaUrl(att.image_url)}
                    alt=""
                    className="h-16 w-full rounded-lg border border-border object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
