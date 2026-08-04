import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Sparkles, X, Send } from "lucide-react";
import { aiAssistantService } from "../services/aiAssistantService";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/apiError.js";

/**
 * Per-module context: which page the icon was opened from (sent to the
 * backend as `module` so a generic "summarize this" resolves to the
 * right kind of summary — see ai_assistant_service.py's
 * _MODULE_HANDLERS), plus a label and a couple of quick-prompt
 * suggestions relevant to that specific page.
 */
const MODULE_CONTEXT = {
  "/dashboard": { module: "dashboard", label: "Dashboard", prompts: ["Summarize the bugs", "Which module has more bugs and who has them assigned to?"] },
  "/projects": { module: "projects", label: "Projects", prompts: ["Summarize the bugs", "Who created this project?"] },
  "/ai-bug-generator": { module: "ai-bug-generator", label: "AI Bug Generator", prompts: ["Summarize the bugs", "Find bugs similar to #1"] },
  "/bugs": { module: "bugs", label: "Bugs", prompts: ["Show me the open bugs", "Who are the open bugs assigned to?", "Find bugs similar to #1"] },
  "/tasks": { module: "tasks", label: "Tasks", prompts: ["Task summary", "What are my tasks?"] },
  "/sprints": { module: "sprints", label: "Sprints", prompts: ["What's the sprint status?", "Who created the sprint?"] },
  "/reports": { module: "reports", label: "Reports", prompts: ["Give me a weekly digest", "Summarize the bugs"] },
  "/audit-log": { module: "audit-log", label: "Audit Log", prompts: ["What changed this week?", "Who created this?"] },
  "/admin/users": { module: "users", label: "User Management", prompts: ["How many roles do we have?", "List users and their roles"] },
};

function contextFor(pathname) {
  return MODULE_CONTEXT[pathname] || { module: undefined, label: "This page", prompts: ["Summarize the bugs"] };
}

export default function AIAssistantWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const ctx = contextFor(location.pathname);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // One continuous conversation for the whole workspace — it does NOT
  // reset when the person navigates to a different page/module. Only
  // the quick-prompt suggestions (shown before the first message) and
  // the `module` hint sent to the backend change with the page.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Skip on auth pages, and on the dedicated full-page AI Assistant
  // where a floating shortcut to itself would be redundant.
  if (["/login", "/signup", "/ai-assistant"].includes(location.pathname)) return null;

  const send = async (text) => {
    const trimmed = (text ?? message).trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setMessage("");
    setSending(true);
    try {
      const result = await aiAssistantService.query({ message: trimmed, module: ctx.module });
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer }]);
    } catch (err) {
      const errMsg = getErrorMessage(err, "Sorry, I couldn't process that.");
      setMessages((prev) => [...prev, { role: "assistant", text: errMsg }]);
      toast.error(errMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Single floating icon, fixed to the bottom-right corner on every
          page — one common assistant, not a per-module one. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask AI Assistant"
        title="Ask AI Assistant"
        className={`fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 ${
          open ? "hidden" : ""
        }`}
      >
        <Sparkles size={20} />
      </button>

      {/* Slide-over chat panel, scoped to the current module */}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/20" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl sm:m-3 sm:h-[calc(100%-1.5rem)] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Sparkles size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">AI Assistant</p>
                  <p className="text-xs text-slate-400">Ask about anything in your workspace</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">
                    Hi{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! Ask me anything about your bugs,
                    tasks, sprints, or team — I can help across every module. Some ideas for {ctx.label.toLowerCase()}:
                  </p>
                  {ctx.prompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="block w-full rounded-xl border border-border px-3 py-2 text-left text-xs text-slate-600 hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${
                        m.role === "user" ? "bg-primary-600 text-white" : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {sending && <div className="rounded-2xl bg-slate-50 px-3.5 py-2 text-sm text-slate-400">Thinking...</div>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Ask about ${ctx.label.toLowerCase()}...`}
                className="input"
                disabled={sending}
              />
              <button type="submit" className="btn-primary px-3" disabled={sending || !message.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
