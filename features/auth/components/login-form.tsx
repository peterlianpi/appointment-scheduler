"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/features/auth/components/password-input";
import Link from "next/link";
import { loginFormSchema, type LoginFormValues } from "../lib/schemas";

// ============================================
// Component
// ============================================

export function LoginForm({
  className,
  redirectUrl,
  ...props
}: {
  className?: string;
  redirectUrl?: string;
}) {
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

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (error) {
        // Check if this is an email verification error
        if (error.message?.toLowerCase().includes("verify")) {
          setError("root", {
            message:
              "Please verify your email address before logging in. Check your email for the verification link.",
          });
          toast.error("Email verification required");
        } else if (
          error.message?.toLowerCase().includes("rate") ||
          error.message?.toLowerCase().includes("too many") ||
          error.message?.toLowerCase().includes("locked")
        ) {
          // Rate limiting error - show appropriate message
          setError("root", {
            message:
              "Too many login attempts. Please wait a moment before trying again.",
          });
          toast.error("Too many login attempts. Please try again later.");
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="m@example.com"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        We&apos;ll never share your email with anyone else.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <PasswordInput
                  name="password"
                  form={form}
                  disabled={isLoading}
                  required
                />
                <p className="text-sm text-right">
                  <Link
                    href="/forgot-password"
                    className="text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </p>
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
                    {/* Only show resend verification link for actual verification errors */}
                    {(form.formState.errors.root.message
                      ?.toLowerCase()
                      .includes("verify your email") ||
                      form.formState.errors.root.message
                        ?.toLowerCase()
                        .includes("verification required") ||
                      form.formState.errors.root.message
                        ?.toLowerCase()
                        .includes("email not verified")) && (
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
                <FieldGroup>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="underline underline-offset-4"
                    >
                      Sign up
                    </Link>
                  </p>
                </FieldGroup>
              </FieldGroup>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
