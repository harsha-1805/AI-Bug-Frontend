import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ScrollText } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";
import Select from "../components/Select.jsx";
import Loader from "../components/Loader.jsx";
import Button from "../components/Button.jsx";
import { auditService } from "../services/auditService";
import { getErrorMessage } from "../utils/apiError.js";

const ENTITY_TYPES = ["Project", "Sprint", "Task", "SubTask", "Bug"];

const ACTION_TONE = {
  created: "success",
  updated: "info",
  moved: "medium",
  status_changed: "medium",
  assigned: "info",
  deleted: "low",
};

export default function AuditLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [entityType, setEntityType] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditService.listAuditLogs({
        entityType: entityType || undefined,
        page,
        pageSize,
      });
      setLogs(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load audit log"));
    } finally {
      setLoading(false);
    }
  }, [entityType, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = [
    {
      key: "created_at",
      header: "When",
      minWidth: 170,
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
    {
      key: "actor_name",
      header: "Who",
      render: (row) => row.actor_name || "System",
    },
    {
      key: "entity_type",
      header: "Module",
      render: (row) => <Badge tone="neutral">{row.entity_type}</Badge>,
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Badge tone={ACTION_TONE[row.action] || "neutral"}>
          {row.action.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "description",
      header: "Details",
      flex: 2,
      render: (row) => <span className="text-sm text-slate-600">{row.description}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Who did what, and when — across projects, sprints, tasks, subtasks, and bugs"
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <Select
            value={entityType}
            onChange={(v) => {
              setPage(1);
              setEntityType(v);
            }}
            placeholder="All modules"
            ariaLabel="Filter by module"
            options={ENTITY_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <span className="text-sm text-slate-400">{total} entr{total === 1 ? "y" : "ies"}</span>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center p-10">
          <Loader label="Loading audit log..." />
        </div>
      ) : logs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
          <ScrollText className="text-slate-300" size={32} />
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        </div>
      ) : (
        <>
          <Table columns={columns} data={logs} showPagination={false} />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
