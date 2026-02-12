"use server";

import { auth } from "@/lib/auth";

/**
 * Server action to send verification email using Better Auth's server API.
 * This ensures the email is sent with proper server-side context.
 */
export async function sendVerificationEmailAction(email: string) {
  try {
    console.log("[Verification] Sending verification email to:", email);

    // Use Better Auth's internal API to generate verification token and send email
    const result = await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL: "/verify-email/success",
      },
    });

    console.log("[Verification] Verification email sent successfully:", result);

    return { success: true };
  } catch (error) {
    console.error("[Verification] Failed to send verification email:", error);

    // Check if it's a "user already verified" case
    if (error instanceof Error) {
      const message = error.message || "Failed to send verification email";

      // Handle specific error cases
      if (message.toLowerCase().includes("already verified")) {
        return { error: "This email is already verified." };
      }
      if (message.toLowerCase().includes("not found")) {
        return { error: "User not found. Please sign up first." };
      }

      return { error: message };
    }

    return { error: "An unexpected error occurred" };
  }
}

/**
 * Server action to check verification status
 */
export async function checkVerificationStatus(_email: string) {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    if (session?.session) {
      return {
        isVerified: session.user.emailVerified,
        user: session.user,
      };
    }

    return { isVerified: false, user: null };
  } catch {
    return { isVerified: false, user: null };
  }
}
