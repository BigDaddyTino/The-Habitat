import { getBloomfallV3CodexArt } from "./bloomfall-v3-art";
import { getRegionKeyart } from "./region-branding";

/** Resolve the actual artwork associated with a Codex place. V3 bindings take
 * precedence over the older public region-art set; the map pin is reserved
 * for places that genuinely have no registered image. */
export function getPlaceKeyart(
  slug: string,
  meta: unknown,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string | null {
  return getBloomfallV3CodexArt(slug, meta, environment) ?? getRegionKeyart(slug);
}
