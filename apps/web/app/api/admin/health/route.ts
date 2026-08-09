import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.isActive) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!hasRequiredRole(user.role, "ADMIN")) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  return NextResponse.json({ status: "ok" });
}
