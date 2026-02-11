"use server";

import { sendVerificationEmailAction } from "@/action/verification";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function resendVerificationEmail(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const result = await sendVerificationEmailAction(email);

    if (result?.error) {
      return { error: result.error };
    }

    toast.success("Verification email sent successfully!");
    revalidatePath("/verification-pending");
    return { success: true };
  } catch {
    return { error: "An unexpected error occurred" };
  }
}
