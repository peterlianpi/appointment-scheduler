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
import { sendWelcomeEmail, resendVerificationEmail } from "../lib/auth-api";
import { cn } from "@/lib/utils";
import type { RegisterFormProps } from "../types/auth";

// ============================================
// Zod Schema
// ============================================

const registerFormSchema = z
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

type RegisterFormValues = z.infer<typeof registerFormSchema>;

// ============================================
// Password Strength Indicator Component
// ============================================

function PasswordStrengthIndicator({
  password,
  name,
  email,
}: {
  password: string;
  name?: string;
  email?: string;
}) {
  const commonPasswords = [
    "password",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "password123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
  ];

  const isSameAsOld = false;
  const containsName =
    name && password.toLowerCase().includes(name.toLowerCase());
  const containsEmail =
    email && password.toLowerCase().includes(email.split("@")[0].toLowerCase());

  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    notSameAsOld: !isSameAsOld,
    notRelatedToPersonal: !containsName && !containsEmail,
  };

  const isCommon =
    commonPasswords.includes(password.toLowerCase()) && password.length > 0;

  const score = Object.values(checks).filter(Boolean).length;
  const strength =
    isCommon || score < 4 ? "weak" : score < 6 ? "medium" : "strong";

  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const strengthTexts = {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  };

  const showChecklist = password.length > 0 && strength !== "strong";

  if (password.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-2"
      role="region"
      aria-label="Password strength indicator"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              strengthColors[strength],
            )}
            style={{ width: `${(score / 6) * 100}%` }}
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={6}
            aria-label={`Password strength: ${strengthTexts[strength]}`}
          />
        </div>
        <span className="text-sm font-medium" aria-live="polite">
          {strengthTexts[strength]}
        </span>
      </div>

      {showChecklist && (
        <ul
          className="text-sm space-y-1"
          aria-label="Password requirements checklist"
        >
          <li className="flex items-center gap-2">
            {password.length >= 12 ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
            At least 12 characters
          </li>
          <li className="flex items-center gap-2">
            {checks.uppercase ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
            One uppercase letter
          </li>
          <li className="flex items-center gap-2">
            {checks.lowercase ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
            One lowercase letter
          </li>
          <li className="flex items-center gap-2">
            {checks.number ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
            One number
          </li>
          <li className="flex items-center gap-2">
            {checks.symbol ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
            One special character
          </li>
          {isCommon && (
            <li className="flex items-center gap-2 text-red-500">
              <span className="text-red-500">✗</span>
              Password is commonly used
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ============================================
// Password Input Component (Inline)
// ============================================

function PasswordInput({
  name,
  label,
  placeholder,
  disabled,
  form,
}: {
  name: "password" | "confirmPassword";
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  form: ReturnType<typeof useForm<RegisterFormValues>>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
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
      {form.formState.errors[name] && (
        <p className="text-sm text-red-500">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </Field>
  );
}

// ============================================
// Register Form Component
// ============================================

export function RegisterForm({
  defaultEmail = "",
  defaultName = "",
  theme = "light",
  showLoginLink = true,
  className,
}: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme classes
  const themeClasses =
    theme === "dark"
      ? "bg-gray-900 border-gray-800"
      : "bg-white border-gray-200";

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      password: "",
      confirmPassword: "",
    },
  });

  const { setError } = form;

  const handleSubmit = async (values: RegisterFormValues) => {
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

      toast.success("Account created! Please check your email to verify your account.");
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
    <Card className={cn(themeClasses, "w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  disabled={isLoading}
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </Field>

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
                  label="Password"
                  placeholder="Create a password"
                  disabled={isLoading}
                  form={form}
                />
                <PasswordStrengthIndicator
                  password={form.watch("password") || ""}
                  name={form.watch("name") || ""}
                  email={form.watch("email") || ""}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <PasswordInput
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  form={form}
                />
                {form.watch("confirmPassword") &&
                  form.watch("password") !== form.watch("confirmPassword") && (
                    <p className="text-sm text-red-500">
                      Passwords do not match
                    </p>
                  )}
                {form.watch("confirmPassword") &&
                  form.watch("password") === form.watch("confirmPassword") &&
                  form.watch("password").length > 0 && (
                    <p className="text-sm text-green-500">✓ Passwords match</p>
                  )}
              </Field>

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

                {showLoginLink && (
                  <FieldDescription className="px-6 text-center">
                    Already have an account?{" "}
                    <a href="/login" className="underline underline-offset-4">
                      Sign in
                    </a>
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
