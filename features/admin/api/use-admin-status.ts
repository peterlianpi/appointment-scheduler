import { useState, useEffect } from "react";
import { checkIsAdmin } from "@/lib/auth/admin";

interface AdminStatus {
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Hook to check admin status using Better Auth's session directly
 * Uses server-side session check for reliability
 */
export function useAdminStatus(): AdminStatus {
  const [status, setStatus] = useState<AdminStatus>({
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    async function checkAdmin() {
      try {
        const isAdmin = await checkIsAdmin();
        setStatus({ isAdmin, isLoading: false });
      } catch (error) {
        console.error("[useAdminStatus] Error:", error);
        setStatus({ isAdmin: false, isLoading: false });
      }
    }

    checkAdmin();
  }, []);
  

  return status;
}
