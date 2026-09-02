/**
 * Voiced dialogue: the shared vocabulary of the codex export contract v5.
 *
 * Every spoken line in a story node is a stable, addressable record — speaker,
 * exact spoken words, performance direction, intensity — so a voice pipeline
 * can render one WAV per line and regenerate only the lines whose content
 * changed, and a game importer can create one dialogue node per line. This
 * module is the pure part of that contract: the fixed tag lists, the identity
 * and hash conventions, and the text rules the website enforces on save and
 * the exporter enforces again before publishing. No I/O and no hashing here
 * (this module is shared with the browser); the exporter hashes.
 */

export const dialogueEmotionTags = [
  "neutral",
  "calm",
  "dry",
  "amused",
  "warm",
  "sad",
  "afraid",
  "angry",
  "urgent",
  "contempt",
  "protective",
  "command",
] as const;
export type DialogueEmotionTag = (typeof dialogueEmotionTags)[number];

/**
 * Roles a line may be spoken by when the speaker is not a CHARACTER entry.
 * Free text is allowed (any kebab-case role); these are the ones the pipeline
 * knows how to voice generically, offered first in the picker.
 */
export const dialogueSpeakerRoles = ["player", "radio", "stormglass-guard", "pearl-mercenary", "mercenary", "guard", "unattributed"] as const;

/** The speaker role a migration assigns to a quote it cannot attribute. */
export const unattributedSpeakerRole = "unattributed";

export const dialogueDefaultLocale = "en-US";
export const dialogueIntensityMin = 1;
export const dialogueIntensityMax = 10;
export const dialogueIntensityDefault = 5;
export const dialogueTextMaxLength = 1000;
export const dialoguePerformanceMaxLength = 200;
export const dialogueRoleMaxLength = 64;

export const isDialogueRole = (value: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length <= dialogueRoleMaxLength;
export const isDialogueLocale = (value: string) => /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value);

/**
 * Why a spoken text is not acceptable, or null when it is. The same rule
 * gates the website's save (A5) and the exporter's publish (E): one
 * utterance, plain words, nothing the voice model would read aloud by
 * mistake.
 */
export function dialogueTextProblem(text: string): string | null {
  if (text.trim().length === 0) return "empty";
  if (/[\r\n]/.test(text)) return "contains a line break";
  if (text.includes("[[")) return 'contains "[[" (a bible link)';
  if (text.includes("**")) return 'contains "**" (markdown emphasis)';
  if (text.includes("#")) return 'contains "#"';
  if (text.length > dialogueTextMaxLength) return `longer than ${dialogueTextMaxLength} characters`;
  return null;
}

/** `<arcSlug>/<nodeKey>/<nn>`: nn is the two-digit line number, never renumbered. */
export function dialogueLineId(arcSlug: string, nodeKey: string, number: number) {
  return `${arcSlug}/${nodeKey}/${String(number).padStart(2, "0")}`;
}

/** `<arcSlug>/<nodeKey>/opt-<edgeKey>`: a CHOICE option, keyed by its edge. */
export function dialogueOptionLineId(arcSlug: string, nodeKey: string, edgeKey: string) {
  return `${arcSlug}/${nodeKey}/opt-${edgeKey}`;
}

/** The bytes the exporter hashes for `contentHash` (sha256, hex). */
export function dialogueContentHashInput(speaker: string, text: string, locale: string) {
  return `${speaker}\n${text}\n${locale}`;
}

/** The bytes the exporter hashes for `directionHash` (sha256, hex). */
export function dialogueDirectionHashInput(performance: string, intensity: number, emotion: readonly string[]) {
  return `${performance}\n${intensity}\n${emotion.join(",")}`;
}

/** One line as the snapshot (B1) and the sidecar (C) carry it. */
export type DialogueLineRecord = {
  lineId: string;
  order: number;
  speakerSlug: string | null;
  speakerRole: string | null;
  listenerSlug: string | null;
  text: string;
  performance: string;
  intensity: number;
  emotion: string[];
  locale: string;
  voiced: boolean;
  contentHash: string;
  directionHash: string;
};

