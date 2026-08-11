import Link from "next/link";
import { ArrowUpRight, Crown, ShieldAlert } from "lucide-react";
import { chronicleGameLabels, chronicleGameTypes, type ChronicleGameType } from "@/lib/world-data";
import { getRecordHallData, type RecordHall } from "@/lib/record-data";

type RecordHallProps = { hall: RecordHall; action: string; searchParams: { game?: string; player?: string } };

export async function RecordHall({ hall, action, searchParams }: RecordHallProps) {
  const gameType = isChronicleGameType(searchParams.game) ? searchParams.game : undefined;
  const player = searchParams.player?.trim() || undefined;
  const { definitions, players } = await getRecordHallData(hall, { gameType, player });
  const isShame = hall === "SHAME";
  const HallIcon = isShame ? ShieldAlert : Crown;
  const title = isShame ? "Hall of Shame" : "Hall of Legends";
  const oppositeHref = isShame ? "/hall-of-legends" : "/hall-of-shame";
  const oppositeLabel = isShame ? "Hall of Legends" : "Hall of Shame";
  const emptyCopy = isShame ? "No shame record is active. Habitat has not yet connected a trusted death or reconnect source." : "No verified record definitions are active.";

  return <section className="page-shell"><div className="page-intro record-intro"><p className="eyebrow">The Habitat records</p><h1>{title}</h1><p>{isShame ? "The record stays playful, factual, and away from moderation or destructive behavior." : "Verified milestones, held by the people who keep showing up."}</p><Link className="primary-link" href={oppositeHref}>{oppositeLabel} <ArrowUpRight aria-hidden="true" size={16} /></Link></div><form className="chronicle-filters" action={action}><label>World<select name="game" defaultValue={gameType ?? ""}><option value="">All applicable worlds</option>{chronicleGameTypes.map((game) => <option key={game} value={game}>{chronicleGameLabels[game]}</option>)}</select></label><label>Record holder<select name="player" defaultValue={player ?? ""}><option value="">All record holders</option>{players.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><button type="submit">Apply filters</button></form>{definitions.length === 0 ? <div className="empty-data"><HallIcon aria-hidden="true" size={24} /><div><h2>The ledger is quiet.</h2><p>{emptyCopy}</p></div></div> : <div className="record-grid">{definitions.map((record) => { const holder = record.currentHolder; const history = record.history[0]; return <article className={`record-card ${isShame ? "shame" : "legends"}`} key={record.id}><div className="record-card-top"><HallIcon aria-hidden="true" size={18} /><p className="eyebrow">{record.category} / {record.gameType ? chronicleGameLabels[record.gameType] : "All worlds"}</p></div><h2>{record.title}</h2><p>{record.description}</p>{holder ? <><div className="record-value"><strong>{holder.valueNumber}</strong><span>{record.valueLabel}</span></div><div className="record-holder"><span>Current holder</span><strong>{holder.holderName}</strong><time dateTime={holder.establishedAt.toISOString()}>{holder.establishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time></div><p className="record-prior">{history?.priorValue === null || !history ? "First verified holder." : `Prior record: ${history.priorHolderName ?? "Unknown"}, ${history.priorValue} ${record.valueLabel}.`}</p><Link className="record-source-link" href={`/chronicle/${holder.sourceEventId}`}>Related Chronicle event <ArrowUpRight aria-hidden="true" size={15} /></Link></> : <div className="record-awaiting"><span>Awaiting first verified record</span><p>This card will remain empty until its trusted rule receives a qualifying event.</p></div>}</article>; })}</div>}</section>;
}

function isChronicleGameType(value: string | undefined): value is ChronicleGameType {
  return Boolean(value) && chronicleGameTypes.includes(value as ChronicleGameType);
}
