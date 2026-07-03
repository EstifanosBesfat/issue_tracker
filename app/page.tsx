// app/page.tsx
import Link from "next/link";
import prisma from "@/prisma/client";

export const dynamic = 'force-dynamic';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'MOBILE_NETWORK' | 'FIBER_BROADBAND' | 'TELEBIRR_BILLING' | 'CORE_INFRASTRUCTURE' | 'OTHER';
  createdAt: Date;
  updatedAt: Date;
}

export default async function Home() {
  let issues: Issue[] = [];
  try {
    issues = (await prisma.issue.findMany()) as Issue[];
  } catch {
    // DB not available at build time — use empty fallback
  }

  const openCount = issues.filter(i => i.status === 'OPEN').length;
  const inProgressCount = issues.filter(i => i.status === 'IN_PROGRESS').length;
  const closedCount = issues.filter(i => i.status === 'CLOSED').length;
  
  // Custom Telecom KPI: Track Critical interruptions
  const criticalCount = issues.filter(i => i.priority === 'CRITICAL' && i.status !== 'CLOSED').length;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Ethio Telecom Service Desk</h1>
          <p className="text-gray-500">Regional infrastructure maintenance dashboard.</p>
        </div>
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
            {criticalCount} Critical SLA Alerts
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 mt-8">
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Telecom Outage Priorities</h2>
        <p className="text-sm text-gray-500 mb-6">Immediate active network disruptions requiring technician dispatch.</p>
        
        <div className="space-y-3">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((prio) => {
            const count = issues.filter(i => i.priority === prio && i.status !== 'CLOSED').length;
            const percent = issues.length > 0 ? (count / issues.length) * 100 : 0;
            return (
              <div key={prio} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 w-24">{prio}</span>
                <div className="w-full bg-gray-100 h-2.5 rounded-full mx-4 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${
                      prio === 'CRITICAL' ? 'bg-red-600' : prio === 'HIGH' ? 'bg-orange-500' : prio === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-800 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/issues/new" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition">
            File New Network Disruption
          </Link>
          <Link href="/issues" className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            Review Active Support Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}