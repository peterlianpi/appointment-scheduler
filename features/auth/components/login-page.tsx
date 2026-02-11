"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import type { LoginPageProps } from "../types/auth";

// ============================================
// Zod Schema
// ============================================

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// ============================================
// Password Input Component (Inline)
// ============================================

function PasswordInput({
  name,
  placeholder,
  disabled,
  form,
}: {
  name: "password";
  placeholder?: string;
  disabled?: boolean;
  form: ReturnType<typeof useForm<LoginFormValues>>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={name}
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
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// ============================================
// Login Page Component
// ============================================

export function LoginPage({
  showRegisterLink = true,
  showForgotPasswordLink = true,
  redirectUrl,
  className,
}: LoginPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { setError } = form;

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (error) {
        // Check if this is an email verification error
        const isVerificationError =
          error.status === 403 ||
          error.message?.toLowerCase().includes("verify");

        if (isVerificationError) {
          setError("root", {
            message:
              "Please verify your email address before logging in. Check your email for the verification link.",
          });
          toast.error("Email verification required");
        } else {
          setError("root", { message: error.message || "Failed to login" });
          toast.error(error.message || "Failed to login");
        }
        return;
      }

      toast.success("Login successful!");
      router.push(redirectUrl || "/dashboard");
      router.refresh();
    } catch {
      setError("root", { message: "An unexpected error occurred" });
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    try {
      await authClient.signIn.social({ provider });
    } catch {
      toast.error("Failed to initiate social login");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    disabled={isLoading}
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <PasswordInput
                    name="password"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    form={form}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </Field>

                {showForgotPasswordLink && (
                  <p className="text-sm text-right">
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={form.watch("rememberMe")}
                    onCheckedChange={(checked) =>
                      form.setValue("rememberMe", checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>

                {form.formState.errors.root && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-500">
                      {form.formState.errors.root.message}
                    </p>
                    {(form.formState.errors.root.message
                      ?.toLowerCase()
                      .includes("verify") ||
                      form.formState.errors.root.message
                        ?.toLowerCase()
                        .includes("email")) && (
                      <p className="text-sm text-blue-600">
                        <Link
                          href="/verification-pending"
                          className="underline underline-offset-4 hover:text-blue-800"
                        >
                          Click here to resend verification email
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                <Field>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSocialLogin("google")}
                  >
                    Login with Google
                  </Button>
                </Field>

                {showRegisterLink && (
                  <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="underline underline-offset-4"
                    >
                      Sign up
                    </Link>
                  </p>
                )}
              </FieldGroup>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
