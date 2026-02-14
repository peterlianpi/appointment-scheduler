"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { PasswordStrengthIndicator } from "@/features/auth/components/password-strength-indicator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormInstance = any;

interface PasswordInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  form?: FormInstance;
  showStrength?: boolean;
  showConfirm?: boolean;
  confirmPassword?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PasswordInput({
  name,
  label = "Password",
  placeholder = "Enter your password",
  form,
  showStrength = false,
  showConfirm = false,
  confirmPassword,
  className,
  disabled = false,
  required = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field className={className}>
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          disabled={disabled}
          {...form?.register(name)}
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {showStrength && form && (
        <PasswordStrengthIndicator
          password={form.watch(name) || ""}
          name={form.watch("name") || ""}
          email={form.watch("email") || ""}
          oldPassword={form.watch("currentPassword") || ""}
        />
      )}
      {showConfirm && form && confirmPassword && (
        <p
          className={`text-sm ${
            form.watch(name) === confirmPassword
              ? "text-green-500"
              : "text-muted-foreground"
          }`}
        >
          {form.watch(name) === confirmPassword
            ? "✓ Passwords match"
            : "Passwords do not match"}
        </p>
      )}
      {form?.formState.errors[name] && (
        <p className="text-sm text-red-500">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </Field>
  );
}
