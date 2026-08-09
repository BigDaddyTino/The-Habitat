import type { DefaultSession } from "next-auth";
import type { HabitatRole } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: HabitatRole;
      isActive: boolean;
    };
  }
}
