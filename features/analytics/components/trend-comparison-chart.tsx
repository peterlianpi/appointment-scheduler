"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrendDataPoint } from "@/features/analytics/types";

interface TrendComparisonChartProps {
  data?: TrendDataPoint[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

// API response type alias
type ApiTrendDataPoint = TrendDataPoint;

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

export function TrendComparisonChart({
  data,
  isLoading,
  error,
  onRetry,
}: TrendComparisonChartProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Trend Comparison
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
            Trend Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center sm:h-[250px]">
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
            Trend Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center sm:h-[250px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for grouped bar chart
  const chartData = data.map((item) => ({
    period: item.period,
    Current: item.current,
    Previous: item.previous,
    Growth: item.growth,
  }));

  // Calculate total growth
  const totalCurrent = data.reduce((sum, d) => sum + d.current, 0);
  const totalPrevious = data.reduce((sum, d) => sum + d.previous, 0);
  const totalGrowth =
    totalPrevious > 0
      ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
      : 0;

  return (
    <Card className="touch-target">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Trend Comparison</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <div className="h-[200px] w-full sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: isMobile ? 10 : 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
                width={isMobile ? 30 : 40}
              />
              <Tooltip
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
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name,
                ]}
              />
              <Legend stroke="currentColor" className="text-muted-foreground" />
              <Bar
                dataKey="Current"
                fill="hsl(var(--chart-current))"
                radius={[4, 4, 0, 0]}
                name="Current Period"
              />
              <Bar
                dataKey="Previous"
                fill="hsl(var(--chart-previous))"
                radius={[4, 4, 0, 0]}
                name="Previous Period"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Growth:</span>
            <span
              className={`font-semibold ${
                totalGrowth >= 0
                  ? "text-green-500 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {totalGrowth >= 0 ? "+" : ""}
              {totalGrowth.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Net Change:</span>
            <span
              className={`font-semibold ${
                totalCurrent - totalPrevious >= 0
                  ? "text-green-500 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {totalCurrent - totalPrevious >= 0 ? "+" : ""}
              {(totalCurrent - totalPrevious).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
