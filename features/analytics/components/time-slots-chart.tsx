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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimeSlotData } from "@/features/analytics/types";

interface TimeSlotsChartProps {
  data?: TimeSlotData[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

// API response type alias
type ApiTimeSlotData = TimeSlotData;

// Theme-aware hour colors using CSS variables
const HOUR_COLORS = {
  peak: "hsl(var(--chart-peak))",
  high: "hsl(var(--chart-high))",
  medium: "hsl(var(--chart-medium))",
  low: "hsl(var(--chart-low))",
};

function getHourIntensity(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio >= 0.8) return HOUR_COLORS.peak;
  if (ratio >= 0.6) return HOUR_COLORS.high;
  if (ratio >= 0.3) return HOUR_COLORS.medium;
  return HOUR_COLORS.low;
}

function formatHour(hour: number, isMobile: boolean = false): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return isMobile
    ? hour < 12
      ? `${hour} AM`
      : `${hour - 12} PM`
    : hour < 12
      ? `${hour} AM`
      : `${hour - 12} PM`;
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

export function TimeSlotsChart({
  data,
  isLoading,
  error,
  onRetry,
}: TimeSlotsChartProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Appointments by Hour
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
            Appointments by Hour
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
            Appointments by Hour
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center sm:h-[250px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const chartData = data.map((item) => ({
    ...item,
    fill: getHourIntensity(item.count, maxCount),
  }));

  // Find peak hours
  const peakHours = data
    .filter((d) => d.count >= maxCount * 0.8)
    .map((d) => formatHour(d.hour, isMobile))
    .join(", ");

  return (
    <Card className="touch-target">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Appointments by Hour
        </CardTitle>
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
                dataKey="hour"
                type="number"
                domain={[0, 23]}
                tickCount={24}
                tickFormatter={(value) => formatHour(value, isMobile)}
                tick={{ fontSize: isMobile ? 10 : 11 }}
                stroke="currentColor"
                className="text-muted-foreground"
                allowDuplicatedCategory={false}
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
                formatter={(value: number) => [value, "Appointments"]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {peakHours && (
          <div className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Peak Hours:</span>{" "}
            {peakHours}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
