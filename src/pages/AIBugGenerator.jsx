import { useState } from "react";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import EvidenceUploader from "../components/EvidenceUploader.jsx";
import ImagePreview from "../components/ImagePreview.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";
import BugSummaryCard from "../components/BugSummaryCard.jsx";
import ConfidenceCard from "../components/ConfidenceCard.jsx";
import BugReportForm from "../components/BugReportForm.jsx";
import { aiBugService } from "../services/aiBugService";

export default function AIBugGenerator() {
  const [image, setImage] = useState(null);
  const [userDescription, setUserDescription] = useState("");
  const [consoleLog, setConsoleLog] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [browserUrl, setBrowserUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { bug_report, low_confidence, model_used }

  const canGenerate = Boolean(image) && !loading;

  const handleGenerate = async () => {
    if (!image) {
      toast.error("Please upload a screenshot first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await aiBugService.generateBug({
        image,
        userDescription,
        consoleLog,
        stackTrace,
        browserUrl,
      });
      setResult(data);
      toast.success("Bug report generated.");
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to generate bug report.";
      toast.error(typeof message === "string" ? message : "Failed to generate bug report.");
    } finally {
      setLoading(false);
    }
  };

  const updateBugReport = (updated) => {
    setResult((prev) => (prev ? { ...prev, bug_report: updated } : prev));
  };

  return (
    <div>
      <PageHeader
        title="AI Bug Generator"
        subtitle="Upload evidence and let Gemini 2.5 Flash draft a structured bug report"
        actions={
          <Button icon={Sparkles} loading={loading} disabled={!canGenerate} onClick={handleGenerate}>
            Generate AI Bug
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: evidence input */}
        <div className="space-y-6">
          <EvidenceUploader
            onImageSelect={setImage}
            userDescription={userDescription}
            onUserDescriptionChange={setUserDescription}
            consoleLog={consoleLog}
            onConsoleLogChange={setConsoleLog}
            stackTrace={stackTrace}
            onStackTraceChange={setStackTrace}
            browserUrl={browserUrl}
            onBrowserUrlChange={setBrowserUrl}
            disabled={loading}
          />
          <ImagePreview file={image} onRemove={() => setImage(null)} />
        </div>

        {/* Right: generated output */}
        <div className="space-y-6">
          <LoadingOverlay show={loading} />

          {!loading && !result && (
            <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center text-slate-400">
              <Sparkles size={24} />
              <p className="text-sm">Your generated bug report will appear here</p>
            </div>
          )}

          {!loading && result && (
            <>
              <BugSummaryCard bugReport={result.bug_report} />
              <ConfidenceCard score={result.bug_report.confidence_score} />
              <BugReportForm bugReport={result.bug_report} onChange={updateBugReport} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}