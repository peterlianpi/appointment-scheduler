import { LoginForm } from "@/features/auth/components/login-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Check if user is already authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect already authenticated users to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Get callback URL for OAuth redirects
  const params = await searchParams;
  const callbackUrl = params.callbackUrl;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm redirectUrl={callbackUrl} />
      </div>
    </div>
  );
}
