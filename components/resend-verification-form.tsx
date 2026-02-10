"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/action/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

export function ResendVerificationForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await resendVerificationEmail(formData);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        setEmailSent(true);
        // Success toast is handled by the server action
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Verification email sent!</span>
        </div>
        <p className="text-sm text-green-600 text-center">
          Please check your inbox and spam folder. Click the link in the email
          to verify your account.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEmailSent(false)}
          className="mt-2"
        >
          Send to a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Resend
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
