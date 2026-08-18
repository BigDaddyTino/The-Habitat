"use client";

import { Archive } from "lucide-react";
import { archiveEntry } from "@/app/codex/actions";

export function StoryArchiveEntryButton({ entryId, title }: { entryId: string; title: string }) {
  return (
    <form action={archiveEntry} onSubmit={(event) => {
      if (!window.confirm(`Archive “${title}”? It will leave the working Codex and game export, but its history and connections remain recoverable.`)) event.preventDefault();
    }}>
      <input name="entryId" type="hidden" value={entryId} />
      <button className="story-archive-button" type="submit"><Archive aria-hidden="true" size={13} /> Archive entry</button>
    </form>
  );
}
