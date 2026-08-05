import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, Send, Bug, ListTree, Search, Rocket, LayoutGrid, User as UserIcon } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Select from "../components/Select.jsx";
import { aiAssistantService } from "../services/aiAssistantService";
import { projectService } from "../services/projectService";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/apiError.js";

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
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', text }
  const [sending, setSending] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    projectService
      .listProjects({ pageSize: 100 })
      .then((data) => setProjects(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask questions about your bugs, tasks, and sprints"
        actions={
          <Select
            className="w-56"
            value={projectId}
            onChange={setProjectId}
            placeholder="All projects"
            ariaLabel="Scope to project"
            options={[{ value: "", label: "All projects" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
          />
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
                  Try one of these, or ask your own question about bugs, tasks, or sprints.
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
                  <div
                    className={`max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user" ? "bg-primary-600 text-white" : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {m.text}
                  </div>
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
    </div>
  );
}
