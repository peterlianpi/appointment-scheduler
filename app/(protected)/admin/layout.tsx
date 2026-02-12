import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current session
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    // Not authenticated, redirect to login
    console.warn("[AdminLayout] Unauthorized access attempt - no session");
    redirect("/login");
  }

  // Check if user has admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    // Not an admin, redirect to dashboard
    console.warn(
      `[AdminLayout] Non-admin user "${session.user.email}" attempted to access admin area`,
    );
    redirect("/dashboard");
  }

  return <>{children}</>;
}
