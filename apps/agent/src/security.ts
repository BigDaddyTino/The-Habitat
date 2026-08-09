import { timingSafeEqual } from "node:crypto";

export function normalizeRemoteAddress(address: string | undefined): string | null {
  if (!address) return null;
  return address.startsWith("::ffff:") ? address.slice("::ffff:".length) : address;
}

export function hasValidAgentToken(authorization: string | undefined, expectedToken: string): boolean {
  const providedToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function isAuthorizedRequest(input: { remoteAddress: string | undefined; authorization: string | undefined }, allowedIps: readonly string[], token: string): boolean {
  const remoteAddress = normalizeRemoteAddress(input.remoteAddress);
  return remoteAddress !== null && allowedIps.includes(remoteAddress) && hasValidAgentToken(input.authorization, token);
}
