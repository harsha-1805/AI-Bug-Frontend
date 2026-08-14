import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Select from "../components/Select.jsx";
import Loader from "../components/Loader.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import { aiAssistantService } from "../services/aiAssistantService";
import { projectService } from "../services/projectService";
import { taskService } from "../services/taskService";
import { getErrorMessage } from "../utils/apiError.js";
import { downloadCsv } from "../utils/downloadCsv.js";
import { useProjectFilter } from "../hooks/useProjectFilter";

const TYPE_TONE = {
  Positive: "success",
  Negative: "critical",
  "Edge Case": "medium",
};
const PRIORITY_TONE = { High: "high", Medium: "medium", Low: "low" };

// ── Inline preview table for a saved record ────────────────────────────────
function TestCasePreviewModal({ record, open, onClose }) {
  const [expanded, setExpanded] = useState(null); // row index for full-detail view

  if (!record) return null;

  let rows = [];
  try {
    rows = JSON.parse(record.test_cases_json);
  } catch {
    rows = [];
  }

  const openFullscreen = () => {
    // Build a standalone HTML page and open in new tab.
    const html = buildFullscreenHtml(record.entity_title, rows);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Preview — ${record.entity_title}`}
      className="max-w-5xl"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onClick={openFullscreen}
            className="flex items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
          >
            <Eye size={13} /> Open full screen
          </button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => downloadCsv(record.csv_data, record.entity_title)}
            >
              Download CSV
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="overflow-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium w-6" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <>
                <tr
                  key={`row-${idx}`}
                  className="border-t border-border hover:bg-slate-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === idx ? null : idx)}
                >
                  <td className="px-3 py-2 text-slate-400 text-xs">{row["Test Case ID"]}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{row["Title"]}</td>
                  <td className="px-3 py-2">
                    <Badge tone={TYPE_TONE[row["Type"]] || "neutral"}>{row["Type"]}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={PRIORITY_TONE[row["Priority"]] || "neutral"}>{row["Priority"]}</Badge>
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {expanded === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </td>
                </tr>
                {expanded === idx && (
                  <tr key={`detail-${idx}`} className="border-t border-border bg-slate-50/60">
                    <td colSpan={5} className="px-3 py-3">
                      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                        {[
                          ["Preconditions", row["Preconditions"]],
                          ["Steps", row["Steps"]],
                          ["Test Data", row["Test Data"]],
                          ["Expected Result", row["Expected Result"]],
                        ].map(([label, val]) =>
                          val ? (
                            <div key={label}>
                              <p className="mb-0.5 font-medium uppercase tracking-wide text-slate-400">
                                {label}
                              </p>
                              <p className="whitespace-pre-wrap text-slate-700">{val}</p>
                            </div>
                          ) : null
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-right text-xs text-slate-400">
        {rows.length} test case{rows.length === 1 ? "" : "s"} · Saved{" "}
        {new Date(record.created_at).toLocaleString()}
        {record.saver_name ? ` by ${record.saver_name}` : ""}
      </p>
    </Modal>
  );
}

// ── Full-screen HTML builder (new tab) ────────────────────────────────────
function buildFullscreenHtml(title, rows) {
  const rowsHtml = rows
    .map(
      (r) => `
    <tr>
      <td>${r["Test Case ID"] ?? ""}</td>
      <td>${r["Title"] ?? ""}</td>
      <td>${r["Type"] ?? ""}</td>
      <td>${r["Priority"] ?? ""}</td>
      <td>${(r["Preconditions"] ?? "").replace(/\n/g, "<br>")}</td>
      <td>${(r["Steps"] ?? "").replace(/\n/g, "<br>")}</td>
      <td>${(r["Test Data"] ?? "").replace(/\n/g, "<br>")}</td>
      <td>${(r["Expected Result"] ?? "").replace(/\n/g, "<br>")}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Test Cases — ${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;font-size:13px;background:#f8fafc;color:#1e293b;padding:24px}
  h1{font-size:1.1rem;font-weight:700;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  th{background:#f1f5f9;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0}
  td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;line-height:1.5}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#f8fafc}
  td:nth-child(1){color:#94a3b8;white-space:nowrap}
  td:nth-child(2){font-weight:500}
</style>
</head>
<body>
<h1>Test Cases — ${title}</h1>
<table>
  <thead>
    <tr>
      <th>ID</th><th>Title</th><th>Type</th><th>Priority</th>
      <th>Preconditions</th><th>Steps</th><th>Test Data</th><th>Expected Result</th>
    </tr>
  </thead>
  <tbody>${rowsHtml}</tbody>
</table>
</body>
</html>`;
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function TestCasesLibrary() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Filters — project comes from the universal Navbar dropdown (shared
  // across Tasks/Sprints/Bugs/Dashboard/Reports/AI Assistant, see
  // context/ProjectFilterContext.jsx) so picking a project there also
  // scopes this page. Task stays a page-local secondary filter, scoped to
  // whichever project is currently selected.
  const { selectedProjectId: projectFilter } = useProjectFilter();
  const [taskFilter, setTaskFilter] = useState("");

  // Preview modal
  const [previewRecord, setPreviewRecord] = useState(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load projects
  useEffect(() => {
    projectService
      .listProjects({ pageSize: 100 })
      .then((d) => setProjects(d.items))
      .catch(() => {});
  }, []);

  // Load tasks when project filter changes
  useEffect(() => {
    setTaskFilter("");
    if (!projectFilter) {
      setTasks([]);
      return;
    }
    setTasksLoading(true);
    taskService
      .listTasks({ projectId: Number(projectFilter) })
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [projectFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiAssistantService.listSavedTestCases({
        projectId: projectFilter ? Number(projectFilter) : undefined,
        taskId: taskFilter ? Number(taskFilter) : undefined,
      });
      setRecords(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load saved test cases"));
    } finally {
      setLoading(false);
    }
  }, [projectFilter, taskFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await aiAssistantService.deleteSavedTestCase(confirmDelete.id);
      toast.success("Deleted");
      setRecords((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete"));
    } finally {
      setDeleting(false);
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name || `Project #${id}`;

  return (
    <div>
      <PageHeader
        title="AI Test Cases Library"
        subtitle="Browse, preview, and download all AI-generated test case sets saved from the AI Assistant"
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Filter size={15} className="text-slate-400" />
        <Select
          className="w-56"
          value={taskFilter}
          onChange={setTaskFilter}
          disabled={!projectFilter || tasksLoading}
          placeholder={
            !projectFilter
              ? "Select a project first"
              : tasksLoading
              ? "Loading tasks…"
              : "All tasks"
          }
          ariaLabel="Filter by task"
          options={[
            { value: "", label: "All tasks" },
            ...tasks.map((t) => ({ value: t.id, label: t.title })),
          ]}
        />
        {taskFilter && (
          <button
            type="button"
            onClick={() => setTaskFilter("")}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            <X size={13} /> Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{records.length} record{records.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <Loader label="Loading test cases..." />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-14 text-center">
            <FileSpreadsheet size={32} className="text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No saved test cases yet</p>
            <p className="text-xs text-slate-400">
              Generate test cases in the AI Assistant and click &ldquo;Save to Library&rdquo; — they&apos;ll
              appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Cases</th>
                <th className="px-4 py-3 font-medium">Saved by</th>
                <th className="px-4 py-3 font-medium">Saved at</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                let count = 0;
                try { count = JSON.parse(rec.test_cases_json).length; } catch { count = "?"; }
                return (
                  <tr key={rec.id} className="border-t border-border hover:bg-slate-50/60">
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-slate-800">
                      {rec.entity_title}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{projectName(rec.project_id)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={rec.entity_type === "task" ? "info" : "critical"}>
                        {rec.entity_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{count}</td>
                    <td className="px-4 py-3 text-slate-500">{rec.saver_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Preview"
                          onClick={() => setPreviewRecord(rec)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-600"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          title="Download CSV"
                          onClick={() => downloadCsv(rec.csv_data, rec.entity_title)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-50 hover:text-primary-600"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setConfirmDelete(rec)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview modal */}
      <TestCasePreviewModal
        record={previewRecord}
        open={Boolean(previewRecord)}
        onClose={() => setPreviewRecord(null)}
      />

      {/* Delete confirm */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete test case set"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete the test cases for <strong>{confirmDelete?.entity_title}</strong>? This can&apos;t be
          undone.
        </p>
      </Modal>
    </div>
  );
}
