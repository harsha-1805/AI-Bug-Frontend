import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Box,
  Paper,
} from "@mui/material";
import { ChevronRight, ChevronDown } from "lucide-react";

/**
 * Material UI "collapsible table" (Table + Collapse + IconButton, the
 * standard MUI pattern) used anywhere a row needs an expandable detail
 * section — Tasks table view (task -> subtasks) and Sprints table view
 * (sprint -> tasks).
 *
 * This is a plain MUI <Table>, not the @mui/x-data-grid used by the
 * existing Table.jsx — DataGrid's master-detail row expansion is a Pro
 * (paid) feature, so a hand-rolled Collapse-based table is used instead
 * wherever nested rows are needed.
 *
 * columns: [{ key, header, width?, render(row) }]
 * data: array of rows, each needs a unique id (see getRowId)
 * renderExpanded(row): content shown when a row is expanded. If this prop
 *   is omitted, or returns null/undefined for a given row, that row has no
 *   expand arrow at all (e.g. a sprint with a project column doesn't need
 *   one).
 * onExpand(row): fired the first time a row is opened — used to lazily
 *   fetch subtasks/tasks instead of loading everything up front.
 */
const cellSx = {
  borderBottom: "1px solid #e6e6ee",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "0.875rem",
  color: "#334155",
  verticalAlign: "top",
  py: 1.5,
};

const headerCellSx = {
  ...cellSx,
  fontWeight: 500,
  fontSize: "0.8125rem",
  color: "#64748b",
  backgroundColor: "rgba(248, 250, 252, 0.8)",
};

export default function CollapsibleTable({
  columns,
  data = [],
  getRowId = (row) => row.id,
  renderExpanded,
  onExpand,
  emptyMessage = "No data available",
  rowSx,
}) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggle = (row) => {
    const id = getRowId(row);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        onExpand?.(row);
      }
      return next;
    });
  };

  if (data.length === 0) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <TableContainer
      component={Paper}
      className="card"
      sx={{ boxShadow: "none", border: 0, borderRadius: "inherit", overflow: "auto" }}
    >
      <Table sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headerCellSx, width: 44 }} />
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ ...headerCellSx, width: col.width }}>
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => {
            const id = getRowId(row);
            const expanded = expandedIds.has(id);
            const expandable = Boolean(renderExpanded);
            return (
              <Fragment key={id}>
                <TableRow hover sx={rowSx ? rowSx(row) : undefined}>
                  <TableCell sx={cellSx}>
                    {expandable && (
                      <IconButton
                        size="small"
                        onClick={() => toggle(row)}
                        aria-label={expanded ? "Collapse row" : "Expand row"}
                      >
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </IconButton>
                    )}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={cellSx}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
                {expandable && (
                  <TableRow>
                    <TableCell
                      sx={{ py: 0, borderBottom: expanded ? "1px solid #e6e6ee" : 0 }}
                      colSpan={columns.length + 1}
                    >
                      <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, backgroundColor: "rgba(248, 250, 252, 0.6)" }}>
                          {renderExpanded(row)}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
