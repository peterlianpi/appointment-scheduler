"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Check if the current user is an admin
 * This runs server-side and uses Better Auth's session directly
 * No API call needed - faster than client-side checks
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return false;
    }

    // Better Auth admin plugin includes role in session.user
    // Check if role is directly available
    if (session.user.role) {
      return session.user.role === "ADMIN";
    }

    return false;
  } catch (error) {
    console.error("[checkIsAdmin] Error:", error);
    return false;
  }
}

/**
 * Get current user role server-side
 * Returns "ADMIN", "USER", or null if not authenticated
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    return session.user.role || null;
  } catch (error) {
    console.error("[getUserRole] Error:", error);
    return null;
  }
}
