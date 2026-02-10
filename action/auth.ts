"use server";

import { authClient } from "@/lib/auth-client";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function resendVerificationEmail(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });

    if (error) {
      return { error: error.message || "Failed to send verification email" };
    }

    toast.success("Verification email sent successfully!");
    revalidatePath("/verification-pending");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred" };
  }
}
