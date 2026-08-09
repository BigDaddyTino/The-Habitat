import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasRequiredRole, type HabitatRole } from "./permissions";

export async function requireRole(role: HabitatRole) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.isActive || !hasRequiredRole(user.role, role)) {
    redirect("/sign-in");
  }

  return user;
}

export async function hasRole(role: HabitatRole) {
  const session = await auth();
  const user = session?.user;
  return Boolean(user?.id && user.isActive && hasRequiredRole(user.role, role));
}
