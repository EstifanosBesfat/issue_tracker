"use client";

import { useState } from "react";
import Link from "next/link";

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  division: { name: string } | null;
  createdAt: Date;
  assignee: { name: string | null } | null;
  reporter: { name: string | null } | null;
}

interface Props {
  issues: Issue[];
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-danger/10 text-danger",
  IN_PROGRESS: "bg-warning/15 text-warning-foreground",
  CLOSED: "bg-success/10 text-success",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-danger text-danger-foreground",
  HIGH: "bg-secondary text-secondary-foreground",
  MEDIUM: "bg-warning/15 text-warning-foreground",
  LOW: "bg-info/10 text-info",
};

export default function IssueTable({ issues }: Props) {
  const [rows, setRows] = useState(issues);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("OPEN");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((i) => i.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const applyBulkStatus = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    const res = await fetch("/api/admin/issues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    if (res.ok) {
      setRows((prev) =>
        prev.map((i) =>
          selected.has(i.id) ? { ...i, status: bulkStatus } : i,
        ),
      );
      setSelected(new Set());
    }
    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/issues/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((i) => i.id !== deleteId));
    }
    setDeleting(false);
    setDeleteId(null);
  };

  return (
    <>
      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
          <span className="text-sm font-semibold text-primary">
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="text-sm rounded border border-gray-300 px-2 py-1"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button
            onClick={applyBulkStatus}
            disabled={loading}
            className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Applying..." : "Apply Status"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === rows.length && rows.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              {[
                "Title",
                "Status",
                "Priority",
                "Division",
                "Reporter",
                "Assignee",
                "Created",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((issue) => (
              <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(issue.id)}
                    onChange={() => toggleOne(issue.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-3 max-w-xs">
                  <Link
                    href={`/issues/${issue.id}`}
                    className="font-medium text-gray-900 hover:text-secondary hover:underline truncate block"
                  >
                    {issue.title}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[issue.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${PRIORITY_COLORS[issue.priority] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {issue.priority}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500">
                  {issue.division?.name ?? "—"}
                </td>
                <td className="px-3 py-3 text-gray-500">
                  {issue.reporter?.name ?? "—"}
                </td>
                <td className="px-3 py-3 text-gray-500">
                  {issue.assignee?.name ?? "—"}
                </td>
                <td className="px-3 py-3 text-gray-400 whitespace-nowrap">
                  {new Date(issue.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setDeleteId(issue.id)}
                    className="text-xs px-2 py-1 bg-danger/10 text-danger rounded hover:bg-danger/20 transition font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Issue
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete the issue and all related comments,
              images, and activity logs.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-danger-foreground bg-danger rounded-md hover:opacity-90 disabled:opacity-50 transition"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
