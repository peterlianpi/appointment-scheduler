"use client";

import * as React from "react";
import { useLandingData } from "@/features/landing/api/use-landing-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar,
  Bell,
  Users,
  Shield,
  Lock,
  BarChart3,
  Check,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { ModeToggle } from "@/features/nav/components/theme-toggle";

function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "default" && "bg-primary/10 text-primary",
        variant === "outline" && "border border-border",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary">Appointment Scheduler v1.0</Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Smart Appointment Scheduling{" "}
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="mt-6 py-4 text-lg text-muted-foreground md:text-xl">
            A modern, secure, and scalable appointment management platform built
            with Next.js, Prisma, and Better Auth.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({
  stats,
  loading,
}: {
  stats?: {
    totalUsers: number;
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    satisfactionRate: number;
  };
  loading: boolean;
}) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statItems = [
    { label: "Active Users", value: stats?.totalUsers, format: formatNumber },
    {
      label: "Appointments",
      value: stats?.totalAppointments,
      format: formatNumber,
    },
    {
      label: "Upcoming",
      value: stats?.upcomingAppointments,
      format: formatNumber,
    },
    { label: "Satisfaction", value: `${stats?.satisfactionRate || 0}%` },
  ];

  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => (
            <div key={item.label} className="text-center">
              {loading ? (
                <Skeleton className="mx-auto h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold tracking-tight md:text-4xl">
                  {typeof item.value === "number"
                    ? formatNumber(item.value)
                    : item.value}
                </div>
              )}
              <div className="mt-2 text-sm text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModelsSection({
  models,
  loading,
}: {
  models?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    capabilities: string[];
    category:
      | "core"
      | "scheduling"
      | "notifications"
      | "security"
      | "analytics";
  }>;
  loading: boolean;
}) {
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      users: <Users className="h-6 w-6" />,
      calendar: <Calendar className="h-6 w-6" />,
      bell: <Bell className="h-6 w-6" />,
      shield: <Shield className="h-6 w-6" />,
      lock: <Lock className="h-6 w-6" />,
      chart: <BarChart3 className="h-6 w-6" />,
    };
    return iconMap[iconName] || <Calendar className="h-6 w-6" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      core: "bg-blue-500/10 text-blue-600",
      scheduling: "bg-green-500/10 text-green-600",
      notifications: "bg-yellow-500/10 text-yellow-600",
      security: "bg-red-500/10 text-red-600",
      analytics: "bg-purple-500/10 text-purple-600",
    };
    return colors[category] || colors.core;
  };

  if (loading) {
    return (
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-10 w-64" />
            <Skeleton className="mx-auto mt-4 h-6 w-96" />
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Built on a Strong Foundation
          </h2>
          <p className="mt-4 py-4 text-lg text-muted-foreground">
            Our data models provide everything you need for a complete
            appointment scheduling solution
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models?.map((model) => (
            <Card
              key={model.id}
              className="group relative overflow-hidden transition-all hover:shadow-lg"
            >
              <CardHeader>
                <div
                  className={cn(
                    "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
                    getCategoryColor(model.category),
                  )}
                >
                  {getIcon(model.icon)}
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{model.name}</CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {model.category}
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  {model.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {model.capabilities.slice(0, 4).map((capability, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {capability}
                    </li>
                  ))}
                  {model.capabilities.length > 4 && (
                    <li className="text-sm text-primary">
                      +{model.capabilities.length - 4} more capabilities
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Join thousands of users already managing their appointments
            efficiently
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="h-6 w-6" />
            <span>Appointment Scheduler</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const { data, isLoading } = useLandingData();

  return (
    <div className="min-h-screen bg-background font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 border-b bg-background  backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Calendar className="h-6 w-6" />
            <span>Appointment Scheduler</span>
          </Link>
          <div className="flex gap-6">
            <ModeToggle />
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="outline" asChild>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content">
        <HeroSection />
        <StatsSection stats={data?.data.stats} loading={isLoading} />
        <ModelsSection models={data?.data.models} loading={isLoading} />

        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
