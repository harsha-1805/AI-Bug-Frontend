import { HelpCircle } from "lucide-react";

/**
 * Purely a renderer — the questions themselves always come from the
 * backend (Gemini's dynamic output), never hardcoded here. Renders
 * nothing when the list is empty (i.e. the AI was confident enough
 * that no clarification is needed).
 */
export default function FollowUpQuestions({ questions = [] }) {
  if (!questions.length) return null;

  return (
    <div className="card border-amber-200 bg-amber-50/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
        <HelpCircle size={16} />
        Follow-up Questions
      </div>
      <ul className="space-y-1.5">
        {questions.map((q, i) => (
          <li key={i} className="flex gap-2 text-sm text-amber-900">
            <span className="text-amber-500">•</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
