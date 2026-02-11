"use client";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPageRoute() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ForgotPasswordForm
        onSuccess={() => {
          // Success state is handled internally by the component
        }}
        onLoginClick={() => {
          router.push("/login");
        }}
      />
    </div>
  );
}
