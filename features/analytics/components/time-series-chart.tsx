"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartTooltipContent } from "@/components/ui/chart";
import type { TimeseriesDataPoint } from "@/features/analytics/types";

interface TimeSeriesChartProps {
  data?: TimeseriesDataPoint[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

const chartConfig = {
  current: {
    label: "Current Period",
    color: "hsl(var(--chart-current))",
  },
  previous: {
    label: "Previous Period",
    color: "hsl(var(--chart-previous))",
  },
};

function formatDate(
  dateStr: string,
  period: string,
  isMobile: boolean = false,
): string {
  const date = new Date(dateStr);
  switch (period) {
    case "day":
      return isMobile
        ? date.toLocaleTimeString("en-US", { hour: "numeric" })
        : date.toLocaleTimeString("en-US", { hour: "2-digit" });
    case "week":
      return isMobile
        ? date.toLocaleDateString("en-US", { weekday: "short" })
        : date.toLocaleDateString("en-US", { weekday: "long" });
    case "month":
      return isMobile
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    default:
      return isMobile
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : date.toLocaleDateString();
  }
}

// Hook to detect screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function TimeSeriesChart({
  data,
  isLoading,
  error,
  onRetry,
}: TimeSeriesChartProps) {
  const [period, setPeriod] = React.useState<"day" | "week" | "month">("week");
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Appointments Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full sm:h-[250px] md:h-[300px] lg:h-[350px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Appointments Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center sm:h-[250px] md:h-[300px] lg:h-[350px]">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Failed to load data</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-primary hover:underline touch-target min-h-[44px] px-3"
              >
                Try again
              </button>
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
            Appointments Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center sm:h-[250px] md:h-[300px] lg:h-[350px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="touch-target">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base sm:text-lg">
          Appointments Over Time
        </CardTitle>
        <div className="flex gap-1 rounded-md border p-1">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs capitalize touch-target min-h-[36px] ${
                period === p
                  ? "bg-primary text-primary-foreground rounded"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <div className="h-[200px] w-full sm:h-[250px] md:h-[300px] lg:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: isMobile ? 10 : 30,
                left: 0,
                bottom: isMobile ? 20 : 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value, period, isMobile)}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
                tickCount={undefined}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
                width={isMobile ? 30 : 40}
              />
              <ChartTooltipContent
                formatter={(value) => [value, ""]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend
                stroke="currentColor"
                className="text-muted-foreground"
                wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-current))"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={false}
                name="Current Period"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="previousPeriodCount"
                stroke="hsl(var(--chart-previous))"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={false}
                strokeDasharray="5 5"
                name="Previous Period"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
