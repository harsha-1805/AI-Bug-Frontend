import { Plus } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";

const DUMMY_MILESTONES = [
  { label: "v1.0.0", status: "Planned" },
  { label: "v1.1.0", status: "Planned" },
  { label: "v1.2.0", status: "Planned" },
];

export default function Releases() {
  return (
    <div>
      <PageHeader
        title="Releases"
        subtitle="A timeline of upcoming and past releases"
        actions={<Button icon={Plus}>New Release</Button>}
      />

      <div className="card p-6">
        <div className="relative ml-3 space-y-8 border-l-2 border-dashed border-border pl-6">
          {DUMMY_MILESTONES.map((m) => (
            <div key={m.label} className="relative">
              <span className="absolute -left-[1.9rem] top-1 h-3 w-3 rounded-full border-2 border-primary-500 bg-white" />
              <p className="text-sm font-semibold text-slate-800">{m.label}</p>
              <p className="text-xs text-slate-400">{m.status} — release timeline module coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
