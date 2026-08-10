import Link from "next/link";
import { Vote } from "lucide-react";
import { auth } from "@/auth";
import { ActivePoll } from "@/components/active-poll";
import { getActivePoll } from "@/lib/community-data";
import { votePoll } from "./actions";

export default async function PollsPage() {
  const session = await auth();
  const userId = session?.user?.id && session.user.isActive ? session.user.id : undefined;
  const poll = await getActivePoll(userId);
  const selectedOptionId = poll?.votes[0]?.optionId;
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">Community game night</p><h1>What are we playing?</h1><p>One active decision at a time. Votes are tied to Habitat members and the result remains visible until the poll closes.</p></div>{!poll ? <div className="empty-data"><Vote aria-hidden="true" size={24} /><div><h2>No poll is open.</h2><p>The next game-night decision will appear here when an administrator opens it.</p></div></div> : <><ActivePoll poll={poll} /><div className="poll-vote-grid">{poll.options.map((option) => <form action={votePoll} className={selectedOptionId === option.id ? "poll-option selected" : "poll-option"} key={option.id}><input name="pollId" type="hidden" value={poll.id} /><input name="optionId" type="hidden" value={option.id} /><div><p className="eyebrow">{option._count.votes} vote{option._count.votes === 1 ? "" : "s"}</p><h2>{option.server.displayName}</h2><p>{option.server.worldName}</p></div>{userId ? <button title={`Vote for ${option.server.displayName}`} type="submit">{selectedOptionId === option.id ? "Selected" : "Vote"}</button> : <Link className="primary-link" href="/sign-in">Sign in to vote</Link>}</form>)}</div></>}</section>;
}
