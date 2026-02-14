"use client";

import * as React from "react";
import {
  LucideIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OverviewMetrics } from "@/features/analytics/types";

// Extended type with API response wrapper
interface StatsResponseData {
  totalAppointments: number;
  totalAppointmentsCurrentPeriod: number;
  totalAppointmentsPreviousPeriod: number;
  growthRate: number;
  averageAppointmentsPerDay: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

interface AnalyticsStatsGridProps {
  data?: OverviewMetrics | StatsResponseData;
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: number;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="touch-target">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-20 sm:h-8 sm:w-24" />
          <Skeleton className="mt-1 h-3 w-24 sm:h-3 sm:w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="touch-target transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 dark:text-red-400" />
              )}
              <span
                className={`text-xs ${
                  trend >= 0
                    ? "text-green-500 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsStatsGrid({
  data,
  isLoading,
  error,
  onRetry,
}: AnalyticsStatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="touch-target">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Loading...
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20 sm:h-8 sm:w-24" />
              <Skeleton className="mt-1 h-3 w-24 sm:h-3 sm:w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-[100px] sm:h-[120px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Failed to load statistics
            </p>
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

  if (!data) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="touch-target">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                No Data
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Appointments"
        value={data.totalAppointmentsCurrentPeriod}
        description="vs previous period"
        icon={Calendar}
        trend={data.growthRate}
      />
      <StatCard
        title="Avg. Per Day"
        value={data.averageAppointmentsPerDay.toFixed(1)}
        description="appointments/day"
        icon={Percent}
      />
      <StatCard
        title="Completion Rate"
        value={`${(data.completionRate * 100).toFixed(1)}%`}
        description="of all appointments"
        icon={TrendingUp}
      />
      <StatCard
        title="Cancellation Rate"
        value={`${(data.cancellationRate * 100).toFixed(1)}%`}
        description="cancellation rate"
        icon={TrendingDown}
      />
    </div>
  );
}
