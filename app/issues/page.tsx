import prisma from "@/prisma/client";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export default async function IssuesPage() {
  const issues = (await prisma.issue.findMany()) as Issue[];

  return (
    <div className="max-w-5xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Issues List</h1>
          <p className="text-gray-500 mt-1">Manage and track your reported development tasks.</p>
        </div>
        <Link
          href="/issues/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          New Issue
        </Link>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No issues found. Create a new issue to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Title</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date Logged</th>
                <th className="relative py-3.5 pl-3 pr-6 text-right text-sm">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {issues.map((issue: Issue) => (
                <tr key={issue.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                    <Link href={`/issues/${issue.id}`} className="hover:underline text-indigo-600">
                      {issue.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                      issue.status === 'OPEN' 
                        ? 'bg-red-50 text-red-700 ring-red-600/10' 
                        : issue.status === 'IN_PROGRESS' 
                        ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' 
                        : 'bg-green-50 text-green-700 ring-green-600/20'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(issue.createdAt).toDateString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                    <Link href={`/issues/${issue.id}`} className="text-indigo-600 hover:text-indigo-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}