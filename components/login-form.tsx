"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ============================================
// Zod Schema
// ============================================

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// ============================================
// Component
// ============================================

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { setError, control } = form;

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        // Check if this is an email verification error
        if (
          error.status === 403 ||
          error.message?.toLowerCase().includes("verify")
        ) {
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
      router.push("/dashboard");
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="m@example.com"
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      We&apos;ll never share your email with anyone else.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center">
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
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
                      <a
                        href="/verification-pending"
                        className="underline underline-offset-4 hover:text-blue-800"
                      >
                        Click here to resend verification email
                      </a>
                    </p>
                  )}
                </div>
              )}
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <Button variant="outline" type="button" disabled={isLoading}>
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a href="/signup" className="underline underline-offset-4">
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
