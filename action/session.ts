"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get all sessions for the current user
 */
export async function getUserSessions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const sessions = await prisma.session.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      userId: true,
      token: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      ipAddress: true,
      userAgent: true,
    },
  });

  return { success: true, data: sessions };
}

/**
 * Sign out from a specific session
 */
export async function signOutSession(sessionId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the session belongs to the user
  const userSession = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId: session.user.id,
    },
  });

  if (!userSession) {
    return { success: false, error: "Session not found" };
  }

  await prisma.session.delete({
    where: {
      id: sessionId,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Sign out from all other sessions (keep current session)
 */
export async function signOutOtherDevices() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  // Get current session token from the session cookie
  const currentSessionToken = session.session.token;

  // Delete all sessions except the current one
  await prisma.session.deleteMany({
    where: {
      userId: session.user.id,
      token: {
        not: currentSessionToken,
      },
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Sign out from all devices (including current)
 */
export async function signOutAllDevices() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  // Delete all sessions for the user
  await prisma.session.deleteMany({
    where: {
      userId: session.user.id,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
