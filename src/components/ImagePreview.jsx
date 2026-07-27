import { useEffect, useState } from "react";
import { ImageOff, X } from "lucide-react";

export default function ImagePreview({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) {
    return (
      <div className="card flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
        <ImageOff size={24} />
        <p className="text-sm">No screenshot selected yet</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-slate-50">
        <img src={previewUrl} alt="Screenshot preview" className="max-h-72 w-full object-contain" />
        <button
          onClick={onRemove}
          className="absolute right-2 top-2 rounded-lg bg-slate-900/60 p-1.5 text-white hover:bg-slate-900/80"
          aria-label="Remove screenshot"
        >
          <X size={14} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <p className="truncate text-xs font-medium text-slate-600">{file.name}</p>
        <p className="shrink-0 text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
    </div>
  );
}
