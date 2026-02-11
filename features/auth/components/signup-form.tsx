"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { toast } from "sonner";
import { FormField } from "@/features/form/components";
import { PasswordStrengthIndicator } from "@/features/auth/components/password-strength-indicator";

import { sendWelcomeEmail, resendVerificationEmail } from "../lib/auth-api";

// ============================================
// Zod Schema
// ============================================

const signupFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

// ============================================
// Component
// ============================================

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { setError } = form;

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (error) {
        setError("root", {
          message: error.message || "Failed to create account",
        });
        toast.error(error.message || "Failed to create account");
        return;
      }

      // Send both verification and welcome emails in parallel
      const [verificationResult, welcomeResult] = await Promise.all([
        resendVerificationEmail(values.email),
        sendWelcomeEmail(values.name, values.email),
      ]);

      if (verificationResult?.error) {
        console.error(
          "[Signup] Failed to send verification email:",
          verificationResult.error,
        );
        toast.error(
          verificationResult.error ||
            "Account created but verification email failed. Please use the resend form.",
        );
      } else {
        console.log(
          "[Signup] Verification email sent successfully to:",
          values.email,
        );
      }

      if (!welcomeResult.success) {
        console.error(
          "[Signup] Failed to send welcome email:",
          welcomeResult.error,
        );
      } else {
        console.log(
          "[Signup] Welcome email sent successfully to:",
          values.email,
        );
      }

      // Show success message and redirect to verification pending page
      toast.success(
        "Account created! Please check your email to verify your account.",
      );
      router.push("/verification-pending");
    } catch {
      setError("root", { message: "An unexpected error occurred" });
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <FormField
                name="name"
                label="Full Name"
                type="text"
                placeholder="John Doe"
                disabled={isLoading}
                required
              />
              <FormField
                name="email"
                label="Email"
                type="email"
                placeholder="m@example.com"
                description="We'll use this to contact you. We will not share your email with anyone else."
                disabled={isLoading}
                required
              />
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    disabled={isLoading}
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthIndicator
                  password={form.watch("password") || ""}
                  name={form.watch("name") || ""}
                  email={form.watch("email") || ""}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </Field>
              <FormField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                description="Please confirm your password."
                disabled={isLoading}
                required
              />
              {form.formState.errors.root && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <Button variant="outline" type="button" disabled={isLoading}>
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <a href="/login" className="underline underline-offset-4">
                    Sign in
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
