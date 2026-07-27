import { Sparkles } from "lucide-react";

export default function LoadingOverlay({ show, label = "Analyzing evidence with Gemini 2.5 Flash..." }) {
  if (!show) return null;

  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-30" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white">
          <Sparkles size={20} />
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-1 text-xs text-slate-400">This usually takes a few seconds</p>
      </div>
    </div>
  );
}
