import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

const SUGGESTIONS = [
  "Why is login failing?",
  "Show me the critical bugs",
  "Which module is most unstable?",
  "Summarize sprint status",
];

export default function AIAssistant() {
  const [message, setMessage] = useState("");

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Ask questions about your bugs, tasks, and projects" />

      <div className="card flex h-[calc(100vh-12rem)] flex-col p-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Sparkles size={22} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Hello! How can I help you today?</h3>
            <p className="mt-1 text-sm text-slate-500">Ask me anything about your project, bugs, or tasks.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setMessage(s)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask AI anything..."
            className="input"
          />
          <button className="btn-primary" disabled>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