/** A CHOICE node's option, one per labelled outgoing edge (B2). */
export type DialogueOptionRecord = {
  edgeKey: string;
  toNodeKey: string;
  text: string;
  voiced: boolean;
  lineId: string;
};

export const dialogueLinesStatuses = ["NONE"] as const;

// ---------------------------------------------------------------------------
// Voice profiles (B3)
// ---------------------------------------------------------------------------

export const storyVoiceConsentKinds = ["SYNTHETIC_DESIGNED", "RECORDED_OWNER", "RECORDED_PERFORMER"] as const;
export type StoryVoiceConsentKind = (typeof storyVoiceConsentKinds)[number];
export const storyVoiceConsentKindLabels: Record<StoryVoiceConsentKind, string> = {
  SYNTHETIC_DESIGNED: "Synthetic — designed from the prompt",
  RECORDED_OWNER: "Recorded — the owner's own voice",
  RECORDED_PERFORMER: "Recorded — a performer, with consent on file",
};

export const storyVoiceStatuses = ["NONE", "DESIGNED", "APPROVED"] as const;
export type StoryVoiceStatus = (typeof storyVoiceStatuses)[number];

export const storyFaceRigs = ["metahuman", "none", "unknown"] as const;
export type StoryFaceRig = (typeof storyFaceRigs)[number];

export type StoryVoiceProfile = {
  sex: string | null;
  ageRange: string | null;
  accent: string | null;
  timbre: string | null;
  pace: string | null;
  register: string | null;
  /** One paragraph a voice-design model can work from. */
  designPrompt: string | null;
  /** A logical asset path in the bundle (images/ or audio/), or null. */
  referenceClipAssetId: string | null;
  consent: { kind: StoryVoiceConsentKind; statement: string | null; signedAt: string | null };
  faceRig: StoryFaceRig;
};

export function emptyVoiceProfile(): StoryVoiceProfile {
  return {
    sex: null,
    ageRange: null,
    accent: null,
    timbre: null,
    pace: null,
    register: null,
    designPrompt: null,
    referenceClipAssetId: null,
    consent: { kind: "SYNTHETIC_DESIGNED", statement: null, signedAt: null },
    faceRig: "unknown",
  };
}

/**
 * The voice profile a role is voiced with when no character stands behind it.
 * Generic on purpose: a role is a category of extra, not a person.
 */
export function roleVoiceProfile(role: string): StoryVoiceProfile {
  const known: Record<string, Partial<StoryVoiceProfile>> = {
    player: { designPrompt: "The player character. Not voiced by the pipeline; the line is shown, not spoken.", register: "player" },
    radio: { timbre: "compressed, band-limited", pace: "clipped", register: "military radio traffic", designPrompt: "A voice over a field radio: compressed, band-limited, half a step from panic or fully flat, with squelch tails. Never narration." },
    "stormglass-guard": { register: "sentry challenge", designPrompt: "A Stormglass Cartel sentry: tired, loud, procedural. Challenges first and reads the insignia second." },
    "pearl-mercenary": { register: "contractor banter", designPrompt: "A Tropic Pearl contractor: professional, well-paid, occasionally funny about their own side. Never a villain's voice." },
    mercenary: { register: "soldier under fire", designPrompt: "A mercenary in a firefight: shouted, breathless, tactical." },
    guard: { register: "sentry challenge", designPrompt: "A checkpoint guard: a shouted challenge, then a shouted order." },
    unattributed: { designPrompt: "A quote the migration could not attribute. Not voiced until a writer names the speaker." },
  };
  return { ...emptyVoiceProfile(), ...(known[role] ?? { designPrompt: `A ${role.replaceAll("-", " ")}: an extra, voiced generically.` }) };
}

/** A human-readable title for a role slug: "pearl-mercenary" → "Pearl mercenary". */
export function roleTitle(role: string) {
  const words = role.replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
