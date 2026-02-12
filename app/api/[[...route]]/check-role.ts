import { auth } from "@/lib/auth";
import { Context, Hono } from "hono";


// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkIsAdmin(c: Context): Promise<boolean> {
  const cookie = c.req.header("cookie");
  const headersObj: Record<string, string> = cookie ? { Cookie: cookie } : {};

  const session = await auth.api.getSession({ headers: headersObj });
  if (!session?.user) {
    return false;
  }

  // Import prisma here to avoid circular dependency
  const { default: prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}



const app = new Hono()
 // ============================================
  // GET /api/check-role - Check if current user is admin
  // ============================================
  .get("/", async (c) => {
    try {
      const isAdmin = await checkIsAdmin(c);
      return c.json({ success: true, isAdmin });
    } catch (error) {
      console.error("[CheckRole] Error:", error);
      return c.json({ success: false, isAdmin: false, error: "Failed to check role" }, 500);
    }
  })

  export default app