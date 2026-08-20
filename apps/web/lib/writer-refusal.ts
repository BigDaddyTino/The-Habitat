/**
 * Getting a refusal in front of the person who caused it.
 *
 * Every server action in this app refuses bad writes in plain, curated
 * language — "a contract is a bounty posted somewhere, pick where it is
 * posted", "somebody saved this while you were writing", "that story is
 * already archived". None of it reached anybody. Production Next.js redacts a
 * thrown message down to an opaque digest before it leaves the server, so all
 * hundred and eighty of them arrived as the same generic failure page, and a
 * writer whose only problem was an unfilled dropdown had no way to learn that.
 *
 * Next does respect a digest the error already carries (see
 * `create-error-handler.js`: "If the error already has a digest, respect the
 * original digest"), so the message travels as the digest itself, tagged so an
 * error boundary can tell a refusal we wrote from a crash we did not.
 *
 * A refusal is not an exception in the usual sense — it is the app telling
 * somebody what to do next. Anything unexpected still throws normally and
 * still gets redacted, which is the right treatment for a real crash.
 */

const TAG = "WRITER_REFUSAL::";

/** The cap keeps a runaway message from bloating every RSC payload. */
const LIMIT = 400;

/**
 * A refusal the person on the other end can act on.
 *
 * Throw it exactly where the old `new Error(...)` was thrown; the message is
 * unchanged, and only its route to the screen is different.
 */
export function refusal(message: string): Error & { digest: string } {
  const error = new Error(message) as Error & { digest: string };
  error.digest = TAG + message.slice(0, LIMIT);
  return error;
}

/**
 * The message inside a digest, or null when this was a genuine crash — in
 * which case a boundary should say the honest generic thing rather than
 * inventing a cause.
 */
export function refusalMessage(digest: string | undefined | null): string | null {
  if (typeof digest !== "string" || !digest.startsWith(TAG)) return null;
  const message = digest.slice(TAG.length).trim();
  return message.length > 0 ? message : null;
}
