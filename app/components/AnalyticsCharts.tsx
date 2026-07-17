"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Tooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AnalyticsData {
  byCategory: { name: string; count: number }[];
  byStatus: { name: string; count: number; fill: string }[];
  trend: { label: string; count: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Mobile: "#00A651",
  Fiber: "#0284c7",
  Telebirr: "#d97706",
  "Core Infra": "#7c3aed",
  Other: "#64748b",
};

export default function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[1, 2].map((i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader>
              <div className="h-5 w-40 bg-muted animate-pulse rounded" />
              <div className="h-3 w-56 bg-muted animate-pulse rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-52 bg-muted animate-pulse rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Bar Chart — Issues by Category */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">Issues by Category</CardTitle>
          <CardDescription>Total tickets per network domain</CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byCategory} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: "var(--accent)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.byCategory.map((entry) => (
                  <rect
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] ?? "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart — 7-Day Trend */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">New Tickets — Last 7 Days</CardTitle>
          <CardDescription>Incident filing trend over the past week</CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.trend} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="count"
                name="New Tickets"
                stroke="#00A651"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#00A651", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
