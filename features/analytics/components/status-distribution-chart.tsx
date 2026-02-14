"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartLegendContent } from "@/components/ui/chart";
import type { StatusDistributionItem } from "@/features/analytics/types";

// Chart data item that accepts string status for API responses
interface ChartDataItem {
  status: string;
  count: number;
  percentage: number;
}

interface StatusDistributionChartProps {
  data?: StatusDistributionItem[] | ChartDataItem[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

// Status colors using CSS variables for theme support
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "hsl(var(--chart-1))",
  COMPLETED: "hsl(var(--chart-2))",
  CANCELLED: "hsl(var(--chart-3))",
  NO_SHOW: "hsl(var(--chart-4))",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function getStatusColor(status: string, index: number): string {
  return STATUS_COLORS[status] || CHART_COLORS[index % CHART_COLORS.length];
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusDistributionChart({
  data,
  isLoading,
  error,
  onRetry,
}: StatusDistributionChartProps) {
  const [selectedSegment, setSelectedSegment] = React.useState<string | null>(
    null,
  );
  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 640 : false;

  if (isLoading) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full sm:h-[250px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center sm:h-[250px]">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Failed to load data</p>
            {onRetry && (
              <Button
                variant="link"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                Try again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center sm:h-[250px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Limit segments on mobile if more than 5
  const displayData = isMobile && data.length > 5 ? data.slice(0, 5) : data;
  const chartData = displayData.map((item, index) => ({
    ...item,
    name: formatStatusLabel(item.status),
    fill: getStatusColor(item.status, index),
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="touch-target">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <div className="h-[200px] w-full sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart
              height={isMobile ? 200 : 250}
              onClick={(_, entry) => {
                const cellEntry = entry as { payload?: { status: string } };
                if (cellEntry?.payload) {
                  setSelectedSegment(cellEntry.payload.status || null);
                }
              }}
            >
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 50 : 60}
                outerRadius={isMobile ? 70 : 80}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
                onClick={(_, entry) => {
                  const cellEntry = entry as { payload?: { status: string } };
                  if (cellEntry?.payload) {
                    setSelectedSegment(cellEntry.payload.status || null);
                  }
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke={
                      selectedSegment === entry.status
                        ? "hsl(var(--ring))"
                        : "none"
                    }
                    strokeWidth={selectedSegment === entry.status ? 2 : 0}
                    className="transition-all"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} (${((value / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow:
                    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                }}
              />
              <ChartLegendContent className="text-muted-foreground" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mobile-friendly legend below chart */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
          {chartData.map((item, index) => (
            <Button
              variant="ghost"
              size="sm"
              key={item.status}
              onClick={() =>
                setSelectedSegment(
                  selectedSegment === item.status ? null : item.status,
                )
              }
              className={`flex items-center gap-2 p-2 rounded-lg touch-target min-h-[44px] ${
                selectedSegment === item.status
                  ? "bg-muted"
                  : "hover:bg-muted/50"
              } transition-colors`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="truncate">{item.name}</span>
            </Button>
          ))}
        </div>

        <div className="mt-3 text-center text-xs sm:text-sm text-muted-foreground">
          Total: {total.toLocaleString()} appointments
        </div>
      </CardContent>
    </Card>
  );
}
