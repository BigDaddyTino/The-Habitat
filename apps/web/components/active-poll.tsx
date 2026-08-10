import Link from "next/link";
import { Vote } from "lucide-react";

export function ActivePoll({ poll }: { poll: { question: string; closesAt: Date; options: Array<{ id: string; server: { displayName: string; worldName: string }; _count: { votes: number } }> } | null }) {
  if (!poll) return null;
  return <aside className="active-poll"><div><p className="eyebrow">Game-night vote</p><h2>{poll.question}</h2></div><Vote aria-hidden="true" size={20} /><div className="poll-result-list">{poll.options.map((option) => <p key={option.id}><span>{option.server.displayName}</span><strong>{option._count.votes}</strong></p>)}</div><Link className="primary-link" href="/polls">Cast your vote</Link><time dateTime={poll.closesAt.toISOString()}>Closes {poll.closesAt.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}</time></aside>;
}
