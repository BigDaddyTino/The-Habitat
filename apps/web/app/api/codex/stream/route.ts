import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { getStoryCursor, storyReadRole } from "@/lib/story-codex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** How often the stream asks the database whether anything changed. */
const pollMs = 2_000;

/**
 * Idle keep-alive. Cloudflare will drop a connection that says nothing, and a
 * silently dead stream looks exactly like a quiet board.
 */
const keepAliveMs = 20_000;

/**
 * Connections are recycled rather than held forever. EventSource reconnects on
 * its own, so this only bounds how long one leaked tab can keep a polling loop
 * alive against the database.
 */
const maxConnectionMs = 10 * 60_000;

/**
 * Live sync for the codex.
 *
 * The stream carries no story content — only "something changed, and here is
 * the new cursor". Clients respond by re-rendering through the normal
 * authenticated page path, so a writer can never receive a node the server
 * would not have rendered for them anyway.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) {
    return new Response("unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let cursor = "";

  // Shared between start() and cancel() so a consumer-side cancellation tears
  // the timers down too, not only an abort event.
  let finish = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      // Declared before finish() can possibly run — send() may call it on the
      // very first write if the client is already gone.
      let poll: ReturnType<typeof setInterval> | null = null;
      let keepAlive: ReturnType<typeof setInterval> | null = null;
      let expiry: ReturnType<typeof setTimeout> | null = null;

      // Teardown must be reachable from every path. The old version guarded
      // finish() behind the same `closed` flag that send() sets when an
      // enqueue throws — so a stream that died mid-write skipped the
      // clearInterval calls and its poll/keep-alive timers ran for the life
      // of the process, accumulating with every recycled connection.
      finish = () => {
        if (poll) clearInterval(poll);
        if (keepAlive) clearInterval(keepAlive);
        if (expiry) clearTimeout(expiry);
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // Already torn down by the client disconnecting.
        }
      };

      const send = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // The consumer is gone; release the timers with it.
          closed = true;
          finish();
        }
      };

      try {
        cursor = await getStoryCursor();
      } catch {
        // A cursor read that fails at open should not kill the connection; the
        // next tick retries and the client keeps its current view meanwhile.
      }
      send(`retry: 5000\nevent: ready\ndata: ${JSON.stringify({ cursor })}\n\n`);

      poll = setInterval(async () => {
        if (closed) return;
        try {
          const next = await getStoryCursor();
          if (next !== cursor) {
            cursor = next;
            send(`event: changed\ndata: ${JSON.stringify({ cursor })}\n\n`);
          }
        } catch {
          // Transient database trouble is not a reason to disconnect a writer.
        }
      }, pollMs);

      keepAlive = setInterval(() => send(": keep-alive\n\n"), keepAliveMs);
      expiry = setTimeout(() => finish(), maxConnectionMs);
      request.signal.addEventListener("abort", () => finish());
      if (closed) finish();
    },
    // The runtime calls this when the consumer cancels the stream without an
    // abort event — the other path the timers used to leak through.
    cancel() {
      finish();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-store, no-transform, max-age=0",
      Connection: "keep-alive",
      // Without this a buffering proxy holds every event until the stream ends,
      // which turns live sync into no sync at all.
      "X-Accel-Buffering": "no",
    },
  });
}
