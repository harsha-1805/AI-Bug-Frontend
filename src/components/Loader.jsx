import { Loader2 } from "lucide-react";

export default function Loader({ label = "Loading...", size = 20 }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Loader2 size={size} className="animate-spin text-primary-600" />
      <span>{label}</span>
    </div>
  );
}
