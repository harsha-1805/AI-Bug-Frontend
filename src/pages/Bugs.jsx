import { Plus } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";

const columns = [
  { key: "key", header: "Key" },
  { key: "summary", header: "Summary" },
  {
    key: "priority",
    header: "Priority",
    render: (row) => <Badge tone={row.priorityTone}>{row.priority}</Badge>,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone="info">{row.status}</Badge>,
  },
  { key: "assignee", header: "Assignee" },
];

export default function Bugs() {
  return (
    <div>
      <PageHeader
        title="Bugs"
        subtitle="Track, triage, and resolve issues across every project"
        actions={<Button icon={Plus}>Create Bug</Button>}
      />

      <div className="mb-5 flex items-center gap-3">
        <SearchBar placeholder="Search bugs..." className="max-w-sm" />
        <span className="text-sm text-slate-400">Filters and bulk actions will appear here</span>
      </div>

      <Table columns={columns} data={[]} emptyMessage="No bugs yet — this table will populate once bug tracking is enabled." />
    </div>
  );
}
