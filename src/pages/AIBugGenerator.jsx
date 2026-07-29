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
import { taskService } from "../services/taskService";

export default function AIBugGenerator() {
  const [image, setImage] = useState(null);
  const [userDescription, setUserDescription] = useState("");
  const [consoleLog, setConsoleLog] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [browserUrl, setBrowserUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { bug_report, low_confidence, model_used }

  // --- Save-to-task flow: project is required to save a bug, task is
  // optional. Picking a task whose `sprint` is set shows that sprint and
  // carries its id onto the bug automatically (see handleSave below).
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
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

  // Reload the task dropdown's options whenever the selected project
  // changes, and reset any task chosen under the previous project.
  useEffect(() => {
    setSelectedTaskId("");
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    taskService
      .listTasks({ projectId: Number(selectedProjectId) })
      .then(setTasks)
      .catch(() => {
        setTasks([]);
        toast.error("Failed to load tasks for that project");
      });
  }, [selectedProjectId]);

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
      const message = err?.response?.data?.detail || "Failed to generate bug report.";
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

    const bugReport = result.bug_report;
    const selectedTask = tasks.find((t) => String(t.id) === String(selectedTaskId));

    setSaving(true);
    try {
      const saved_ = await bugService.createBug({
        projectId: Number(selectedProjectId),
        // A task assigned to a sprint carries that sprint onto the bug
        // too, so it shows up filtered/grouped correctly in Sprints view.
        sprintId: selectedTask?.sprint_id ?? undefined,
        taskId: selectedTaskId ? Number(selectedTaskId) : undefined,
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
      });
      setSaved(true);
      toast.success(
        selectedTask ? `Bug saved and assigned to "${selectedTask.title}"` : "Bug saved."
      );
      return saved_;
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to save bug.";
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
              <BugSummaryCard bugReport={result.bug_report} />
              <ConfidenceCard score={result.bug_report.confidence_score} />
              <BugReportForm
                bugReport={result.bug_report}
                onChange={updateBugReport}
                projects={projects}
                tasks={tasks}
                selectedProjectId={selectedProjectId}
                selectedTaskId={selectedTaskId}
                onProjectChange={setSelectedProjectId}
                onTaskChange={setSelectedTaskId}
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
