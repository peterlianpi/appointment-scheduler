"use client";

import { authClient } from "@/lib/auth-client";
import { sendVerificationEmailAction } from "@/action/verification";
import { sendWelcomeEmail as sendWelcomeEmailAction } from "@/action/mail";
import type {
  LoginCredentials,
  RegisterData,
  AuthApiResponse,
} from "../types/auth";

// ============================================
// Login API
// ============================================

export async function login(
  credentials: LoginCredentials,
): Promise<AuthApiResponse<{ user?: unknown; session?: unknown }>> {
  try {
    const { data, error } = await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
    });

    if (error) {
      // Check if this is an email verification error
      if (error.message?.toLowerCase().includes("verify")) {
        return {
          success: false,
          error:
            "Please verify your email address before logging in. Check your email for the verification link.",
        };
      }
      return { success: false, error: error.message || "Failed to login" };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// Register API
// ============================================

export async function register(
  data: RegisterData,
): Promise<AuthApiResponse<{ user?: unknown; session?: unknown }>> {
  try {
    const { data: result, error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to create account",
      };
    }

    return { success: true, data: result };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// Forgot Password API
// ============================================

export async function forgotPassword(email: string): Promise<AuthApiResponse> {
  try {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to send reset email",
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// Reset Password API
// ============================================

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<AuthApiResponse> {
  try {
    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to reset password",
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// Verify Email API
// ============================================

export async function verifyEmail(
  token: string,
): Promise<AuthApiResponse<{ status: boolean }>> {
  try {
    const result = await authClient.verifyEmail({
      query: { token },
    });

    // Handle the result based on better-auth API response format
    const status =
      result && typeof result === "object" && "status" in result
        ? (result as { status: boolean }).status
        : true;

    return { success: true, data: { status } };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// Resend Verification Email API
// ============================================

export async function resendVerificationEmail(
  email: string,
): Promise<AuthApiResponse> {
  try {
    const result = await sendVerificationEmailAction(email);

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// Sign Out API
// ============================================

export async function signOut(): Promise<AuthApiResponse> {
  try {
    const { error } = await authClient.signOut();

    if (error) {
      return { success: false, error: error.message || "Failed to sign out" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// Social Sign In API
// ============================================

export async function signInWithSocial(
  provider: "google" | "github" | "discord",
): Promise<void> {
  await authClient.signIn.social({
    provider,
  });
}

// ============================================
// Send Welcome Email API
// ============================================

export async function sendWelcomeEmail(
  name: string,
  email: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const result = await sendWelcomeEmailAction(name, email);
    return result;
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
