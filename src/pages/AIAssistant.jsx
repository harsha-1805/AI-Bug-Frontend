import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Sparkles,
  Send,
  Bug,
  ListTree,
  Search,
  Rocket,
  LayoutGrid,
  User as UserIcon,
  Download,
  FileSpreadsheet,
  Wand2,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Select from "../components/Select.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Loader from "../components/Loader.jsx";
import { aiAssistantService } from "../services/aiAssistantService";
import { projectService } from "../services/projectService";
import { taskService } from "../services/taskService";
import { bugService } from "../services/bugService";
import { subtaskService } from "../services/subtaskService";
import { useAuth } from "../hooks/useAuth";
import { useProjectFilter } from "../hooks/useProjectFilter";
import { getErrorMessage } from "../utils/apiError.js";
import { downloadCsv } from "../utils/downloadCsv.js";
import { takePendingTestCaseRequest } from "../utils/aiHandoff.js";
import { TEXTAREA_MAX_LENGTH } from "../utils/validation.js";

const SUGGESTION_CARDS = [
  { icon: Bug, text: "Show me the open bugs", hint: "Filter bugs" },
  { icon: LayoutGrid, text: "Summarize the bugs", hint: "Bug summary" },
  { icon: Search, text: "Search bugs for login", hint: "Search bugs" },
  { icon: Rocket, text: "What's the sprint status?", hint: "Sprint analysis" },
  { icon: ListTree, text: "Which module is most unstable?", hint: "Module analysis" },
];

