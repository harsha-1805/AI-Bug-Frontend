import { useRef } from "react";
import toast from "react-hot-toast";
import { UploadCloud, Terminal, Braces, Link2, MessageSquare, Lock } from "lucide-react";
import Input from "./Input.jsx";
import Textarea from "./Textarea.jsx";
import { validateImageFile, TEXT_MAX_LENGTH, TEXTAREA_MAX_LENGTH } from "../utils/validation.js";

/**
 * Evidence upload section for the AI Bug Generator.
 *
 * Architecture note: each evidence type is rendered from a small config
 * array (`FUTURE_EVIDENCE_TYPES`) so adding a new supported type later
 * (Screen Recording, HAR File, Playwright Trace, Cypress/Selenium
 * report, API Response, Crash Dump, PDF) is: add one entry to that
 * array + one field in the parent form state. Nothing about this
 * component's structure needs to change. They're rendered disabled/
 * "Coming soon" for now per the Phase 2 scope (upload not implemented).
 */
const FUTURE_EVIDENCE_TYPES = [
  "Screen Recording",
  "HAR File",
  "Playwright Trace",
  "Cypress Report",
  "Selenium Report",
  "API Response",
  "Crash Dump",
  "PDF",
];

export default function EvidenceUploader({
  onImageSelect,
  userDescription,
  onUserDescriptionChange,
  consoleLog,
  onConsoleLogChange,
  stackTrace,
  onStackTraceChange,
  browserUrl,
  onBrowserUrlChange,
  disabled,
}) {
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const file = files && files[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    onImageSelect(file);
  };

  return (
    <div className="card space-y-5 p-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Upload Evidence</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          A screenshot is required. Everything else helps Gemini reason more accurately.
        </p>
      </div>

      {/* Required: Screenshot */}
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-canvas px-4 py-8 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/30"
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud size={28} className="text-primary-500" />
        <div>
          <p className="text-sm font-medium text-slate-700">Click or drag a screenshot here</p>
          <p className="text-xs text-slate-400">PNG, JPG or WEBP · required · max 5MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Optional fields */}
      <div className="space-y-4">
        <div>
          <label className="label flex items-center gap-1.5">
            <MessageSquare size={14} /> User Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <Textarea
            className="resize-y"
            maxLength={TEXTAREA_MAX_LENGTH}
            placeholder="What were you doing when this happened?"
            value={userDescription}
            onChange={(e) => onUserDescriptionChange(e.target.value)}
            disabled={disabled}
          />
        </div>

        <Input
          label={
            <span className="flex items-center gap-1.5">
              <Link2 size={14} /> Browser URL <span className="font-normal text-slate-400">(optional)</span>
            </span>
          }
          placeholder="https://app.example.com/checkout"
          value={browserUrl}
          maxLength={TEXT_MAX_LENGTH}
          onChange={(e) => onBrowserUrlChange(e.target.value)}
          disabled={disabled}
        />

        <div>
          <label className="label flex items-center gap-1.5">
            <Terminal size={14} /> Console Log <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <Textarea
            className="resize-y font-mono text-xs"
            maxLength={TEXTAREA_MAX_LENGTH}
            placeholder="Paste browser console output..."
            value={consoleLog}
            onChange={(e) => onConsoleLogChange(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <Braces size={14} /> Stack Trace <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <Textarea
            className="resize-y font-mono text-xs"
            maxLength={TEXTAREA_MAX_LENGTH}
            placeholder="Paste the error stack trace..."
            value={stackTrace}
            onChange={(e) => onStackTraceChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Future evidence types — architecture placeholder, not implemented */}
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-medium text-slate-400">More evidence types coming soon</p>
        <div className="flex flex-wrap gap-2">
          {FUTURE_EVIDENCE_TYPES.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400"
            >
              <Lock size={10} /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
