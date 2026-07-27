import { Plus } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "inProgress", label: "In Progress" },
  { key: "review", label: "In Review" },
  { key: "done", label: "Done" },
];

export default function Tasks() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="A kanban view of everything your team is working on"
        actions={<Button icon={Plus}>New Task</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="card flex min-h-[320px] flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">0</span>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-xs text-slate-400">
              No tasks yet
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
