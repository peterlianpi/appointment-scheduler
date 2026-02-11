import { LoginPageWrapper } from "@/features/auth/components/auth-form-wrapper";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;

  // Check if user is already authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect already authenticated users to dashboard or callbackURL
  if (session) {
    redirect(callbackURL || "/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginPageWrapper redirectUrl={callbackURL} />
      </div>
    </div>
  );
}
