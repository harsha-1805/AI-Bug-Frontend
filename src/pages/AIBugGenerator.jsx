
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import EvidenceUploader from "../components/EvidenceUploader.jsx";
import ImagePreview from "../components/ImagePreview.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";
import BugSummaryCard from "../components/BugSummaryCard.jsx";
import ConfidenceCard from "../components/ConfidenceCard.jsx";
import BugReportForm from "../components/BugReportForm.jsx";
import { aiBugService } from "../services/aiBugService";
import { bugService } from "../services/bugService";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { taskService } from "../services/taskService";
import { subtaskService } from "../services/subtaskService";
import { getErrorMessage } from "../utils/apiError.js";
import { resolveMediaUrl } from "../api/axiosInstance.js";

export default function AIBugGenerator() {
  const [image, setImage] = useState(null);
  const [userDescription, setUserDescription] = useState("");
  const [consoleLog, setConsoleLog] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [browserUrl, setBrowserUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { bug_report, low_confidence, model_used }

  // --- Save-to-task flow: project and sprint are both required to save
  // a bug (Project -> Sprint -> Task, matching the regular "Create Bug"
  // form); task and subtask stay optional. See handleSave below.
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canGenerate = Boolean(image) && !loading;

  useEffect(() => {
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => setProjects(data.items || []))
      .catch(() => {
        // Non-fatal: the project dropdown just stays empty if this fails.
      });
  }, []);

  // Reload the sprint dropdown's options whenever the selected project
  // changes, and reset any sprint/task/subtask chosen under the
  // previous project.
  useEffect(() => {
    setSelectedSprintId("");
    setSelectedTaskId("");
    if (!selectedProjectId) {
      setSprints([]);
      return;
    }
    sprintService
      .listSprints({ projectId: Number(selectedProjectId) })
      .then(setSprints)
      .catch(() => {
        setSprints([]);
        toast.error("Failed to load sprints for that project");
      });
  }, [selectedProjectId]);

  // Reload the task dropdown's options whenever the selected sprint
  // changes, and reset any task chosen under the previous sprint.
  useEffect(() => {
    setSelectedTaskId("");
    if (!selectedSprintId) {
      setTasks([]);
      return;
    }
    taskService
      .listTasks({ projectId: Number(selectedProjectId), sprintId: Number(selectedSprintId) })
      .then(setTasks)
      .catch(() => {
        setTasks([]);
        toast.error("Failed to load tasks for that sprint");
      });
  }, [selectedProjectId, selectedSprintId]);

  // Reload the subtask dropdown's options whenever the selected task
  // changes, and reset any subtask chosen under the previous task.
  useEffect(() => {
    setSelectedSubtaskId("");
    if (!selectedTaskId) {
      setSubtasks([]);
      return;
    }
    subtaskService
      .listSubtasks({ taskId: Number(selectedTaskId) })
      .then(setSubtasks)
      .catch(() => {
        setSubtasks([]);
        toast.error("Failed to load subtasks for that task");
      });
  }, [selectedTaskId]);

  const handleGenerate = async () => {
    if (!image) {
      toast.error("Please upload a screenshot first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const data = await aiBugService.generateBug({
        image,
        userDescription,
        consoleLog,
        stackTrace,
        browserUrl,
      });
      setResult(data);
      toast.success("Bug report generated.");
    } catch (err) {
      const message = getErrorMessage(err, "Failed to generate bug report.");
      toast.error(typeof message === "string" ? message : "Failed to generate bug report.");
    } finally {
      setLoading(false);
    }
  };

  const updateBugReport = (updated) => {
    setResult((prev) => (prev ? { ...prev, bug_report: updated } : prev));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!result?.bug_report) return;
    if (!selectedProjectId) {
      toast.error("Select a project before saving this bug.");
      return;
    }
    if (!selectedSprintId) {
      toast.error("Select a sprint before saving this bug.");
      return;
    }

    const bugReport = result.bug_report;

    setSaving(true);
    try {
      const saved_ = await bugService.createBug({
        projectId: Number(selectedProjectId),
        sprintId: Number(selectedSprintId),
        taskId: selectedTaskId ? Number(selectedTaskId) : undefined,
        subtaskId: selectedSubtaskId ? Number(selectedSubtaskId) : undefined,
        title: bugReport.title,
        severity: bugReport.severity,
        priority: bugReport.priority,
        status: "Open",
        summary: bugReport.summary,
        description: bugReport.description,
        environment: bugReport.environment,
        module: bugReport.module,
        bugType: bugReport.bug_type,
        expectedResult: bugReport.expected_result,
        actualResult: bugReport.actual_result,
        possibleRootCause: bugReport.possible_root_cause,
        confidenceScore: bugReport.confidence_score,
        stepsToReproduce: bugReport.steps_to_reproduce || [],
        isAiGenerated: true,
        // Persisted screenshot from the AI Bug Generator (see
        // app/services/image_storage.py) — saved onto the Bug so it can
        // be previewed later on the Bugs list/detail, not just here.
        imageUrl: result.image_url,
      });
      setSaved(true);
      const savedToTask = tasks.find((t) => String(t.id) === String(selectedTaskId));
      toast.success(
        savedToTask ? `Bug saved and assigned to "${savedToTask.title}"` : "Bug saved."
      );
      return saved_;
    } catch (err) {
      const message = getErrorMessage(err, "Failed to save bug.");
      toast.error(typeof message === "string" ? message : "Failed to save bug.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Bug Generator"
        subtitle="Upload evidence and let Gemini 2.5 Flash draft a structured bug report"
        actions={
          <Button icon={Sparkles} loading={loading} disabled={!canGenerate} onClick={handleGenerate}>
            Generate AI Bug
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: evidence input */}
        <div className="space-y-6">
          <EvidenceUploader
            onImageSelect={setImage}
            userDescription={userDescription}
            onUserDescriptionChange={setUserDescription}
            consoleLog={consoleLog}
            onConsoleLogChange={setConsoleLog}
            stackTrace={stackTrace}
            onStackTraceChange={setStackTrace}
            browserUrl={browserUrl}
            onBrowserUrlChange={setBrowserUrl}
            disabled={loading}
          />
          <ImagePreview file={image} onRemove={() => setImage(null)} />
        </div>

        {/* Right: generated output */}
        <div className="space-y-6">
          <LoadingOverlay show={loading} />

          {!loading && !result && (
            <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center text-slate-400">
              <Sparkles size={24} />
              <p className="text-sm">Your generated bug report will appear here</p>
            </div>
          )}

          {!loading && result && (
            <>
              {result.image_url && (
                <div className="card overflow-hidden p-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">Attached screenshot</p>
                  <img
                    src={resolveMediaUrl(result.image_url)}
                    alt="Uploaded bug evidence"
                    className="max-h-64 w-full rounded-lg border border-border object-contain"
                  />
                </div>
              )}
              <BugSummaryCard bugReport={result.bug_report} />
              <ConfidenceCard score={result.bug_report.confidence_score} />
              <BugReportForm
                bugReport={result.bug_report}
                onChange={updateBugReport}
                projects={projects}
                sprints={sprints}
                tasks={tasks}
                subtasks={subtasks}
                selectedProjectId={selectedProjectId}
                selectedSprintId={selectedSprintId}
                selectedTaskId={selectedTaskId}
                selectedSubtaskId={selectedSubtaskId}
                onProjectChange={setSelectedProjectId}
                onSprintChange={setSelectedSprintId}
                onTaskChange={setSelectedTaskId}
                onSubtaskChange={setSelectedSubtaskId}
                onSave={handleSave}
                saving={saving}
                saved={saved}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}