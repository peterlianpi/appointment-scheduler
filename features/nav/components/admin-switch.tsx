"use client";

import { Shield, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { checkIsAdmin } from "@/lib/auth/admin";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminSwitchProps {
  /** Admin status from parent - if not provided, component will check itself */
  isAdmin?: boolean;
}

export function AdminSwitch({ isAdmin: propIsAdmin }: AdminSwitchProps) {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const isAdminPage = pathname.startsWith("/admin");

  const [isAdmin, setIsAdmin] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // If prop is provided, use it directly without loading state
  const effectiveIsAdmin = propIsAdmin !== undefined ? propIsAdmin : isAdmin;
  const effectiveHasChecked = propIsAdmin !== undefined ? true : hasChecked;

  // Check admin status on mount if no prop provided
  useEffect(() => {
    // Skip if we have a prop or already checked
    if (propIsAdmin !== undefined || hasChecked) return;

    let mounted = true;

    // Call server action directly (no need for useTransition)
    checkIsAdmin()
      .then((result) => {
        if (mounted) {
          setIsAdmin(result);
          setHasChecked(true);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("[AdminSwitch] Error checking admin status:", err);
          setError(err);
          setHasChecked(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [propIsAdmin, hasChecked]);

  // Show skeleton while checking
  if (!effectiveHasChecked) {
    return (
      <div
        className={cn(
          "flex items-center px-2",
          isCollapsed ? "py-1" : "py-1.5",
        )}
      >
        <Skeleton
          className={cn("h-8 rounded-md", isCollapsed ? "w-8" : "w-24")}
        />
      </div>
    );
  }

  // Don't render if not admin
  if (!effectiveIsAdmin) {
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
