"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResetPasswordFormProps } from "../types/auth";

// ============================================
// Zod Schema
// ============================================

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// ============================================
// Password Input Component
// ============================================

interface PasswordInputProps {
  name: "password" | "confirmPassword";
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  form: ReturnType<typeof useForm<ResetPasswordValues>>;
  showStrength?: boolean;
}

function PasswordInput({
  name,
  label,
  placeholder,
  disabled,
  form,
  showStrength,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          disabled={disabled}
          {...form.register(name)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <span className="h-4 w-4">🙈</span>
          ) : (
            <span className="h-4 w-4">👁️</span>
          )}
        </button>
      </div>
      {form.formState.errors[name] && (
        <p className="text-sm text-red-500">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </Field>
  );
}

// ============================================
// Reset Password Content Component
// ============================================

function ResetPasswordContent({
  onSuccess,
  onBackToLogin,
  themeClasses,
  className,
}: {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
  themeClasses?: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { setError } = form;

  const handleSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setError("root", {
        message: "Invalid or expired reset link. Please request a new one.",
      });
      toast.error("Invalid or expired reset link");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });

      if (error) {
        setError("root", {
          message: error.message || "Failed to reset password",
        });
        toast.error(error.message || "Failed to reset password");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully!");
      onSuccess?.();
    } catch {
      setError("root", { message: "An unexpected error occurred" });
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLoginClick = () => {
    onBackToLogin?.();
    router.push("/login");
  };

  if (isSuccess) {
    return (
      <Card className={cn(themeClasses, "w-full max-w-md", className)}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Password Reset Complete</CardTitle>
          <CardDescription>
            Your password has been successfully reset. You can now log in with
            your new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={handleBackToLoginClick}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(themeClasses, "w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it is strong and memorable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup className="space-y-4">
              <PasswordInput
                name="password"
                label="New Password"
                placeholder="Create a new password"
                disabled={isLoading}
                form={form}
                showStrength
              />
              <Field>
                <FieldLabel>Confirm Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </Field>
              {form.formState.errors.root && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={handleBackToLoginClick}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </FieldGroup>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

// ============================================
// Reset Password Form Component
// ============================================

export function ResetPasswordForm({
  onSuccess,
  onBackToLogin,
  theme = "light",
  className,
}: ResetPasswordFormProps) {
  // Apply theme classes
  const themeClasses =
    theme === "dark"
      ? "bg-gray-900 border-gray-800 text-gray-100"
      : "bg-white border-gray-200 text-gray-900";

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <Lock className="h-8 w-8 animate-pulse text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent
        onSuccess={onSuccess}
        onBackToLogin={onBackToLogin}
        themeClasses={themeClasses}
        className={className}
      />
    </Suspense>
  );
}
