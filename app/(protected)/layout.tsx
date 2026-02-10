"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Appointments",
  settings: "Settings",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  all: "All",
};

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  // Parse pathname to get breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const isLast = index === pathSegments.length - 1;
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label =
      BREADCRUMB_LABELS[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    return { segment, label, href, isLast };
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb className="flex-1 overflow-hidden">
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={item.href}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {item.isLast ? (
                        <BreadcrumbPage className="truncate max-w-50">
                          {status
                            ? `${item.label} (${status.charAt(0).toUpperCase() + status.slice(1)})`
                            : item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={item.href}
                          className="truncate max-w-50"
                        >
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ModeToggle />
            </div>
          </div>
        </header>
        <div className="container flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
