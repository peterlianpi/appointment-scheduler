"use client";

import * as React from "react";
import {
  Calendar,
  LayoutDashboard,
  Settings2,
  Users,
  BarChart3,
} from "lucide-react";
import { NavMain } from "@/features/nav/components/nav-main";
import { NavUser } from "@/features/nav/components/nav-user";
import { TeamSwitcher } from "@/features/nav/components/team-switcher";
import { AdminSwitch } from "@/features/nav/components/admin-switch";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { checkAdminRole } from "@/lib/api/hono-client";

// Regular user nav items
const userNavMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
      },
    ],
  },
  {
    title: "My Appointments",
    url: "/appointments",
    icon: Calendar,
    isActive: false,
    items: [
      {
        title: "All Appointments",
        url: "/appointments",
      },
      {
        title: "Upcoming",
        url: "/appointments?status=SCHEDULED",
      },
      {
        title: "Completed",
        url: "/appointments?status=COMPLETED",
      },
      {
        title: "Cancelled",
        url: "/appointments?status=CANCELLED",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "/settings",
      },
    ],
  },
];

// Admin-specific nav items (added to regular items)
const adminNavItems = [
  {
    title: "Admin Panel",
    url: "/admin",
    icon: BarChart3,
    isActive: false,
    items: [
      {
        title: "Overview",
        url: "/admin",
      },
      {
        title: "All Appointments",
        url: "/admin/appointments",
      },
      {
        title: "Export Data",
        url: "/admin/appointments?export=true",
      },
      {
        title: "Users",
        url: "/admin/users",
      },
    ],
  },
];

// Team data
const teams = [
  {
    name: "Appointment Scheduler",
    logo: Calendar,
    plan: "Pro",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = useSession();
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Check if user is admin
  React.useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user) {
        const adminStatus = await checkAdminRole();
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [session?.user]);

  // Combine regular nav items with admin items if user is admin
  const navMain = React.useMemo(() => {
    const items = [...userNavMain];
    if (isAdmin) {
      // Insert admin items before settings
      const settingsIndex = items.findIndex(
        (item) => item.title === "Settings",
      );
      if (settingsIndex >= 0) {
        items.splice(settingsIndex, 0, ...adminNavItems);
      } else {
        items.push(...adminNavItems);
      }
    }
    return items;
  }, [isAdmin]);

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
        <TeamSwitcher teams={teams} />
        {/* Admin Toggle - Only show for admin users */}
        {!isPending && isAdmin && <AdminSwitch />}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>{!isPending && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
