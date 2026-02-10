"use client";

import * as React from "react";
import {
  Calendar,
  LayoutDashboard,
  Settings2,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

// Sample data for the sidebar
const data = {
  teams: [
    {
      name: "Appointment Scheduler",
      logo: Calendar,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Appointments",
      url: "/dashboard/appointments",
      icon: Calendar,
      isActive: false,
      items: [
        {
          title: "All Appointments",
          url: "/dashboard/appointments",
        },
        {
          title: "Upcoming",
          url: "/dashboard/appointments?status=SCHEDULED",
        },
        {
          title: "Completed",
          url: "/dashboard/appointments?status=COMPLETED",
        },
        {
          title: "Cancelled",
          url: "/dashboard/appointments?status=CANCELLED",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings",
        },
        {
          title: "Notifications",
          url: "/dashboard/settings/notifications",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = useSession();

  const user = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email || "user@example.com",
        avatar: session.user.image || "",
      }
    : {
        name: "User",
        email: "user@example.com",
        avatar: "",
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>{!isPending && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
