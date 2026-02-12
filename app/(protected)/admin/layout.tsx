import { checkIsAdmin } from "@/lib/auth/admin";
import { redirect } from "next/navigation";

// Force dynamic rendering since we check authentication on each request
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fast server-side admin check using Better Auth session
  // No separate DB query needed - leverages cached session data
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    console.warn("[AdminLayout] Unauthorized access attempt - not an admin");
    redirect("/dashboard");
  }

  return <>{children}</>;
}
