import { useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";

/**
 * Material UI Data Grid adapter for the app's existing table API.
 * Pages can continue supplying `{ key, header, render }` columns while
 * gaining keyboard navigation and sortable fields.
 *
 * Pagination note: several pages (UserManagement, Bugs, ...) already do
 * their own SERVER-side pagination — a `page`/`pageSize` + Previous/Next
 * control that re-fetches a new slice from the API. DataGrid's built-in
 * pagination is CLIENT-side (it just re-slices whatever `data` it was
 * given). Turning both on at once double-paginates: DataGrid would chop
 * the already-paginated 20 rows into pages of 10 underneath the page's
 * own Previous/Next buttons, silently hiding half of what was fetched.
 * So the grid's footer/pagination is disabled here — the host page stays
 * the single source of truth for paging, exactly like the old plain
 * `<table>` did.
 */
export default function Table({ columns = [], data = [], emptyMessage = "No data available", showPagination = true }) {
  const rows = useMemo(
    () => data.map((row, index) => (row.id === undefined || row.id === null ? { ...row, id: `row-${index}` } : row)),
    [data]
  );

  const gridColumns = useMemo(
    () =>
      columns.map((column) => {
        const isActionColumn = column.key === "actions";

        return {
          field: column.key,
          headerName: column.header,
          minWidth: column.minWidth ?? (isActionColumn ? 96 : 140),
          width: isActionColumn ? 96 : undefined,
          flex: isActionColumn ? 0 : column.flex ?? 1,
          sortable: column.sortable ?? !isActionColumn,
          filterable: column.filterable ?? !isActionColumn,
          align: column.align,
          headerAlign: column.headerAlign ?? column.align,
          renderCell: column.render ? (params) => column.render(params.row) : undefined,
        };
      }),
    [columns]
  );

  const EmptyOverlay = () => (
    <div className="flex h-full items-center justify-center px-4 text-sm text-slate-400">{emptyMessage}</div>
  );

  return (
    <div className="card overflow-hidden">
      <DataGrid
        autoHeight
        rows={rows}
        columns={gridColumns}
        pagination={showPagination}
        hideFooter={!showPagination}
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        disableRowSelectionOnClick
        disableColumnMenu
        getRowHeight={() => "auto"}
        slots={{ noRowsOverlay: EmptyOverlay }}
        sx={{
          border: 0,
          color: "#334155",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          "& .MuiDataGrid-columnHeaders": {
            minHeight: "48px !important",
            borderBottom: "1px solid #e6e6ee",
            backgroundColor: "rgba(248, 250, 252, 0.8)",
          },
          "& .MuiDataGrid-columnHeaderTitle": { fontSize: "0.875rem", fontWeight: 500, color: "#64748b" },
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
            minHeight: "58px !important",
            borderBottom: "1px solid #e6e6ee",
            outline: "none !important",
          },
          "& .MuiDataGrid-row:last-child .MuiDataGrid-cell": { borderBottom: 0 },
          "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(248, 250, 252, 0.7)" },
          "& .MuiDataGrid-footerContainer": { minHeight: 52, borderTop: "1px solid #e6e6ee" },
          "& .MuiTablePagination-root, & .MuiDataGrid-selectedRowCount": { color: "#64748b" },
          "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "#94a3b8" },
          "& .MuiDataGrid-overlay": { minHeight: 160 },
        }}
      />
    </div>
  );
}
