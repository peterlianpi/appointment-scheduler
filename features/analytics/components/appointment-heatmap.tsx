"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { HeatmapDataPoint } from "@/features/analytics/types";

interface AppointmentHeatmapProps {
  data?: HeatmapDataPoint[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

// API response type alias
type ApiHeatmapDataPoint = HeatmapDataPoint;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Color scale for heatmap intensity using theme variables
const getHeatmapColor = (count: number, maxCount: number): string => {
  if (count === 0) return "bg-muted/30";
  const ratio = count / maxCount;
  if (ratio >= 0.8) return "bg-[hsl(var(--chart-peak))]";
  if (ratio >= 0.6) return "bg-[hsl(var(--chart-high))]";
  if (ratio >= 0.4) return "bg-[hsl(var(--chart-medium))]";
  if (ratio >= 0.2) return "bg-[hsl(var(--chart-low))]";
  return "bg-muted/50";
};

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
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

export function AppointmentHeatmap({
  data,
  isLoading,
  error,
  onRetry,
}: AppointmentHeatmapProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (isLoading) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Weekly Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full sm:h-[220px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="touch-target">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Weekly Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[180px] items-center justify-center sm:h-[220px]">
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
          <CardTitle className="text-base sm:text-lg">Weekly Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[180px] items-center justify-center sm:h-[220px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Build a 2D grid from the data
  const heatmapData = DAYS.map((day, dayIndex) => {
    const dayData: Record<string, number | string> = { day };
    HOURS.forEach((hour) => {
      const point = data.find((d) => d.day === dayIndex && d.hour === hour);
      dayData[hour.toString()] = point?.count ?? 0;
    });
    return dayData;
  });

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card className="touch-target">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base sm:text-lg">Weekly Heatmap</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="touch-target min-h-[44px] px-3 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label={isExpanded ? "Collapse heatmap" : "Expand heatmap"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent>
            <div className="overflow-x-auto -mx-2 sm:mx-0 px-2">
              <div
                className={`${isMobile ? "min-w-[380px]" : "min-w-[500px] sm:min-w-[600px]"}`}
              >
                {/* Hour labels */}
                <div className="mb-2 hidden sm:flex">
                  <div className="w-12 shrink-0" />
                  <div className="flex flex-1">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="flex-1 text-center text-[10px] text-muted-foreground"
                      >
                        {hour % 3 === 0 ? formatHour(hour) : ""}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compact hour labels for mobile */}
                <div className="mb-2 flex sm:hidden">
                  <div className="w-10 shrink-0" />
                  <div className="flex flex-1">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="flex-1 text-center text-[8px] text-muted-foreground"
                      >
                        {hour % 6 === 0 ? formatHour(hour) : ""}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmap rows */}
                <div className="space-y-1">
                  {heatmapData.map((row, rowIndex) => (
                    <div key={row.day} className="flex items-center">
                      {/* Day label */}
                      <div className="w-10 shrink-0 text-xs font-medium text-muted-foreground sm:w-12 sm:text-sm">
                        {DAYS[rowIndex]}
                      </div>

                      {/* Hour cells */}
                      <div className="flex flex-1 gap-[2px]">
                        {HOURS.map((hour) => {
                          const count = row[hour.toString()] as number;
                          return (
                            <Button
                              variant="ghost"
                              size="sm"
                              key={hour}
                              className={`aspect-square flex-1 rounded-sm p-0 transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${getHeatmapColor(
                                count,
                                maxCount,
                              )}`}
                              title={`${DAYS[rowIndex]} ${formatHour(hour)}: ${count} appointments`}
                              aria-label={`${DAYS[rowIndex]} ${formatHour(hour)}: ${count} appointments`}
                            >
                              {count > 0 && (
                                <div className="flex h-full items-center justify-center">
                                  <span className="text-[8px] font-medium opacity-80 sm:text-[10px]">
                                    {count > 99 ? "99+" : count}
                                  </span>
                                </div>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-muted/30" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-muted/50" />
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-primary/50" />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-primary/75" />
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-primary" />
                    <span>Peak</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
