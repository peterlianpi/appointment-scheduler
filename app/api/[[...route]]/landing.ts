import { Hono } from "hono";
import prisma from "@/lib/prisma";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface LandingPageStats {
  totalUsers: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  satisfactionRate: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
}

export interface LandingPageData {
  stats: LandingPageStats;
  testimonials: Testimonial[];
  features: Feature[];
  pricingPlans: PricingPlan[];
}

// ============================================
// LANDING PAGE ROUTER
// ============================================

const app = new Hono()
  // ============================================
  // GET /api/landing - Get all landing page data
  // ============================================
  .get("/", async (c) => {
    try {
      // Fetch statistics from database
      const [
        totalUsers,
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.appointment.count(),
        prisma.appointment.count({
          where: {
            status: "SCHEDULED",
            startDateTime: { gte: new Date() },
          },
        }),
        prisma.appointment.count({
          where: { status: "COMPLETED" },
        }),
      ]);

      // Calculate satisfaction rate based on completed vs total
      const satisfactionRate =
        totalAppointments > 0
          ? Math.round((completedAppointments / totalAppointments) * 100)
          : 95;

      const stats: LandingPageStats = {
        totalUsers,
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        satisfactionRate,
      };

      // Static testimonial data
      const testimonials: Testimonial[] = [
        {
          id: "1",
          name: "Sarah Johnson",
          role: "CEO",
          company: "TechStart Inc.",
          content:
            "This appointment scheduler has transformed how we manage our client meetings. The automated reminders alone have reduced no-shows by 80%!",
          rating: 5,
        },
        {
          id: "2",
          name: "Michael Chen",
          role: "Practice Manager",
          company: "Chen Dental Group",
          content:
            "We used to spend hours on the phone scheduling appointments. Now our patients can book 24/7, and our staff focuses on what matters most - patient care.",
          rating: 5,
        },
        {
          id: "3",
          name: "Emily Rodriguez",
          role: "HR Director",
          company: "Global Solutions",
          content:
            "The team scheduling feature is a game-changer. We can easily coordinate meetings across different time zones and departments.",
          rating: 5,
        },
      ];

      // Feature highlights
      const features: Feature[] = [
        {
          id: "1",
          title: "Smart Scheduling",
          description:
            "AI-powered scheduling that finds the perfect time for everyone, considering availability and preferences automatically.",
          icon: "calendar",
          highlight: true,
        },
        {
          id: "2",
          title: "Automated Reminders",
          description:
            "Never miss an appointment with intelligent email and SMS reminders sent automatically before each meeting.",
          icon: "bell",
        },
        {
          id: "3",
          title: "Team Collaboration",
          description:
            "Easily manage group appointments, team meetings, and coordinate schedules across your entire organization.",
          icon: "users",
        },
        {
          id: "4",
          title: "Real-time Sync",
          description:
            "Instant synchronization across all devices ensures everyone sees the same up-to-date schedule.",
          icon: "sync",
        },
        {
          id: "5",
          title: "Analytics Dashboard",
          description:
            "Gain insights into appointment patterns, no-show rates, and team productivity with comprehensive analytics.",
          icon: "chart",
        },
        {
          id: "6",
          title: "Custom Branding",
          description:
            "White-label the scheduling experience with your company's branding for a professional touch.",
          icon: "palette",
        },
      ];

      // Pricing plans
      const pricingPlans: PricingPlan[] = [
        {
          id: "free",
          name: "Starter",
          price: 0,
          interval: "month",
          description: "Perfect for individuals getting started",
          features: [
            "Up to 20 appointments/month",
            "Email reminders",
            "Basic scheduling",
            "1 team member",
          ],
          ctaText: "Get Started Free",
        },
        {
          id: "pro",
          name: "Professional",
          price: 29,
          interval: "month",
          description: "Ideal for growing teams",
          features: [
            "Unlimited appointments",
            "SMS & Email reminders",
            "Team collaboration",
            "Analytics dashboard",
            "Custom branding",
            "Priority support",
          ],
          highlighted: true,
          ctaText: "Start Free Trial",
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 99,
          interval: "month",
          description: "For large organizations",
          features: [
            "Everything in Professional",
            "Unlimited team members",
            "Advanced integrations",
            "Dedicated account manager",
            "Custom development",
            "SLA guarantee",
          ],
          ctaText: "Contact Sales",
        },
      ];

      const data: LandingPageData = {
        stats,
        testimonials,
        features,
        pricingPlans,
      };

      return c.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Landing page data error:", error);
      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to fetch landing page data",
          },
        },
        500,
      );
    }
  });

export default app;

export type AppType = typeof app;
