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

const Icons = {
  calendar: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  bell: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  users: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  sync: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  ),
  chart: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  palette: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="8.5" cy="7.5" r="1.5" />
      <circle cx="6.5" cy="12.5" r="1.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  star: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  check: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  arrowRight: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
};

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Schedule Appointments{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Smarter, Not Harder
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            The modern appointment scheduling platform that helps businesses and
            individuals manage their time effectively. Automated reminders, team
            collaboration, and powerful analytics all in one place.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free Trial
                <Icons.arrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute -top-24 -left-24 -z-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 -z-10 h-64 w-64 rounded-full bg-blue-600/5 blur-3xl" />
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
    { label: "Active Users", value: stats?.totalUsers, key: "totalUsers" },
    {
      label: "Appointments Scheduled",
      value: stats?.totalAppointments,
      key: "totalAppointments",
    },
    {
      label: "Upcoming Appointments",
      value: stats?.upcomingAppointments,
      key: "upcomingAppointments",
    },
    {
      label: "Satisfaction Rate",
      value: `${stats?.satisfactionRate || 0}%`,
      suffix: "%",
      key: "satisfactionRate",
    },
  ];

  return (
    <section className="border-y bg-muted/30 py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => (
            <div key={item.key} className="text-center">
              {loading ? (
                <Skeleton className="mx-auto h-10 w-24" />
              ) : (
                <div className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {item.suffix
                    ? `${formatNumber(Number(item.value) || 0)}${item.suffix}`
                    : formatNumber(Number(item.value) || 0)}
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

function FeaturesSection({
  features,
  loading,
}: {
  features?: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    highlighted?: boolean;
  }>;
  loading: boolean;
}) {
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as Record<string, () => React.ReactElement>)[
      iconName
    ];
    return IconComponent ? <IconComponent /> : <Icons.calendar />;
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-10 w-64" />
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Schedule Successfully
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed to streamline your appointment scheduling
            workflow
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features?.map((feature) => (
            <Card
              key={feature.id}
              className={cn(
                "transition-all duration-200 hover:shadow-lg",
                feature.highlighted && "border-primary ring-1 ring-primary/20",
              )}
            >
              <CardHeader>
                <div
                  className={cn(
                    "mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg",
                    feature.highlighted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  {getIcon(feature.icon)}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({
  testimonials,
  loading,
}: {
  testimonials?: Array<{
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
  }>;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-10 w-64" />
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by Thousands of Professionals
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what our customers have to say about their experience
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials?.map((testimonial) => (
            <Card key={testimonial.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Icons.star key={i} />
                  ))}
                </div>
                <CardDescription className="mt-4 text-base">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({
  pricingPlans,
  loading,
}: {
  pricingPlans?: Array<{
    id: string;
    name: string;
    price: number;
    interval: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    ctaText: string;
  }>;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-10 w-64" />
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that best fits your needs
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pricingPlans?.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col",
                plan.highlighted &&
                  "border-primary ring-1 ring-primary/20 shadow-lg",
              )}
            >
              <CardHeader>
                {plan.highlighted && (
                  <div className="mb-2 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Most Popular
                  </div>
                )}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icons.check />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/signup">{plan.ctaText}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform Your Scheduling?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            Join thousands of businesses that have streamlined their appointment
            scheduling with our powerful platform.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                Get Started Free
                <Icons.arrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent"
              asChild
            >
              <Link href="/login">Sign In to Your Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:px-6 md:flex-row">
        <div className="text-center md:text-left">
          <div className="font-semibold">Appointment Scheduler</div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link
            href="/login"
            className="hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hover:text-foreground transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const { data, isLoading } = useLandingData();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Icons.calendar />
            <span>Appointment Scheduler</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <HeroSection />
        <StatsSection stats={data?.data.stats} loading={isLoading} />
        <FeaturesSection features={data?.data.features} loading={isLoading} />
        <TestimonialsSection
          testimonials={data?.data.testimonials}
          loading={isLoading}
        />
        <PricingSection
          pricingPlans={data?.data.pricingPlans}
          loading={isLoading}
        />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
