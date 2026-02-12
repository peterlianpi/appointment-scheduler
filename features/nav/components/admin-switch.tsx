"use client";

import { Shield, ShieldAlert } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { checkAdminRole } from "@/lib/api/hono-client";

/**
 * Check if the current user has admin role using Hono RPC
 */
async function checkIsAdminUser(
  session: ReturnType<typeof useSession>["data"],
): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  try {
    // Use Hono RPC to check admin role
    const isAdmin = await checkAdminRole();
    return isAdmin;
  } catch (error) {
    console.error("[AdminSwitch] Error checking admin permission:", error);
    return false;
  }
}

export function AdminSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  // Check if we're on any admin page (including nested routes)
  const isAdminPage = pathname.startsWith("/admin");

  // Check admin status - use callback to avoid stale closure
  const checkAdmin = useCallback(async () => {
    setIsLoading(true);
    try {
      const adminStatus = await checkIsAdminUser(session);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("[AdminSwitch] Failed to check admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user) {
      checkAdmin();
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [session?.user, checkAdmin]);

  const handleToggle = (checked: boolean) => {
    setIsNavigating(true);
    if (checked) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    // Reset navigating state after navigation completes
    setTimeout(() => setIsNavigating(false), 500);
  };

  if (isLoading) {
    return null;
  }

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
            <div
              className={cn(
                "flex items-center",
                isCollapsed ? "gap-0" : "gap-2",
              )}
            >
              <Switch
                checked={isAdminPage}
                onCheckedChange={handleToggle}
                id="admin-switch"
                disabled={isNavigating}
                aria-label={
                  isAdminPage ? "Exit Admin Mode" : "Switch to Admin Mode"
                }
                className={cn(isCollapsed && "scale-75")}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isAdminPage ? "Exit Admin Mode" : "Switch to Admin Mode"}</p>
          </TooltipContent>
        </Tooltip>
        {!isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                htmlFor="admin-switch"
                className={cn(
                  "cursor-pointer text-xs font-medium flex items-center gap-1",
                  isNavigating && "opacity-50",
                )}
              >
                {isAdminPage ? (
                  <>
                    <ShieldAlert className="size-3.5" />
                    Admin
                  </>
                ) : (
                  <>
                    <Shield className="size-3.5" />
                    User
                  </>
                )}
              </label>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isAdminPage
                  ? "Currently in Admin Mode"
                  : "Switch to User Mode"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
