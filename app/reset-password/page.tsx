"use client";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { useRouter } from "next/navigation";

export default function ResetPasswordPageRoute() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm
        onSuccess={() => {
          // Success state is handled internally by the component
        }}
        onBackToLogin={() => {
          router.push("/login");
        }}
      />
    </div>
  );
}
