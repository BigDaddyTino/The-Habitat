import Link from "next/link";
import { Swords } from "lucide-react";
import { WorldCard } from "@/components/world-card";
import { getWorlds } from "@/lib/world-data";

export default async function WorldsPage() {
  const worlds = await getWorlds();
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">Managed world registry</p><h1>Six worlds. One clubhouse.</h1><p>These are Habitat-hosted worlds. Sleeping is intentional; unexpected down will always stand apart.</p></div><div className="world-grid">{worlds.map((world) => <WorldCard key={world.slug} world={world} />)}</div><aside className="worlds-club-prompt"><Swords aria-hidden="true" size={22} /><div><strong>Looking for Marvel Rivals?</strong><span>It lives in Club Games—squad-first, publisher-hosted, and never dressed up as a managed server.</span></div><Link href="/club-games">Open Club Games</Link></aside></section>;
}
