import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");

  return (
    <section className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Habitat profile</p>
        <h1>{session.user.name ?? "Habitat member"}</h1>
        <p>Identity claims, titles, and game history will appear here once the player system opens.</p>
      </div>
    </section>
  );
}
