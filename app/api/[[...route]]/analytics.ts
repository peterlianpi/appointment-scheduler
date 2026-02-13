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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

// Get ISO week number helper
const getISOWeek = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// ============================================
// DATE FORMATTING HELPERS (moved from frontend)
// ============================================

interface FormattedDate {
  date: string; // "Jan 11" - for X-axis
  fullDate: string; // "January 11, 2026" - for tooltip
  isoDate: string; // "2026-01-11" - raw value for comparisons
}

function formatDateForPeriod(period: string, date: Date): FormattedDate {
  const monthShort = date.toLocaleDateString("en-US", { month: "short" });
  const monthLong = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  const isoDateStr = date.toISOString().split("T")[0] ?? "";

  switch (period) {
    case "day": {
      return {
        date: `${monthShort} ${day}`,
        fullDate: `${monthLong} ${day}, ${year}`,
        isoDate: isoDateStr,
      };
    }
    case "week": {
      const weekStart = new Date(date);
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const endDay = weekEnd.getDate();
      const endMonthShort = weekEnd.toLocaleDateString("en-US", {
        month: "short",
      });
      const endMonthLong = weekEnd.toLocaleDateString("en-US", {
        month: "long",
      });
      return {
        date: `${monthShort} ${day}-${endDay}`,
        fullDate: `${monthLong} ${day}-${endMonthLong} ${year}`,
        isoDate: `${date.getFullYear()}-W${getISOWeek(date).toString().padStart(2, "0")}`,
      };
    }
    case "month": {
      return {
        date: `${monthShort} ${year}`,
        fullDate: `${monthLong} ${year}`,
        isoDate: `${year}-${(date.getMonth() + 1).toString().padStart(2, "0")}`,
      };
    }
    default: {
      return {
        date: `${monthShort} ${day}`,
        fullDate: `${monthLong} ${day}, ${year}`,
        isoDate: isoDateStr,
      };
    }
  }
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

      const { period, range, startDate, endDate } = c.req.valid("query");

      // Determine date range
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;
      let daysBack: number;

      if (startDate && endDate) {
        // Use custom date range
        currentPeriodStart = new Date(startDate);
        currentPeriodEnd = new Date(endDate);
        // Set end date to end of day
        currentPeriodEnd.setHours(23, 59, 59, 999);
        const diffTime = Math.abs(
          currentPeriodEnd.getTime() - currentPeriodStart.getTime(),
        );
        daysBack = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        // Use range-based calculation
        daysBack = range;
        currentPeriodStart = new Date();
        currentPeriodStart.setDate(currentPeriodStart.getDate() - daysBack);
        currentPeriodEnd = new Date();
        currentPeriodEnd.setHours(23, 59, 59, 999);
      }

      const currentPeriodAppointments = await prisma.appointment.findMany({
        where: {
          startDateTime: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd,
          },
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

      const formatDayKey = (date: Date): string => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      };

      const formatWeekKey = (date: Date): string => {
        const d = new Date(date);
        // Get ISO week number
        const week = getISOWeek(d);
        return `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`;
      };

      const formatMonthKey = (date: Date): string => {
        const d = new Date(date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      };

      // Aggregation key generator
      const getAggregationKey = (period: string, date: Date): string => {
        switch (period) {
          case "day":
            return formatDayKey(date);
          case "week":
            return formatWeekKey(date);
          case "month":
            return formatMonthKey(date);
          default:
            return formatDayKey(date);
        }
      };

      // Aggregate current period appointments
      currentPeriodAppointments.forEach((apt) => {
        const key = getAggregationKey(period, apt.startDateTime);
        currentMap.set(key, (currentMap.get(key) ?? 0) + 1);
      });

      // Aggregate previous period appointments
      previousPeriodAppointments.forEach((apt) => {
        const key = getAggregationKey(period, apt.startDateTime);
        previousMap.set(key, (previousMap.get(key) ?? 0) + 1);
      });

      // Generate complete timeline based on period
      const data: TimeseriesDataPoint[] = [];
      const timelineStart = new Date(currentPeriodStart);

      if (period === "day") {
        // Generate daily data points from start to end date
        const currentDate = new Date(timelineStart);
        while (currentDate <= currentPeriodEnd) {
          const date = new Date(currentDate);
          date.setHours(0, 0, 0, 0);
          const key = formatDayKey(date);

          const formatted = formatDateForPeriod("day", date);
          data.push({
            date: formatted.date,
            fullDate: formatted.fullDate,
            isoDate: formatted.isoDate,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (period === "week") {
        // Generate weekly data points
        const weeksBack = Math.ceil(daysBack / 7);
        for (let i = 0; i < weeksBack; i++) {
          const date = new Date(timelineStart);
          date.setDate(date.getDate() + i * 7);
          date.setHours(0, 0, 0, 0);
          const key = formatWeekKey(date);

          // Avoid duplicates
          if (data.some((d) => d.isoDate === key)) continue;

          const formatted = formatDateForPeriod(period, date);
          data.push({
            date: formatted.date,
            fullDate: formatted.fullDate,
            isoDate: formatted.isoDate,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
        }
      } else if (period === "month") {
        // Generate monthly data points
        const monthsBack = Math.ceil(daysBack / 30);
        const startMonth = new Date(timelineStart);
        startMonth.setDate(1);

        for (let i = 0; i < monthsBack; i++) {
          const date = new Date(startMonth);
          date.setMonth(startMonth.getMonth() + i);
          date.setHours(0, 0, 0, 0);
          const key = formatMonthKey(date);

          // Avoid duplicates
          if (data.some((d) => d.isoDate === key)) continue;

          const formatted = formatDateForPeriod(period, date);
          data.push({
            date: formatted.date,
            fullDate: formatted.fullDate,
            isoDate: formatted.isoDate,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
        }
      } else {
        // Fallback: generate daily data points
        for (let i = 0; i < daysBack; i++) {
          const date = new Date(timelineStart);
          date.setDate(date.getDate() + i);
          date.setHours(0, 0, 0, 0);
          const key = formatDayKey(date);

          const formatted = formatDateForPeriod("day", date);
          data.push({
            date: formatted.date,
            fullDate: formatted.fullDate,
            isoDate: formatted.isoDate,
            count: currentMap.get(key) ?? 0,
            previousPeriodCount: previousMap.get(key) ?? 0,
          });
        }
      }

      // Validate no duplicate dates
      const uniqueKeys = new Set(data.map((d) => d.isoDate));
      if (uniqueKeys.size !== data.length) {
        console.warn(
          `Duplicate dates detected: ${data.length - uniqueKeys.size} duplicates`,
        );
      }

      // DEBUG: Log timeseries data structure
      console.log(
        "[TIMESERIES DEBUG] Data sample (first 5):",
        data.slice(0, 5).map((d) => ({
          date: d.date,
          fullDate: d.fullDate,
          isoDate: d.isoDate,
          count: d.count,
          prevCount: d.previousPeriodCount,
        })),
      );
      console.log(
        "[TIMESERIES DEBUG] All dates:",
        data.map((d) => d.isoDate),
      );

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

        const count = await prisma.appointment.count({
          where: {
            startDateTime: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
        });

        // Create label based on period
        let label: string;
        if (period === "week") {
          const week = getISOWeek(periodEnd);
          label = `${periodEnd.getFullYear()}-W${week.toString().padStart(2, "0")}`;
        } else {
          label = `${periodEnd.getFullYear()}-${(periodEnd.getMonth() + 1).toString().padStart(2, "0")}`;
        }

        data.push({
          period: label,
          current: count,
          previous: 0,
          growth: 0,
        });
      }

      return jsonResponse(c, data);
    } catch (error) {
      console.error("Analytics trends error:", error);
      return errorResponse(c, "Failed to fetch trends data", 500);
    }
  });

export default app;