// ── TestCaseMessage ──────────────────────────────────────────────────────────
// Renders a single AI test-case result bubble with:
//   • inline preview table (expandable)
//   • Regenerate (with feedback textarea)
//   • Save to Library
//   • Download CSV
function TestCaseMessage({ msg, projects, onRegenerate, onSave, regenerating }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Which project to save against — pre-fill if there is only one.
  const [saveProjectId, setSaveProjectId] = useState(
    projects.length === 1 ? String(projects[0].id) : ""
  );
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const handleRegenerate = () => {
    if (!feedback.trim()) {
      toast.error("Tell the AI what to fix or add before regenerating.");
      return;
    }
    onRegenerate(msg.entityType, msg.entityId, feedback.trim());
    setFeedback("");
    setFeedbackOpen(false);
  };

  const handleSave = async () => {
    if (!saveProjectId) {
      toast.error("Select a project to save under.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        entityType: msg.entityType,
        entityId: msg.entityId,
        entityTitle: msg.entityTitle,
        projectId: Number(saveProjectId),
        testCases: msg.rows,
        csv: msg.csv,
      });
      setSaveModalOpen(false);
      toast.success("Test cases saved to library!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save test cases."));
    } finally {
      setSaving(false);
    }
  };

  const displayRows = previewExpanded ? msg.rows : msg.rows.slice(0, 5);

  return (
    <div className="max-w-[90%] rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3 text-sm text-slate-700">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
        <FileSpreadsheet size={15} className="text-primary-600" />
        {msg.count} test case{msg.count === 1 ? "" : "s"} generated for &ldquo;{msg.entityTitle}&rdquo;
      </div>

      {/* Preview table */}
      <div className="overflow-auto rounded-lg border border-border bg-white">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2.5 py-1.5 font-medium">ID</th>
              <th className="px-2.5 py-1.5 font-medium">Title</th>
              <th className="px-2.5 py-1.5 font-medium">Type</th>
              <th className="px-2.5 py-1.5 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => (
              <tr key={idx} className="border-t border-border hover:bg-slate-50">
                <td className="px-2.5 py-1.5 text-slate-400">{row["Test Case ID"]}</td>
                <td className="max-w-[200px] truncate px-2.5 py-1.5">{row["Title"]}</td>
                <td className="px-2.5 py-1.5 text-slate-500">{row["Type"]}</td>
                <td className="px-2.5 py-1.5 text-slate-500">{row["Priority"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {msg.rows.length > 5 && (
          <button
            type="button"
            onClick={() => setPreviewExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-1 border-t border-border px-2.5 py-1.5 text-[11px] text-primary-600 hover:bg-primary-50"
          >
            {previewExpanded ? (
              <><ChevronUp size={11} /> Show less</>
            ) : (
              <><ChevronDown size={11} /> Show {msg.rows.length - 5} more</>
            )}
          </button>
        )}
      </div>

      {/* Feedback / Regenerate */}
      {feedbackOpen ? (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">
            Describe what to fix or add:
          </p>
          <textarea
            className="input min-h-[70px] text-xs"
            maxLength={TEXTAREA_MAX_LENGTH}
            placeholder="e.g. Add more edge cases for empty input fields. Make the steps more specific about which button to click."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating || !feedback.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {regenerating ? <Loader size={11} /> : <RefreshCw size={11} />}
              Regenerate
            </button>
            <button
              type="button"
              onClick={() => { setFeedbackOpen(false); setFeedback(""); }}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(msg.csv, `test-cases-${msg.entityTitle}`)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            <Download size={12} /> Download CSV
          </button>
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw size={12} /> Regenerate
          </button>
          <button
            type="button"
            onClick={() => setSaveModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Save size={12} /> Save to Library
          </button>
        </div>
      )}

      {/* Save modal */}
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save test cases to library"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave} disabled={!saveProjectId}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Saving <strong>{msg.count} test cases</strong> for &ldquo;{msg.entityTitle}&rdquo; to the library.
          </p>
          <div>
            <label className="label">Project</label>
            <Select
              value={saveProjectId}
              onChange={setSaveProjectId}
              placeholder="Select project"
              ariaLabel="Project"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
            <p className="mt-1 text-xs text-slate-400">
              Saved test cases will be visible under Tasks → AI Test Cases for this project.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AIAssistant() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [projects, setProjects] = useState([]);
  // Universal project filter (Navbar dropdown) — "" = all projects. Shared
  // across Tasks/Sprints/Bugs/Dashboard/Reports/AI Assistant via context,
  // see context/ProjectFilterContext.jsx. `projects` here stays local
  // (still needed for the save-test-case and generate-test-cases pickers
  // below, which are separate "which project" choices, not this view
  // filter).
  const { selectedProjectId: projectId } = useProjectFilter();
  const scrollRef = useRef(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerProjectId, setPickerProjectId] = useState("");
  const [pickerType, setPickerType] = useState("task"); // "task" | "bug" | "subtask"
  const [pickerItems, setPickerItems] = useState([]);
  // For "task"/"bug" this is the final selected entity id. For "subtask"
  // this is the PARENT TASK id (picked first, to then narrow down to one
  // of its subtasks) — see pickerSubtaskId below.
  const [pickerItemId, setPickerItemId] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  // Second-level picker, only used when pickerType === "subtask": the
  // subtasks belonging to the task chosen in pickerItemId.
  const [pickerSubtasks, setPickerSubtasks] = useState([]);
  const [pickerSubtaskId, setPickerSubtaskId] = useState("");
  const [pickerSubtasksLoading, setPickerSubtasksLoading] = useState(false);

  useEffect(() => {
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => setProjects(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, regenerating]);

  useEffect(() => {
    const pending = takePendingTestCaseRequest();
    if (pending?.entityType && pending?.entityId) {
      generateTestCases(pending.entityType, pending.entityId, pending.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loads the first-level picker list: tasks (for "task" AND "subtask" —
  // subtasks are chosen by first picking their parent task) or bugs.
  useEffect(() => {
    if (!pickerOpen || !pickerProjectId) {
      setPickerItems([]);
      return;
    }
    setPickerItemId("");
    setPickerSubtaskId("");
    setPickerSubtasks([]);
    setPickerLoading(true);
    const loader =
      pickerType === "bug"
        ? bugService.listBugs({ projectId: Number(pickerProjectId), pageSize: 100 }).then((d) => d.items)
        : taskService.listTasks({ projectId: Number(pickerProjectId) });
    loader.then(setPickerItems).catch(() => setPickerItems([])).finally(() => setPickerLoading(false));
  }, [pickerOpen, pickerProjectId, pickerType]);

  // Second-level picker: once a parent task is chosen in subtask mode,
  // load that task's subtasks.
  useEffect(() => {
    if (pickerType !== "subtask" || !pickerItemId) {
      setPickerSubtasks([]);
      return;
    }
    setPickerSubtaskId("");
    setPickerSubtasksLoading(true);
    subtaskService
      .listSubtasks({ taskId: Number(pickerItemId) })
      .then(setPickerSubtasks)
      .catch(() => setPickerSubtasks([]))
      .finally(() => setPickerSubtasksLoading(false));
  }, [pickerType, pickerItemId]);

  const send = async (text) => {
    const trimmed = (text ?? message).trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setMessage("");
    setSending(true);
    try {
      const result = await aiAssistantService.query({
        message: trimmed,
        projectId: projectId ? Number(projectId) : undefined,
      });
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer }]);
    } catch (err) {
      const errMsg = getErrorMessage(err, "Sorry, I couldn't process that.");
      setMessages((prev) => [...prev, { role: "assistant", text: errMsg }]);
      toast.error(errMsg);
    } finally {
      setSending(false);
    }
  };

  const generateTestCases = async (entityType, entityId, title) => {
    const label = entityType === "task" ? "Task" : entityType === "bug" ? "Bug" : "Subtask";
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Generate test cases for ${label}: "${title || `#${entityId}`}"` },
    ]);
    setSending(true);
    try {
      const result = await aiAssistantService.generateTestCases({ entityType, entityId });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          kind: "test-cases",
          entityType,
          entityId,
          entityTitle: result.entity_title,
          count: result.count,
          rows: result.test_cases,
          csv: result.csv,
        },
      ]);
    } catch (err) {
      const errMsg = getErrorMessage(err, "Couldn't generate test cases for that item.");
      setMessages((prev) => [...prev, { role: "assistant", text: errMsg }]);
      toast.error(errMsg);
    } finally {
      setSending(false);
    }
  };

  // Regenerate: replace the last test-case message for that entity with the
  // new result so the conversation doesn't balloon with repeated generations.
  const regenerateTestCases = async (entityType, entityId, feedback) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Regenerate test cases with feedback: "${feedback}"` },
    ]);
    setRegenerating(true);
    try {
      const result = await aiAssistantService.regenerateTestCases({ entityType, entityId, feedback });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          kind: "test-cases",
          entityType,
          entityId,
          entityTitle: result.entity_title,
          count: result.count,
          rows: result.test_cases,
          csv: result.csv,
        },
      ]);
    } catch (err) {
      const errMsg = getErrorMessage(err, "Couldn't regenerate test cases.");
      setMessages((prev) => [...prev, { role: "assistant", text: errMsg }]);
      toast.error(errMsg);
    } finally {
      setRegenerating(false);
    }
  };

  const saveTestCases = async (payload) => {
    return aiAssistantService.saveTestCases(payload);
  };

  const handlePickerGenerate = () => {
    if (pickerType === "subtask") {
      if (!pickerSubtaskId) return;
      const item = pickerSubtasks.find((i) => String(i.id) === String(pickerSubtaskId));
      setPickerOpen(false);
      generateTestCases("subtask", Number(pickerSubtaskId), item?.title);
      setPickerProjectId("");
      setPickerItemId("");
      setPickerSubtaskId("");
      return;
    }
    if (!pickerItemId) return;
    const item = pickerItems.find((i) => String(i.id) === String(pickerItemId));
    setPickerOpen(false);
    generateTestCases(pickerType, Number(pickerItemId), item?.title);
    setPickerProjectId("");
    setPickerItemId("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  return (
  <div className="w-full min-w-0">
  <PageHeader
    title="AI Assistant"
    subtitle={
      projectId
        ? `Scoped to ${
            projects.find((p) => String(p.id) === String(projectId))?.name ||
            "selected project"
          } (change from the project filter in the top bar) — ask questions or generate test cases`
        : "Ask questions about your bugs, tasks, and sprints — or generate test cases from one"
    }
    actions={
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <Button
          variant="secondary"
          icon={Wand2}
          onClick={() => setPickerOpen(true)}
        >
          Generate Test Cases
        </Button>
      </div>
    }
  />

  {/* AI Chat */}
  <div
    className="
      card
      flex
      min-w-0
      flex-col
      p-3
      sm:p-4
      md:p-6
      h-[calc(100vh-11rem)]
      min-h-[500px]
      sm:h-[calc(100vh-12rem)]
      md:h-[calc(100vh-13rem)]
    "
  >
    {/* Messages */}
    <div
      ref={scrollRef}
      className="
        min-h-0
        min-w-0
        flex-1
        overflow-x-hidden
        overflow-y-auto
        pr-1
        sm:pr-2
      "
    >
      {messages.length === 0 ? (
        <div
          className="
            flex
            min-h-full
            w-full
            flex-col
            items-center
            justify-center
            gap-4
            px-1
            py-6
            text-center
            sm:px-4
          "
        >
          {/* Icon */}
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 sm:h-12 sm:w-12">
            <Sparkles size={22} />
          </span>

          {/* Welcome text */}
          <div className="w-full max-w-2xl min-w-0">
            <h3 className="break-words text-base font-semibold text-slate-800 sm:text-lg">
              Hi
              {user?.full_name
                ? `, ${user.full_name.split(" ")[0]}`
                : ""}! How can I help?
            </h3>

            <p
              className="
                mx-auto
                mt-1
                max-w-xl
                break-words
                text-xs
                leading-5
                text-slate-500
                sm:text-sm
                sm:leading-6
              "
            >
              Try one of these, ask your own question, or drag a Task/Bug onto
              &ldquo;AI Assistant&rdquo; in the sidebar to generate test cases
              for it.
            </p>
          </div>

          {/* Suggestions */}
          <div
            className="
              grid
              w-full
              max-w-2xl
              grid-cols-1
              gap-2
              sm:grid-cols-2
            "
          >
            {SUGGESTION_CARDS.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => send(s.text)}
                className="
                  flex
                  min-w-0
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-border
                  bg-white
                  px-3
                  py-3
                  text-left
                  text-sm
                  text-slate-600
                  transition-colors
                  hover:border-primary-200
                  hover:bg-primary-50/40
                  sm:px-4
                "
              >
                <s.icon
                  size={16}
                  className="mt-0.5 shrink-0 text-primary-500"
                />

                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium text-slate-700">
                    {s.text}
                  </span>

                  <span className="mt-0.5 block break-words text-xs leading-5 text-slate-400">
                    {s.hint}
                  </span>
                </span>
              </button>
            ))}

            {/* Generate test cases */}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="
                flex
                min-w-0
                items-start
                gap-3
                rounded-xl
                border
                border-primary-200
                bg-primary-50/40
                px-3
                py-3
                text-left
                text-sm
                text-slate-600
                transition-colors
                hover:bg-primary-50
                sm:px-4
              "
            >
              <Wand2
                size={16}
                className="mt-0.5 shrink-0 text-primary-500"
              />

              <span className="min-w-0 flex-1">
                <span className="block break-words font-medium text-slate-700">
                  Generate test cases
                </span>

                <span className="mt-0.5 block break-words text-xs leading-5 text-slate-400">
                  From a task or bug
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="min-w-0 space-y-4 py-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex min-w-0 gap-2 sm:gap-3 ${
                m.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  ${
                    m.role === "user"
                      ? "bg-slate-100 text-slate-500"
                      : "bg-primary-50 text-primary-600"
                  }
                `}
              >
                {m.role === "user" ? (
                  <UserIcon size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
              </span>

              {/* Message */}
              {m.kind === "test-cases" ? (
                <div className="min-w-0 max-w-[calc(100%-2.5rem)] sm:max-w-[85%] lg:max-w-[75%]">
                  <TestCaseMessage
                    msg={m}
                    projects={projects}
                    onRegenerate={regenerateTestCases}
                    onSave={saveTestCases}
                    regenerating={regenerating}
                  />
                </div>
              ) : (
                <div
                  className={`
                    min-w-0
                    max-w-[calc(100%-2.5rem)]
                    break-words
                    rounded-2xl
                    px-3
                    py-2.5
                    text-sm
                    leading-5
                    sm:max-w-[85%]
                    sm:px-4
                    sm:leading-6
                    lg:max-w-[75%]
                    ${
                      m.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-slate-50 text-slate-700"
                    }
                  `}
                  style={{ overflowWrap: "anywhere" }}
                >
                  {m.text}
                </div>
              )}
            </div>
          ))}

          {/* Thinking */}
          {(sending || regenerating) && (
            <div className="flex min-w-0 gap-2 sm:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Sparkles size={14} />
              </span>

              <div className="max-w-[calc(100%-2.5rem)] break-words rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-400 sm:px-4">
                {regenerating
                  ? "Revising test cases..."
                  : "Thinking..."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Input */}
    <form
      onSubmit={handleSubmit}
      className="
        mt-3
        flex
        min-w-0
        items-center
        gap-2
        border-t
        border-border
        pt-3
        sm:mt-4
        sm:pt-4
      "
    >
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask AI anything about your bugs, tasks, or sprints..."
        maxLength={TEXTAREA_MAX_LENGTH}
        className="
          input
          min-w-0
          flex-1
          text-sm
          sm:text-base
        "
        disabled={sending || regenerating}
      />

      <button
        type="submit"
        className="
          btn-primary
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          p-0
          sm:h-auto
          sm:w-auto
          sm:px-4
          sm:py-2
        "
        disabled={
          sending ||
          regenerating ||
          !message.trim()
        }
      >
        <Send size={16} />

        <span className="ml-2 hidden sm:inline">
          Send
        </span>
      </button>
    </form>
  </div>

  {/* Generate Test Cases picker modal */}
  <Modal
    open={pickerOpen}
    onClose={() => setPickerOpen(false)}
    title="Generate test cases"
    footer={
      <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={() => setPickerOpen(false)}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>

        <Button
          onClick={handlePickerGenerate}
          disabled={
            pickerType === "subtask"
              ? !pickerSubtaskId
              : !pickerItemId
          }
          icon={Wand2}
          className="w-full sm:w-auto"
        >
          Generate
        </Button>
      </div>
    }
  >
    <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 sm:max-h-none">
      {/* Type selector */}
      <div className="w-full overflow-x-auto">
        <div className="inline-flex min-w-max rounded-lg border border-border bg-canvas p-0.5">
          {["task", "bug", "subtask"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPickerType(t)}
              className={`
                rounded-md
                px-3
                py-1.5
                text-xs
                font-medium
                capitalize
                transition-colors
                ${
                  pickerType === t
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-slate-500"
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Project */}
      <div className="min-w-0">
        <label className="label">Project</label>

        <Select
          value={pickerProjectId}
          onChange={setPickerProjectId}
          placeholder="Select a project"
          ariaLabel="Project"
          options={projects.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
        />
      </div>

      {/* Task / Bug */}
      <div className="min-w-0">
        <label className="label">
          {pickerType === "bug"
            ? "Bug"
            : pickerType === "subtask"
              ? "Parent task"
              : "Task"}
        </label>

        {pickerLoading ? (
          <Loader label="Loading..." />
        ) : (
          <Select
            value={pickerItemId}
            onChange={setPickerItemId}
            disabled={!pickerProjectId}
            placeholder={
              pickerProjectId
                ? `Select a ${
                    pickerType === "bug"
                      ? "bug"
                      : "task"
                  }`
                : "Select a project first"
            }
            ariaLabel={
              pickerType === "bug"
                ? "Bug"
                : "Task"
            }
            options={pickerItems.map((i) => ({
              value: i.id,
              label: i.title,
            }))}
          />
        )}

        <p className="mt-1 break-words text-xs leading-5 text-slate-400">
          {pickerType === "task"
            ? "Grounded in its description, acceptance criteria, subtasks, and reference screenshots."
            : pickerType === "bug"
              ? "Grounded in its recorded fields and screenshot."
              : "Pick the task this subtask belongs to, then choose the subtask below."}
        </p>
      </div>

      {/* Subtask */}
      {pickerType === "subtask" && pickerItemId && (
        <div className="min-w-0">
          <label className="label">Subtask</label>

          {pickerSubtasksLoading ? (
            <Loader label="Loading..." />
          ) : (
            <Select
              value={pickerSubtaskId}
              onChange={setPickerSubtaskId}
              disabled={pickerSubtasks.length === 0}
              placeholder={
                pickerSubtasks.length
                  ? "Select a subtask"
                  : "This task has no subtasks yet"
              }
              ariaLabel="Subtask"
              options={pickerSubtasks.map((i) => ({
                value: i.id,
                label: i.title,
              }))}
            />
          )}

          <p className="mt-1 break-words text-xs leading-5 text-slate-400">
            Grounded in its own title/description/status
            plus the parent task&rsquo;s title, description,
            and acceptance criteria.
          </p>
        </div>
      )}
    </div>
  </Modal>
</div>
  );
}
