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

interface AdminSwitchProps {
  /** Admin status from parent - if not provided, component won't render */
  isAdmin?: boolean;
  /** Optional: show loading state */
  isLoading?: boolean;
}

export function AdminSwitch({ isAdmin, isLoading }: AdminSwitchProps) {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const isAdminPage = pathname.startsWith("/admin");

  // Don't render if not admin or still loading
  if (isLoading || !isAdmin) {
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

/**
 * Hook to check admin status - used by parent components
 * Checks directly from API without caching
 */
export function useAdminStatus(): boolean | null {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!session?.user) {
        setIsAdmin(false);
        return;
      }

      // Fetch from API
      try {
        const adminStatus = await checkAdminRole();
        setIsAdmin(adminStatus);
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [session?.user]);

  return isAdmin;
}
