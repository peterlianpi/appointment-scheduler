import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// This function can be marked `async` if using `await` inside
export default async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If user is NOT logged in, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/settings/:path*"],
};
