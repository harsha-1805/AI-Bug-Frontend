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
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/apiError.js";
import { downloadCsv } from "../utils/downloadCsv.js";
import { takePendingTestCaseRequest } from "../utils/aiHandoff.js";

// The 5 basic capabilities the backend's intent router actually
// understands right now (see app/services/ai_assistant_service.py).
// Anything outside these falls back to a single grounded Gemini call —
// intentionally minimal for v1, matching the "basic for now" scope.
const SUGGESTION_CARDS = [
  { icon: Bug, text: "Show me the open bugs", hint: "Filter bugs" },
  { icon: LayoutGrid, text: "Summarize the bugs", hint: "Bug summary" },
  { icon: Search, text: "Search bugs for login", hint: "Search bugs" },
  { icon: Rocket, text: "What's the sprint status?", hint: "Sprint analysis" },
  { icon: ListTree, text: "Which module is most unstable?", hint: "Module analysis" },
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  // Each entry is either a plain chat bubble ({ role, text }) or a
  // test-case result ({ role: "assistant", kind: "test-cases",
  // entityType, entityTitle, count, rows, csv }) rendered with its own
  // preview + Download CSV button.
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const scrollRef = useRef(null);

  // Manual "Generate Test Cases" picker — the reliable alternative to
  // dragging a card onto the Sidebar's AI Assistant link: pick a
  // project, then a task or bug from it, no drag required.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerProjectId, setPickerProjectId] = useState("");
  const [pickerType, setPickerType] = useState("task");
  const [pickerItems, setPickerItems] = useState([]);
  const [pickerItemId, setPickerItemId] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => setProjects(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Pick up a Task/Bug handed off by a drag onto the Sidebar's "AI
  // Assistant" link, or a card/row's "Generate test cases" action —
  // see utils/aiHandoff.js. Runs once on mount, after either route.
  useEffect(() => {
    const pending = takePendingTestCaseRequest();
    if (pending?.entityType && pending?.entityId) {
      generateTestCases(pending.entityType, pending.entityId, pending.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the picker's project changes, load that project's tasks
  // or bugs for the item dropdown.
  useEffect(() => {
    if (!pickerOpen || !pickerProjectId) {
      setPickerItems([]);
      return;
    }
    setPickerItemId("");
    setPickerLoading(true);
    const loader =
      pickerType === "task"
        ? taskService.listTasks({ projectId: Number(pickerProjectId) })
        : bugService.listBugs({ projectId: Number(pickerProjectId), pageSize: 100 }).then((d) => d.items);
    loader.then(setPickerItems).catch(() => setPickerItems([])).finally(() => setPickerLoading(false));
  }, [pickerOpen, pickerProjectId, pickerType]);

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

  // --- AI test case generation ---------------------------------------------
  const generateTestCases = async (entityType, entityId, title) => {
    const label = entityType === "task" ? "Task" : "Bug";
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

  const handlePickerGenerate = () => {
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
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask questions about your bugs, tasks, and sprints — or generate test cases from one"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={Wand2} onClick={() => setPickerOpen(true)}>
              Generate Test Cases
            </Button>
            <Select
              className="w-56"
              value={projectId}
              onChange={setProjectId}
              placeholder="All projects"
              ariaLabel="Scope to project"
              options={[{ value: "", label: "All projects" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </div>
        }
      />

      <div className="card flex h-[calc(100vh-13rem)] flex-col p-6">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Sparkles size={22} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Hi{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! How can I help?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try one of these, ask your own question, or drag a Task/Bug onto "AI Assistant" in the
                  sidebar to generate test cases for it.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTION_CARDS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="flex items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left text-sm text-slate-600 hover:border-primary-200 hover:bg-primary-50/40"
                  >
                    <s.icon size={16} className="mt-0.5 shrink-0 text-primary-500" />
                    <span>
                      <span className="block font-medium text-slate-700">{s.text}</span>
                      <span className="text-xs text-slate-400">{s.hint}</span>
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/40 px-4 py-3 text-left text-sm text-slate-600 hover:bg-primary-50"
                >
                  <Wand2 size={16} className="mt-0.5 shrink-0 text-primary-500" />
                  <span>
                    <span className="block font-medium text-slate-700">Generate test cases</span>
                    <span className="text-xs text-slate-400">From a task or bug</span>
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      m.role === "user" ? "bg-slate-100 text-slate-500" : "bg-primary-50 text-primary-600"
                    }`}
                  >
                    {m.role === "user" ? <UserIcon size={14} /> : <Sparkles size={14} />}
                  </span>

                  {m.kind === "test-cases" ? (
                    <div className="max-w-[85%] rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3 text-sm text-slate-700">
                      <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
                        <FileSpreadsheet size={15} className="text-primary-600" />
                        {m.count} test case{m.count === 1 ? "" : "s"} generated for &ldquo;{m.entityTitle}&rdquo;
                      </div>
                      <div className="max-h-56 overflow-auto rounded-lg border border-border bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-2.5 py-1.5 font-medium">Title</th>
                              <th className="px-2.5 py-1.5 font-medium">Type</th>
                              <th className="px-2.5 py-1.5 font-medium">Priority</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.rows.slice(0, 6).map((row, idx) => (
                              <tr key={idx} className="border-t border-border">
                                <td className="max-w-[220px] truncate px-2.5 py-1.5">{row["Title"]}</td>
                                <td className="px-2.5 py-1.5 text-slate-500">{row["Type"]}</td>
                                <td className="px-2.5 py-1.5 text-slate-500">{row["Priority"]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {m.rows.length > 6 && (
                          <p className="px-2.5 py-1.5 text-[11px] text-slate-400">
                            +{m.rows.length - 6} more in the CSV
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadCsv(m.csv, `test-cases-${m.entityTitle}`)}
                        className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        <Download size={13} /> Download CSV
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user" ? "bg-primary-600 text-white" : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <Sparkles size={14} />
                  </span>
                  <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-400">Thinking...</div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask AI anything about your bugs, tasks, or sprints..."
            className="input"
            disabled={sending}
          />
          <button type="submit" className="btn-primary" disabled={sending || !message.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Generate test cases"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePickerGenerate} disabled={!pickerItemId} icon={Wand2}>
              Generate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="inline-flex rounded-lg border border-border bg-canvas p-0.5">
            {["task", "bug"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPickerType(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  pickerType === t ? "bg-white text-primary-700 shadow-sm" : "text-slate-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Project</label>
            <Select
              value={pickerProjectId}
              onChange={setPickerProjectId}
              placeholder="Select a project"
              ariaLabel="Project"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
          <div>
            <label className="label">{pickerType === "task" ? "Task" : "Bug"}</label>
            {pickerLoading ? (
              <Loader label="Loading..." />
            ) : (
              <Select
                value={pickerItemId}
                onChange={setPickerItemId}
                disabled={!pickerProjectId}
                placeholder={pickerProjectId ? `Select a ${pickerType}` : "Select a project first"}
                ariaLabel={pickerType === "task" ? "Task" : "Bug"}
                options={pickerItems.map((i) => ({ value: i.id, label: i.title }))}
              />
            )}
            <p className="mt-1 text-xs text-slate-400">
              {pickerType === "task"
                ? "Grounded in its description, acceptance criteria, subtasks, and reference screenshots."
                : "Grounded in its recorded fields and screenshot."}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
