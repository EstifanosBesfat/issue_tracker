// app/page.tsx
import Link from "next/link";
import prisma from "@/prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Ethio Telecom Service Desk</h1>
          <p className="text-muted-foreground mt-1">Regional infrastructure maintenance dashboard.</p>
        </div>
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive"></span>
            {criticalCount} Critical SLA Alerts
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <Card className="border-red-100 dark:border-red-900/20 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-500 uppercase">Open Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold">{openCount}</span>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-100 dark:border-yellow-900/20 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-500 uppercase">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold">{inProgressCount}</span>
          </CardContent>
        </Card>

        <Card className="border-green-100 dark:border-green-900/20 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-500 uppercase">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold">{closedCount}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Telecom Outage Priorities</CardTitle>
          <CardDescription>Immediate active network disruptions requiring technician dispatch.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((prio) => {
              const count = issues.filter(i => i.priority === prio && i.status !== 'CLOSED').length;
              const activeIssuesTotal = issues.filter(i => i.status !== 'CLOSED').length;
              const percent = activeIssuesTotal > 0 ? (count / activeIssuesTotal) * 100 : 0;
              
              const priorityColorClass = 
                prio === 'CRITICAL' ? '[&_[data-slot=progress-indicator]]:bg-red-600 dark:[&_[data-slot=progress-indicator]]:bg-red-500' : 
                prio === 'HIGH' ? '[&_[data-slot=progress-indicator]]:bg-orange-500 dark:[&_[data-slot=progress-indicator]]:bg-orange-400' : 
                prio === 'MEDIUM' ? '[&_[data-slot=progress-indicator]]:bg-yellow-500 dark:[&_[data-slot=progress-indicator]]:bg-yellow-400' : 
                '[&_[data-slot=progress-indicator]]:bg-blue-500 dark:[&_[data-slot=progress-indicator]]:bg-blue-400';

              return (
                <div key={prio} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold w-24 text-muted-foreground">{prio}</span>
                  <Progress value={percent} className={`h-2.5 w-full flex-1 ${priorityColorClass}`} />
                  <span className="text-sm font-bold w-8 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Link 
              href="/issues/new"
              className={buttonVariants({ variant: "default", className: "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm" })}
            >
              File New Network Disruption
            </Link>
            <Link 
              href="/issues"
              className={buttonVariants({ variant: "outline", className: "font-semibold shadow-sm border-gray-300 dark:border-gray-700" })}
            >
              Review Active Support Tickets
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}