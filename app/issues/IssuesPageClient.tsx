"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useIssuesQuery } from "./useIssuesQuery";
import IssueFilters from "./IssueFilters";
import IssuesDataTable from "./IssuesDataTable";
import Pagination from "@/app/components/Pagination";
import ExportButton from "./ExportButton";

export default function IssuesPageClient() {
  const searchParams = useSearchParams();

  // Read current URL params
  const q          = searchParams.get("q")          ?? undefined;
  const status     = searchParams.get("status")     ?? undefined;
  const priority   = searchParams.get("priority")   ?? undefined;
  const department = searchParams.get("department") ?? undefined;
  const orderBy    = searchParams.get("orderBy")    ?? "createdAt";
  const direction  = searchParams.get("direction")  ?? "desc";
  const page       = searchParams.get("page")       ?? "1";

  const { data, isLoading, isFetching } = useIssuesQuery({
    q, status, priority, department, orderBy, direction, page,
  });

  // Build export URL from current filters (no page param)
  const exportParams = new URLSearchParams();
  if (status)     exportParams.set("status",     status);
  if (priority)   exportParams.set("priority",   priority);
  if (department) exportParams.set("department", department);
  if (q)          exportParams.set("q",          q);

  return (
    <div className="max-w-6xl mx-auto">
      {/* ---- Page header ---- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage network infrastructure incidents and service requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton exportUrl={`/api/issues/export?${exportParams.toString()}`} />
          <Link
            href="/issues/new"
            className="rounded-md bg-[#00A651] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3d] transition"
          >
            + New Ticket
          </Link>
        </div>
      </div>

      {/* ---- Filters ---- */}
      <IssueFilters
        currentStatus={status     ?? ""}
        currentPriority={priority  ?? ""}
        currentDepartment={department ?? ""}
        currentOrderBy={orderBy}
        currentDirection={direction}
        currentSearch={q ?? ""}
      />

      {/* ---- Table ---- */}
      <IssuesDataTable
        data={data?.issues ?? []}
        isLoading={isLoading}
        isFetching={isFetching}
        orderBy={orderBy}
        direction={direction}
      />

      {/* ---- Pagination ---- */}
      {data && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
        />
      )}
    </div>
  );
}
