// app/page.tsx
import Link from "next/link";
import prisma from "@/prisma/client";

export const dynamic = 'force-dynamic';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export default async function Home() {
  const issues = (await prisma.issue.findMany()) as Issue[];
  
  const openCount = issues.filter((i: Issue) => i.status === 'OPEN').length;
  const inProgressCount = issues.filter((i: Issue) => i.status === 'IN_PROGRESS').length;
  const closedCount = issues.filter((i: Issue) => i.status === 'CLOSED').length;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Quick overview of your active tasks and bug tickets.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100 flex flex-col justify-between">
          <span className="text-sm font-medium text-red-600 uppercase">Open Issues</span>
          <span className="text-4xl font-bold text-gray-900 mt-2">{openCount}</span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100 flex flex-col justify-between">
          <span className="text-sm font-medium text-yellow-600 uppercase">In Progress</span>
          <span className="text-4xl font-bold text-gray-900 mt-2">{inProgressCount}</span>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100 flex flex-col justify-between">
          <span className="text-sm font-medium text-green-600 uppercase">Closed</span>
          <span className="text-4xl font-bold text-gray-900 mt-2">{closedCount}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/issues/new" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition">
            Create Issue
          </Link>
          <Link href="/issues" className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            View All Issues
          </Link>
        </div>
      </div>
    </div>
  );
}