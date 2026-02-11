"use client";

import { Shield, ShieldAlert } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

export function AdminSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        // Check if user is admin by querying the database directly via API
        const response = await fetch("/api/admin/check-admin");
        const data = await response.json();
        setIsAdmin(data.success && data.data?.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      checkAdminPermission();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const isAdminPage = pathname === "/admin";

  const handleToggle = (checked: boolean) => {
    if (checked) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
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
                className="cursor-pointer text-xs font-medium flex items-center gap-1"
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
