"use client";

import { Shield, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { checkAdminRole } from "@/lib/api/hono-client";

export function AdminSwitch() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  // Check if we're on any admin page
  const isAdminPage = pathname.startsWith("/admin");

  useEffect(() => {
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

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex items-center px-2",
          isCollapsed ? "py-1" : "py-1.5",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                isAdminPage
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
                isCollapsed && "justify-center",
              )}
            >
              {isAdminPage ? (
                <ShieldAlert
                  className={cn("size-4", isCollapsed && "size-5")}
                />
              ) : (
                <Shield className={cn("size-4", isCollapsed && "size-5")} />
              )}
              {!isCollapsed && (
                <span className="text-sm font-medium">Admin</span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Go to Admin Dashboard</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
