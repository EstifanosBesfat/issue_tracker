// app/page.tsx
import Link from "next/link";
import prisma from "@/prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import AnalyticsCharts from "@/app/components/AnalyticsCharts";

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Ethio Telecom Service Desk</h1>
          <p className="text-muted-foreground mt-1 text-sm">Regional infrastructure maintenance dashboard.</p>
        </div>
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse"></span>
            {criticalCount} Critical
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-none rounded-md flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-gray-900">{openCount}</span>
          </CardContent>
        </Card>
        
        <Card className="shadow-none rounded-md flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-gray-900">{inProgressCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-none rounded-md flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-gray-900">{closedCount}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 shadow-none rounded-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Telecom Outage Priorities</CardTitle>
          <CardDescription className="text-xs">Immediate active network disruptions requiring technician dispatch.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-2">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((prio) => {
              const count = issues.filter(i => i.priority === prio && i.status !== 'CLOSED').length;
              const activeIssuesTotal = issues.filter(i => i.status !== 'CLOSED').length;
              const percent = activeIssuesTotal > 0 ? (count / activeIssuesTotal) * 100 : 0;
              
              const priorityColorClass = 
                prio === 'CRITICAL' ? '[&_[data-slot=progress-indicator]]:bg-danger' : 
                prio === 'HIGH' ? '[&_[data-slot=progress-indicator]]:bg-secondary' : 
                prio === 'MEDIUM' ? '[&_[data-slot=progress-indicator]]:bg-warning' : 
                '[&_[data-slot=progress-indicator]]:bg-info';

              return (
                <div key={prio} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium w-20 text-muted-foreground">{prio}</span>
                  <Progress value={percent} className={`h-1.5 w-full flex-1 bg-gray-100 ${priorityColorClass}`} />
                  <span className="text-xs font-semibold w-8 text-right text-gray-700 tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AnalyticsCharts />

      <Card className="mt-8 shadow-none rounded-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Link 
              href="/issues/new"
              className={buttonVariants({ variant: "default", className: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-none rounded-md" })}
            >
              File New Network Disruption
            </Link>
            <Link 
              href="/issues"
              className={buttonVariants({ variant: "outline", className: "font-medium shadow-none rounded-md text-gray-700" })}
            >
              Review Active Support Tickets
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}