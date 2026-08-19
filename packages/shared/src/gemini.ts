/**
 * A minimal client for Google's Generative Language API, used by the Story
 * Codex assistant and nothing else.
 *
 * Written against the REST endpoint rather than an SDK for the same reason the
 * Twitch and Rivals clients are: this package targets pure ES2022 with no DOM
 * lib, so there is no `URL`/`URLSearchParams` here and `fetch` is reached
 * through a `globalThis` cast.
 */

export type GeminiErrorCode =
  | "UNCONFIGURED"
  | "UNAUTHORIZED"
  | "UNKNOWN_MODEL"
  | "RATE_LIMITED"
  | "BLOCKED"
  | "EMPTY"
  | "UNAVAILABLE";

export class GeminiApiError extends Error {
  override readonly name = "GeminiApiError";
  readonly code: GeminiErrorCode;
  readonly retryAfterSeconds: number | null;

  constructor(code: GeminiErrorCode, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type GeminiFetch = (
  input: string,
  init: { method?: string; headers: Record<string, string>; body?: string; signal?: unknown },
) => Promise<{ status: number; ok: boolean; headers?: { get(name: string): string | null }; json(): Promise<unknown> }>;

export type GeminiAnswer = {
  text: string;
  promptTokens: number | null;
  responseTokens: number | null;
  /**
   * Reasoning tokens, billed and invisible. Flash 3.7 spent 108 of them
   * answering "say ready" with a two-token reply, so this is most of the cost
   * of a short answer and is recorded on every audited exchange.
   */
  thinkingTokens: number | null;
  /** Google's own reason for stopping — "STOP", "MAX_TOKENS", "SAFETY", … */
  finishReason: string | null;
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/**
 * Model ids are interpolated straight into the request path, so they are held
 * to the shape Google actually uses. A stray slash here would otherwise let a
 * misconfigured env var address a different endpoint entirely.
 */
export function isValidGeminiModel(model: string) {
  return /^[a-z0-9][a-z0-9.-]{1,59}$/.test(model);
}

export type GeminiRequest = {
  systemInstruction: string;
  /** Prior turns, oldest first. The final user question is passed separately. */
  history: Array<{ role: "user" | "model"; text: string }>;
  question: string;
  temperature: number;
  maxOutputTokens: number;
};

export async function generateGeminiAnswer(
  apiKey: string,
  model: string,
  request: GeminiRequest,
  fetcher?: GeminiFetch,
): Promise<GeminiAnswer> {
  if (!isValidGeminiModel(model)) {
    throw new GeminiApiError("UNKNOWN_MODEL", `"${model}" is not a usable model id. Check GEMINI_MODEL.`);
  }

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: request.systemInstruction }] },
    contents: [
      ...request.history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      { role: "user", parts: [{ text: request.question }] },
    ],
    generationConfig: {
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      candidateCount: 1,
    },
  });

  // This package has no DOM lib and no Node types, so every host API — `fetch`,
  // `AbortSignal`, and the timer below — is reached through one cast.
  const runtime = globalThis as unknown as {
    fetch: GeminiFetch;
    AbortSignal?: { timeout(milliseconds: number): unknown };
    setTimeout(handler: () => void, milliseconds: number): unknown;
  };
  const send = async () => {
    try {
      return await (fetcher ?? runtime.fetch)(`${GEMINI_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: runtime.AbortSignal?.timeout(60_000),
      });
    } catch {
      throw new GeminiApiError("UNAVAILABLE", "Gemini did not respond. Try again shortly.");
    }
  };

  // 503 from this API means "the model is busy right now", not "the model is
  // broken". Flash 3.7 answers it readily: a live probe needed five attempts to
  // get through, and two of the three real questions writers had asked were
  // sitting in the audit as failures. Since nothing else limits the assistant
  // any more, this backoff is the difference between "ask freely" and "the
  // Warden is usually asleep". Bounded well inside the 60s request timeout.
  const backoffMs = [1_500, 4_000];
  let response = await send();
  for (const delay of backoffMs) {
    if (response.status !== 503) break;
    await new Promise<void>((resolve) => runtime.setTimeout(() => resolve(), delay));
    response = await send();
  }

  if (response.status === 401 || response.status === 403) {
    throw new GeminiApiError("UNAUTHORIZED", "Gemini rejected the API key. Check GEMINI_API_KEY.");
  }
  if (response.status === 404) {
    // The overwhelmingly likely cause is a model id that does not exist for
    // this key, which is worth saying outright rather than reporting as a
    // generic outage the operator would go looking for elsewhere.
    throw new GeminiApiError("UNKNOWN_MODEL", `Gemini has no model named "${model}" for this key. Check GEMINI_MODEL.`);
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers?.get("retry-after"));
    // The only ceiling the assistant has: Google's own. Naming it stops this
    // reading as a Habitat-side refusal the operator would go hunting for.
    throw new GeminiApiError("RATE_LIMITED", "Gemini has hit its own rate limit for this key. Try again in a few minutes.", Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.ceil(retryAfter) : null);
  }
  if (response.status === 400) {
    throw new GeminiApiError("UNKNOWN_MODEL", `Gemini refused the request as malformed, which usually means "${model}" is not a valid model id.`);
  }
  if (response.status === 503) {
    throw new GeminiApiError("UNAVAILABLE", "Gemini is under heavy demand right now. Try again in a moment.");
  }
  if (!response.ok) throw new GeminiApiError("UNAVAILABLE", "Gemini is temporarily unavailable.");

  const payload = asRecord(await response.json());

  const blockReason = asString(asRecord(payload.promptFeedback).blockReason);
  if (blockReason) throw new GeminiApiError("BLOCKED", `Gemini declined to answer that (${blockReason.toLowerCase()}).`);

  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const candidate = asRecord(candidates[0]);
  const finishReason = asString(candidate.finishReason);
  const parts = Array.isArray(asRecord(candidate.content).parts) ? (asRecord(candidate.content).parts as unknown[]) : [];
  const text = parts.map((part) => asString(asRecord(part).text) ?? "").join("").trim();

  const usage = asRecord(payload.usageMetadata);
  const thinkingTokens = asCount(usage.thoughtsTokenCount);

  if (!text) {
    if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
      throw new GeminiApiError("BLOCKED", "Gemini declined to answer that one.");
    }
    // A thinking model spends its output allowance on reasoning first, so an
    // allowance that is merely small enough produces a perfectly successful
    // response with no answer in it. Saying which knob is wrong beats
    // "returned nothing".
    if (finishReason === "MAX_TOKENS") {
      throw new GeminiApiError("EMPTY", `Gemini used its whole output allowance thinking${thinkingTokens === null ? "" : ` (${thinkingTokens} reasoning tokens)`} and never got to an answer. Raise maxOutputTokens.`);
    }
    throw new GeminiApiError("EMPTY", "Gemini returned nothing. Try rephrasing the question.");
  }

  return {
    text,
    promptTokens: asCount(usage.promptTokenCount),
    responseTokens: asCount(usage.candidatesTokenCount),
    thinkingTokens,
    finishReason,
  };
}

// ---------------------------------------------------------------------------
// Provider resolution
// ---------------------------------------------------------------------------

export type GeminiProviderEnv = {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  HABITAT_STORY_ASSISTANT?: string;
  [key: string]: string | undefined;
};

/**
 * No request budget and no per-member throttle: the key is on the free tier,
 * which enforces its own ceiling and answers 429 when it is reached. A second
 * limit on top of that one only ever stopped a writer who was still inside
 * Google's allowance. Usage is still counted and audited — just not capped.
 */
export type GeminiProvider = {
  model: string;
  ask(request: GeminiRequest): Promise<GeminiAnswer>;
};

/** The provider counter name recorded in `ProviderRequestUsage`. */
export const geminiProviderKey = "GEMINI";

export const defaultGeminiModel = "gemini-3.7-flash";

/**
 * Resolves the story assistant, or null when it is unconfigured or switched
 * off. A null provider means the codex says the assistant is unavailable —
 * never that it silently answers from nothing.
 */
export function resolveGeminiProvider(env: GeminiProviderEnv, fetcher?: GeminiFetch): GeminiProvider | null {
  const requested = env.HABITAT_STORY_ASSISTANT?.trim().toLowerCase() ?? "";
  if (requested === "off" || requested === "disabled" || requested === "none") return null;

  const apiKey = env.GEMINI_API_KEY?.trim() ?? "";
  if (!apiKey) return null;

  const model = env.GEMINI_MODEL?.trim() || defaultGeminiModel;
  if (!isValidGeminiModel(model)) return null;

  return { model, ask: (request) => generateGeminiAnswer(apiKey, model, request, fetcher) };
}
