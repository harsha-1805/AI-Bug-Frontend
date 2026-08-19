import { useMemo, useState } from "react";
import Table from "../components/Table.jsx";
import Select from "../components/Select";

const SEVERITIES = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

export default function Bugs({ data }) {
  const [severityFilter, setSeverityFilter] = useState("all");

  const severityOptions = [
    { value: "all", label: "All severities" },
    ...SEVERITIES.map((s) => ({
      value: s,
      label: s,
    })),
  ];

  const columns = useMemo(
    () => [
      {
        key: "title",
        label: "Title",
        render: (bug) => (
          <span className="font-medium text-slate-700">
            {bug.title}
          </span>
        ),
      },
      {
        key: "severity",
        label: "Severity",
        render: (bug) => (
          <span className="text-sm text-slate-600">
            {bug.severity || "-"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (bug) => (
          <span className="text-sm text-slate-600">
            {bug.status || "-"}
          </span>
        ),
      },
    ],
    []
  );

  // All / empty = show every bug
  const bugs = useMemo(() => {
    const allBugs = data?.items || [];

    if (!severityFilter || severityFilter === "all") {
      return allBugs;
    }

    return allBugs.filter(
      (bug) => bug.severity === severityFilter
    );
  }, [data?.items, severityFilter]);

  return (
    <div className="space-y-4">
      {/* Severity Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          className="w-auto min-w-[9.5rem]"
          value={severityFilter}
          onChange={setSeverityFilter}
          placeholder="All severities"
          ariaLabel="Filter by severity"
          options={severityOptions}
        />
      </div>

      {/* Reusable Table Component */}
      <Table
        columns={columns}
        data={bugs}
        emptyMessage="No bugs match these filters."
      />
    </div>
  );
}