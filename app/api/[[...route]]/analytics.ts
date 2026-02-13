import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type {
  OverviewMetrics,
  TimeseriesDataPoint,
  StatusDistributionItem,
  TimeSlotData,
  HeatmapDataPoint,
  TrendDataPoint,
} from "@/features/analytics/types";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const timeseriesQuerySchema = z.object({
  period: z.enum(["day", "week", "month"]).default("day"),
  range: z.coerce.number().int().min(1).max(365).default(30),
});

const trendsQuerySchema = z.object({
  period: z.enum(["week", "month"]).default("week"),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkIsAdmin(c: Context): Promise<boolean> {
  const cookie = c.req.header("cookie");
  const headers: Record<string, string> = cookie ? { Cookie: cookie } : {};

  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    return false;
  }

  if (session.user.role) {
    return session.user.role === "ADMIN";
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

function jsonResponse(c: Context, data: unknown) {
  return c.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

function errorResponse(c: Context, error: string, code: number) {
  return c.json(
    {
      success: false,
      error,
      code,
    },
    code as 401 | 403 | 404 | 500,
  );
}

// ============================================
// ANALYTICS ROUTER
// ============================================

const app = new Hono()
  // ============================================
  // GET /api/analytics/overview - Key metrics for dashboard
  // ============================================
  .get("/overview", async (c) => {
    try {
      const isAdminUser = await checkIsAdmin(c);
      if (!isAdminUser) {
        return errorResponse(c, "Authentication required", 401);
      }

      // Get total appointments (all time)
      const totalAppointments = await prisma.appointment.count();

      // Get current and previous period counts (last 30 days vs previous 30 days)
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 30);

      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 60);
      const previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30);

      const [totalCurrentPeriod, totalPreviousPeriod, statusCounts] =
        await Promise.all([
          prisma.appointment.count({
            where: {
              startDateTime: { gte: currentPeriodStart },
            },
          }),
          prisma.appointment.count({
            where: {
              startDateTime: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
            },
          }),
          prisma.appointment.groupBy({
            by: ["status"],
            _count: { status: true },
          }),
        ]);

      // Calculate rates
      const completed =
        statusCounts.find((s) => s.status === "COMPLETED")?._count.status ?? 0;
      const cancelled =
        statusCounts.find((s) => s.status === "CANCELLED")?._count.status ?? 0;
      const noShow =
        statusCounts.find((s) => s.status === "NO_SHOW")?._count.status ?? 0;

      const completionRate =
        totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0;
      const cancellationRate =
        totalAppointments > 0 ? (cancelled / totalAppointments) * 100 : 0;
      const noShowRate =
        totalAppointments > 0 ? (noShow / totalAppointments) * 100 : 0;

      // Calculate growth rate
      const growthRate =
        totalPreviousPeriod > 0
          ? ((totalCurrentPeriod - totalPreviousPeriod) / totalPreviousPeriod) *
            100
          : totalCurrentPeriod > 0
            ? 100
            : 0;

      // Calculate average appointments per day (last 30 days)
      const avgPerDay = totalCurrentPeriod / 30;

      const metrics: OverviewMetrics = {
        totalAppointments,
        totalAppointmentsCurrentPeriod: totalCurrentPeriod,
        totalAppointmentsPreviousPeriod: totalPreviousPeriod,
        growthRate: Math.round(growthRate * 100) / 100,
        averageAppointmentsPerDay: Math.round(avgPerDay * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        noShowRate: Math.round(noShowRate * 100) / 100,
      };

      return jsonResponse(c, metrics);
    } catch (error) {
      console.error("Analytics overview error:", error);
      return errorResponse(c, "Failed to fetch overview metrics", 500);
    }
  })
  // ============================================
  // GET /api/analytics/timeseries - Time-series data for line charts
  // ============================================
  .get("/timeseries", zValidator("query", timeseriesQuerySchema), async (c) => {
    try {
      const isAdminUser = await checkIsAdmin(c);
      if (!isAdminUser) {
        return errorResponse(c, "Authentication required", 401);
      }

      const { period, range } = c.req.valid("query");

      // DEBUG: Log period to confirm it's being received
      console.log("[TIMESERIES DEBUG] period=", period, "range=", range);

      // Calculate date granularity based on period
      const daysBack = range;

      // Get current period data
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(currentPeriodStart.getDate() - daysBack);

      const currentPeriodAppointments = await prisma.appointment.findMany({
        where: {
          startDateTime: { gte: currentPeriodStart },
        },
        select: { startDateTime: true },
      });

      // Get previous period data for comparison
      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - daysBack * 2);
      const previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - daysBack);

      const previousPeriodAppointments = await prisma.appointment.findMany({
        where: {
          startDateTime: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
        select: { startDateTime: true },
      });

      // Aggregate data by date
      const currentMap = new Map<string, number>();
      const previousMap = new Map<string, number>();

      const formatHourKey = (date: Date): string => {
        const d = new Date(date);
        d.setMinutes(0, 0, 0);
        return d.toISOString();
      };

      const formatDayKey = (date: Date): string => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      };

      const formatWeekKey = (date: Date): string => {
        const d = new Date(date);
        // Get the Monday of the week
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      };

      const formatMonthKey = (date: Date): string => {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      };

      // Aggregate based on period
      const aggregationFn = (period: string) => {
        if (period === "day") {
          return formatHourKey;
        } else if (period === "week") {
          return formatWeekKey;
        } else if (period === "month") {
          return formatMonthKey;
        }
        return formatDayKey;
      };

      const formatKey = aggregationFn(period);

      currentPeriodAppointments.forEach((apt) => {
        const key = formatKey(apt.startDateTime);
        currentMap.set(key, (currentMap.get(key) ?? 0) + 1);
      });
      previousPeriodAppointments.forEach((apt) => {
        const key = formatKey(apt.startDateTime);
        previousMap.set(key, (previousMap.get(key) ?? 0) + 1);
      });

      // Generate complete timeline based on period
      const data: TimeseriesDataPoint[] = [];
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysBack);

      if (period === "day") {
        // Generate hourly data points
        for (let i = 0; i < daysBack * 24; i++) {
          const date = new Date(startDate);
          date.setHours(date.getHours() + i);
          date.setMinutes(0, 0, 0);
          const key = formatHourKey(date);

          data.push({
            date: key,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
        }
      } else if (period === "week") {
        // Generate weekly data points
        const weeksBack = Math.ceil(daysBack / 7);
        for (let i = 0; i < weeksBack; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i * 7);
          date.setHours(0, 0, 0, 0);
          const key = date.toISOString().split("T")[0];

          data.push({
            date: key,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
        }
      } else if (period === "month") {
        // Generate monthly data points
        const monthsBack = Math.ceil(daysBack / 30);
        for (let i = 0; i < monthsBack; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          const key = date.toISOString().split("T")[0];

          data.push({
            date: key,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
        }
      } else {
        // Fallback: generate daily data points
        for (let i = 0; i < daysBack; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          date.setHours(0, 0, 0, 0);
          const key = date.toISOString().split("T")[0];

          data.push({
            date: key,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
        }
      }

      // Validate no duplicate dates
      const uniqueKeys = new Set(data.map((d) => d.date));
      if (uniqueKeys.size !== data.length) {
        console.warn(
          `Duplicate dates detected: ${data.length - uniqueKeys.size} duplicates`,
        );
      }

      return jsonResponse(c, data);
    } catch (error) {
      console.error("Analytics timeseries error:", error);
      return errorResponse(c, "Failed to fetch timeseries data", 500);
    }
  })
  // ============================================
  // GET /api/analytics/status-distribution - Pie chart data
  // ============================================
  .get("/status-distribution", async (c) => {
    try {
      const isAdminUser = await checkIsAdmin(c);
      if (!isAdminUser) {
        return errorResponse(c, "Authentication required", 401);
      }

      const statusCounts = await prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
      });

      const total = statusCounts.reduce((sum, s) => sum + s._count.status, 0);

      const data: StatusDistributionItem[] = statusCounts.map((item) => ({
        status: item.status,
        count: item._count.status,
        percentage:
          total > 0
            ? Math.round((item._count.status / total) * 10000) / 100
            : 0,
      }));

      return jsonResponse(c, data);
    } catch (error) {
      console.error("Analytics status distribution error:", error);
      return errorResponse(c, "Failed to fetch status distribution", 500);
    }
  })
  // ============================================
  // GET /api/analytics/time-slots - Bar chart data for active hours
  // ============================================
  .get("/time-slots", async (c) => {
    try {
      const isAdminUser = await checkIsAdmin(c);
      if (!isAdminUser) {
        return errorResponse(c, "Authentication required", 401);
      }

      // Get all appointments with their start times
      const appointments = await prisma.appointment.findMany({
        where: {
          deletedAt: null,
        },
        select: { startDateTime: true },
      });

      // Aggregate by hour (0-23)
      const hourCounts = new Array(24).fill(0);

      appointments.forEach((apt) => {
        const hour = apt.startDateTime.getHours();
        hourCounts[hour]++;
      });

      const data: TimeSlotData[] = hourCounts.map((count, hour) => ({
        hour,
        count,
      }));

      return jsonResponse(c, data);
    } catch (error) {
      console.error("Analytics time slots error:", error);
      return errorResponse(c, "Failed to fetch time slot data", 500);
    }
  })
  // ============================================
  // GET /api/analytics/heatmap - Day/hour intensity heatmap
  // ============================================
  .get("/heatmap", async (c) => {
    try {
      const isAdminUser = await checkIsAdmin(c);
      if (!isAdminUser) {
        return errorResponse(c, "Authentication required", 401);
      }

      // Get all appointments with their start times
      const appointments = await prisma.appointment.findMany({
        where: {
          deletedAt: null,
        },
        select: { startDateTime: true },
      });

      // Create 7x24 grid (day 0-6, hour 0-23)
      const heatmapData: HeatmapDataPoint[] = [];

      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          let count = 0;

          appointments.forEach((apt) => {
            const aptDay = apt.startDateTime.getDay();
            const aptHour = apt.startDateTime.getHours();
            if (aptDay === day && aptHour === hour) {
              count++;
            }
          });

          heatmapData.push({
            day,
            hour,
            count,
          });
        }
      }

      return jsonResponse(c, heatmapData);
    } catch (error) {
      console.error("Analytics heatmap error:", error);
      return errorResponse(c, "Failed to fetch heatmap data", 500);
    }
  })
  // ============================================
  // GET /api/analytics/trends - Trend comparison data
  // ============================================
  .get("/trends", zValidator("query", trendsQuerySchema), async (c) => {
    try {
      const isAdminUser = await checkIsAdmin(c);
      if (!isAdminUser) {
        return errorResponse(c, "Authentication required", 401);
      }

      const { period } = c.req.valid("query");

      // Determine the number of periods to return
      const numPeriods = 12;
      const daysPerPeriod = period === "week" ? 7 : 30;

      const data: TrendDataPoint[] = [];

      for (let i = numPeriods - 1; i >= 0; i--) {
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() - i * daysPerPeriod);

        const periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() - daysPerPeriod);

        // Current period
        const currentCount = await prisma.appointment.count({
          where: {
            startDateTime: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
        });

        // Previous period
        const previousPeriodEnd = new Date(periodStart);
        const previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setDate(
          previousPeriodStart.getDate() - daysPerPeriod,
        );

        const previousCount = await prisma.appointment.count({
          where: {
            startDateTime: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd,
            },
          },
        });

        // Calculate growth rate
        const growth =
          previousCount > 0
            ? ((currentCount - previousCount) / previousCount) * 100
            : currentCount > 0
              ? 100
              : 0;

        // Format period label
        const periodLabel =
          period === "week"
            ? `Week of ${periodStart.toISOString().split("T")[0]}`
            : periodStart.toISOString().split("T")[0];

        data.push({
          period: periodLabel,
          current: currentCount,
          previous: previousCount,
          growth: Math.round(growth * 100) / 100,
        });
      }

      return jsonResponse(c, data);
    } catch (error) {
      console.error("Analytics trends error:", error);
      return errorResponse(c, "Failed to fetch trends data", 500);
    }
  });

export default app;
