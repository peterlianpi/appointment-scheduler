import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/components/landing-page";

export const metadata: Metadata = {
  title: "Appointment Scheduler - Smart Scheduling for Everyone",
  description:
    "The modern appointment scheduling platform that helps businesses and individuals manage their time effectively. Automated reminders, team collaboration, and powerful analytics.",
  keywords: [
    "appointment scheduler",
    "scheduling",
    "calendar",
    "booking",
    "time management",
  ],
  openGraph: {
    title: "Appointment Scheduler - Smart Scheduling for Everyone",
    description:
      "The modern appointment scheduling platform that helps businesses and individuals manage their time effectively.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
