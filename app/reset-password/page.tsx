"use client";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPageRoute() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm />
    </div>
  );
}
