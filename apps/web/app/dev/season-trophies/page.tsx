import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CollectibleCanvas } from "@/components/collectible-canvas";

const previews = [
  { code: "first-light-standard", name: "First Light Standard", kind: "TROPHY" as const, rarity: "LEGENDARY" as const, achievementName: "Season 1 · First Light" },
  { code: "founders-lantern", name: "Founder's Lantern", kind: "TROPHY" as const, rarity: "LEGENDARY" as const, achievementName: "Founding member · First Light" },
];

export default async function SeasonTrophyPreviewPage() {
  const host = (await headers()).get("host")?.toLowerCase() ?? "";
  if (!(host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host.startsWith("[::1]:"))) notFound();
  return <section className="page-shell season-trophy-qa">
    <header><p className="eyebrow">Local visual QA · no reward recorded</p><h1>Season heirlooms</h1><p>Drag to inspect, use the arrow keys to rotate, and scroll to examine the authored front and reverse work.</p></header>
    <div>{previews.map((item) => <article className="rarity-legendary" key={item.code}><div className="season-trophy-qa-stage"><CollectibleCanvas interactive item={item} /></div><p className="eyebrow">Legendary · seasonal shelf</p><h2>{item.name}</h2><span>{item.code === "first-light-standard" ? "Ironwood battle standard · sunrise seal · gilded expedition banner" : "Blackened founder cage · living flame · solid-metal Habitat mark"}</span></article>)}</div>
  </section>;
}
