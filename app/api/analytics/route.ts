// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import prisma from "@/prisma/client";

export const dynamic = "force-dynamic";

function getLast7Days() {
  const days: { label: string; date: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    days.push({ label, date: d });
  }
  return days;
}

export async function GET() {
  try {
    const [allIssues, last7DaysIssues] = await Promise.all([
      prisma.issue.findMany({
        select: { category: true, status: true, priority: true },
      }),
      prisma.issue.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
      }),
    ]);

    // Issues by category
    const categoryMap: Record<string, number> = {
      MOBILE_NETWORK: 0,
      FIBER_BROADBAND: 0,
      TELEBIRR_BILLING: 0,
      CORE_INFRASTRUCTURE: 0,
      OTHER: 0,
    };
    for (const issue of allIssues) {
      if (issue.category in categoryMap) categoryMap[issue.category]++;
    }
    const byCategory = Object.entries(categoryMap).map(([key, count]) => ({
      name: key
        .replace("_", " ")
        .replace("MOBILE_NETWORK", "Mobile")
        .replace("FIBER_BROADBAND", "Fiber")
        .replace("TELEBIRR_BILLING", "Telebirr")
        .replace("CORE_INFRASTRUCTURE", "Core Infra")
        .replace("OTHER", "Other"),
      count,
    }));

    // Issues by status
    const statusMap: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, CLOSED: 0 };
    for (const issue of allIssues) {
      if (issue.status in statusMap) statusMap[issue.status]++;
    }
    const byStatus = [
      { name: "Open", count: statusMap.OPEN, fill: "var(--color-open)" },
      { name: "In Progress", count: statusMap.IN_PROGRESS, fill: "var(--color-in_progress)" },
      { name: "Closed", count: statusMap.CLOSED, fill: "var(--color-closed)" },
    ];

    // Issues trend last 7 days
    const days = getLast7Days();
    const trend = days.map(({ label, date }) => {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      const count = last7DaysIssues.filter(
        (i) => i.createdAt >= date && i.createdAt < nextDay
      ).length;
      return { label, count };
    });

    return NextResponse.json({ byCategory, byStatus, trend });
  } catch (err) {
    console.error("[analytics]", err);
    return NextResponse.json({ byCategory: [], byStatus: [], trend: [] }, { status: 500 });
  }
}
