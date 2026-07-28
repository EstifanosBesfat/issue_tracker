"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge, OverdueBadge, DueDateDisplay } from "@/app/components";
import { getDueDateStatus } from "@/app/lib/dueDateUtils";
import type { IssueListItem } from "@/app/types/issue";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/* ------------------------------------------------------------------ */
/* Status badge                                                          */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, string> = {
  OPEN:        "bg-primary",
  IN_PROGRESS: "bg-warning",
  CLOSED:      "bg-success",
};

function StatusBadge({ status }: { status: string }) {
  const dotClass = statusVariant[status] ?? "bg-gray-400";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true"></span>
      {status.replace("_", " ")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Column definitions                                                    */
/* ------------------------------------------------------------------ */

const SORTABLE_COLUMNS = ["title", "status", "priority", "createdAt", "dueDate"] as const;
type SortableColumn = typeof SORTABLE_COLUMNS[number];

const columnHelper = createColumnHelper<IssueListItem>();

const columns = [
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => {
      const issue = info.row.original;
      const dueDateStatus = getDueDateStatus(
        issue.dueDate ? new Date(issue.dueDate) : null,
        issue.status,
      );
      return (
        <div className="flex items-center gap-2 max-w-xs">
          <Link
            href={`/issues/${issue.id}`}
            className="hover:text-secondary hover:underline truncate block font-medium text-gray-900"
          >
            {info.getValue()}
          </Link>
          {dueDateStatus === "overdue" && <OverdueBadge />}
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("priority", {
    header: "Priority",
    cell: (info) => <PriorityBadge priority={info.getValue()} />,
  }),
  columnHelper.accessor("division", {
    header: "Division",
    enableSorting: false,
    cell: (info) => (
      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
        {info.getValue()?.name ?? "—"}
      </span>
    ),
  }),
  columnHelper.accessor("dueDate", {
    header: "Due Date",
    cell: (info) => {
      const issue = info.row.original;
      return (
        <DueDateDisplay
          dueDate={issue.dueDate ? new Date(issue.dueDate) : null}
          status={issue.status}
        />
      );
    },
  }),
  columnHelper.accessor("assignee", {
    header: "Assigned To",
    enableSorting: false,
    cell: (info) => (
      <span className="text-gray-500">{info.getValue()?.name ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) =>
      new Date(info.getValue()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
  }),
];

/* ------------------------------------------------------------------ */
/* Skeleton rows (loading state)                                        */
/* ------------------------------------------------------------------ */

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

interface Props {
  data:        IssueListItem[];
  isLoading:   boolean;
  isFetching:  boolean;
  orderBy?:    string;
  direction?:  string;
}

export default function IssuesDataTable({
  data,
  isLoading,
  isFetching,
  orderBy  = "createdAt",
  direction = "desc",
}: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const handleSort = useCallback(
    (columnId: string) => {
      if (!(SORTABLE_COLUMNS as readonly string[]).includes(columnId)) return;
      const params = new URLSearchParams(searchParams.toString());
      const newDir =
        orderBy === columnId && direction === "asc" ? "desc" : "asc";
      params.set("orderBy",   columnId);
      params.set("direction", newDir);
      params.delete("page");
      router.replace(`/issues?${params.toString()}`);
    },
    [router, searchParams, orderBy, direction],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // server-side
    autoResetPageIndex: false,
  });

  return (
    <div className={`rounded-lg border border-gray-200 bg-white overflow-hidden shadow-none transition-opacity ${isFetching && !isLoading ? "opacity-70" : "opacity-100"}`}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-50 border-b border-gray-200">
              {headerGroup.headers.map((header) => {
                const colId     = header.column.id;
                const isSortable = (SORTABLE_COLUMNS as readonly string[]).includes(colId);
                const isActive  = orderBy === colId;

                const colClassName =
                  colId === "division" ? "hidden md:table-cell" :
                  colId === "dueDate"  ? "hidden md:table-cell" :
                  colId === "assignee" ? "hidden lg:table-cell" : "";

                return (
                  <TableHead key={header.id} className={colClassName}>
                    {isSortable ? (
                      <button
                        onClick={() => handleSort(colId)}
                        className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isActive ? (
                          direction === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-gray-900" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-gray-900" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500">
                No tickets found. Try adjusting your filters or create a new ticket.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0 transition-colors">
                {row.getVisibleCells().map((cell) => {
                  const colId = cell.column.id;
                  const colClassName =
                    colId === "division" ? "hidden md:table-cell" :
                    colId === "dueDate"  ? "hidden md:table-cell" :
                    colId === "assignee" ? "hidden lg:table-cell" : "";
                  return (
                    <TableCell key={cell.id} className={colClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
