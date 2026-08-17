import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import {
  buildStoryAssistantPrompt,
  describeStoryAssistantContext,
  GeminiApiError,
  geminiProviderKey,
  resolveGeminiProvider,
  storyAssistantSystemInstruction,
  type StoryAssistantContext,
  type StoryAssistantEntry,
  type StoryAssistantNode,
} from "@habitat/shared";
import { analyzeStoryGraph, type StoryGraphEdge, type StoryGraphNode } from "@habitat/shared";

const db = getPrismaClient();

export type AssistantOutcome = "ANSWERED" | "BLOCKED" | "RATE_LIMITED" | "BUDGET_EXHAUSTED" | "UNAVAILABLE" | "UNCONFIGURED";

export type AssistantReply =
  | { ok: true; answer: string }
  | { ok: false; outcome: Exclude<AssistantOutcome, "ANSWERED">; message: string };

export function storyAssistantProvider() {
  return resolveGeminiProvider(process.env);
}

/** True when the assistant is configured and switched on. */
export function isStoryAssistantAvailable() {
  return storyAssistantProvider() !== null;
}

function utcUsageDay(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

/**
 * Daily spend guard against the same `ProviderRequestUsage` counter the worker's
 * providers use.
 *
 * This deliberately duplicates `apps/worker/src/provider-budget.ts` rather than
 * importing it: the web app and the worker are separate deployables, and
 * reaching across that boundary for fifteen lines would couple them for no
 * benefit. The counter row is shared, so the budget is still global.
 */
async function reserveAssistantRequest(dailyLimit: number) {
  const usageDay = utcUsageDay();
  return db.$transaction(async (tx) => {
    const usage = await tx.providerRequestUsage.upsert({
      where: { provider_usageDay: { provider: geminiProviderKey, usageDay } },
      create: { provider: geminiProviderKey, usageDay, requestCount: 0 },
      update: {},
      select: { id: true, requestCount: true },
    });
    if (usage.requestCount + 1 > dailyLimit) return false;
    await tx.providerRequestUsage.update({ where: { id: usage.id }, data: { requestCount: { increment: 1 } } });
    return true;
  });
}

/**
 * Builds the extract the model is shown.
 *
 * Scope is the point: one arc plus the bible, nothing else. The assistant is
 * for the story map, so it is never handed another arc's board, and never
 * anything about servers, members, or the rest of the Habitat.
 *
 * Archived and rejected material is excluded — a writer asking "what is true"
 * should not be answered from a branch that was thrown out.
 */
export async function buildAssistantContext(arcId: string | null, nodeId: string | null): Promise<StoryAssistantContext> {
  const workingStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;

  const [arc, entries] = await Promise.all([
    arcId
      ? db.storyArc.findUnique({
          where: { id: arcId },
          include: {
            nodes: {
              where: { status: { in: [...workingStatuses] } },
              orderBy: { key: "asc" },
              include: { entryLinks: { include: { entry: { select: { title: true } } } } },
            },
            edges: { where: { status: { in: [...workingStatuses] } }, orderBy: [{ fromNodeId: "asc" }, { position: "asc" }] },
          },
        })
      : Promise.resolve(null),
    db.storyEntry.findMany({
      where: { status: { in: [...workingStatuses] } },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
      select: { kind: true, slug: true, title: true, status: true, summary: true, body: true },
    }),
  ]);

  if (!arc) {
    return { arc: null, nodes: [], entries: entries as StoryAssistantEntry[], problems: [], focusNodeKey: null };
  }

  const keyById = new Map(arc.nodes.map((node) => [node.id, node.key]));
  const nodes: StoryAssistantNode[] = arc.nodes.map((node) => ({
    key: node.key,
    kind: node.kind,
    title: node.title,
    status: node.status,
    summary: node.summary,
    body: node.body,
    choices: arc.edges
      .filter((edge) => edge.fromNodeId === node.id && keyById.has(edge.toNodeId))
      .map((edge) => ({ label: edge.label, condition: edge.condition, toKey: keyById.get(edge.toNodeId) as string })),
    references: node.entryLinks.map((linked) => linked.entry.title),
  }));

  const graphNodes: StoryGraphNode[] = nodes.map((node) => ({ key: node.key, kind: node.kind, title: node.title }));
  const graphEdges: StoryGraphEdge[] = nodes.flatMap((node) => node.choices.map((choice) => ({ fromKey: node.key, toKey: choice.toKey, label: choice.label })));

  return {
    arc: { slug: arc.slug, title: arc.title, summary: arc.summary, isMainline: arc.isMainline, status: arc.status },
    nodes,
    entries: entries as StoryAssistantEntry[],
    problems: analyzeStoryGraph(graphNodes, graphEdges),
    focusNodeKey: (nodeId && keyById.get(nodeId)) || null,
  };
}

type AskInput = {
  userId: string;
  arcId: string | null;
  nodeId: string | null;
  question: string;
};

/**
 * Asks The Warden, and records the exchange whatever happens.
 *
 * Every exit path below writes exactly one `StoryAssistantMessage`. That is the
 * audit requirement: a question that was refused before it reached Gemini is
 * still a question a member asked, and it is recorded as such.
 */
export async function askStoryAssistant(input: AskInput): Promise<AssistantReply> {
  const question = input.question.trim().slice(0, 2000);
  const provider = storyAssistantProvider();

  const record = async (
    outcome: AssistantOutcome,
    fields: { answer?: string; contextSummary?: string; revisionCursor?: string | null; promptTokens?: number | null; responseTokens?: number | null; thinkingTokens?: number | null; latencyMs?: number | null; failureReason?: string },
  ) => {
    await db.storyAssistantMessage.create({
      data: {
        userId: input.userId,
        arcId: input.arcId,
        nodeId: input.nodeId,
        question,
        answer: fields.answer ?? null,
        outcome,
        model: provider?.model ?? "unconfigured",
        contextSummary: fields.contextSummary ?? "not built",
        revisionCursor: fields.revisionCursor ?? null,
        promptTokens: fields.promptTokens ?? null,
        responseTokens: fields.responseTokens ?? null,
        thinkingTokens: fields.thinkingTokens ?? null,
        latencyMs: fields.latencyMs ?? null,
        failureReason: fields.failureReason?.slice(0, 300) ?? null,
      },
    });
  };

  if (!provider) {
    await record("UNCONFIGURED", { failureReason: "No GEMINI_API_KEY, or HABITAT_STORY_ASSISTANT is off." });
    return { ok: false, outcome: "UNCONFIGURED", message: "The Warden is not on duty — no Gemini key is configured yet." };
  }

  // Per-member throttle before the shared budget, so one enthusiastic writer
  // cannot drain the clubhouse's daily allowance on their own.
  const since = new Date(Date.now() - 3_600_000);
  const recentCount = await db.storyAssistantMessage.count({ where: { userId: input.userId, createdAt: { gt: since }, outcome: { in: ["ANSWERED", "BLOCKED"] } } });
  if (recentCount >= provider.memberHourlyLimit) {
    await record("RATE_LIMITED", { failureReason: `${recentCount} questions in the last hour, limit ${provider.memberHourlyLimit}.` });
    return { ok: false, outcome: "RATE_LIMITED", message: `You have asked ${recentCount} questions this hour. The Warden needs a minute — try again shortly.` };
  }

  if (!(await reserveAssistantRequest(provider.dailyRequestBudget))) {
    await record("BUDGET_EXHAUSTED", { failureReason: `Daily budget of ${provider.dailyRequestBudget} requests is spent.` });
    return { ok: false, outcome: "BUDGET_EXHAUSTED", message: "The Warden has answered all he can today. The daily budget resets at midnight UTC." };
  }

  const [context, newestRevision, priorTurns] = await Promise.all([
    buildAssistantContext(input.arcId, input.nodeId),
    db.storyRevision.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } }),
    // A short memory, so "what about the other one?" means something. Only this
    // member's own answered exchanges on this arc, and only a few — history is
    // paid for in tokens on every subsequent question.
    getAssistantThread(input.userId, input.arcId, 4),
  ]);
  const contextSummary = describeStoryAssistantContext(context);
  const revisionCursor = newestRevision?.id ?? null;

  const startedAt = Date.now();
  try {
    const answer = await provider.ask({
      systemInstruction: storyAssistantSystemInstruction,
      // Only the questions are replayed, not the extract each was answered
      // against — the codex may have moved on since, and the current extract
      // travels with this turn.
      history: priorTurns.flatMap((turn) => [
        { role: "user" as const, text: turn.question },
        { role: "model" as const, text: turn.answer ?? "" },
      ]),
      question: buildStoryAssistantPrompt(context, question),
      temperature: 0.7,
      // Flash 3.7 reasons before it writes, and that reasoning is drawn from
      // this same allowance — a live probe spent 108 thinking tokens to produce
      // a two-token reply. A budget sized only for the ~200-word answer the
      // persona asks for would be consumed entirely by thinking and return a
      // successful response with nothing in it.
      maxOutputTokens: 4_000,
    });

    await record("ANSWERED", {
      answer: answer.text,
      contextSummary,
      revisionCursor,
      promptTokens: answer.promptTokens,
      responseTokens: answer.responseTokens,
      thinkingTokens: answer.thinkingTokens,
      latencyMs: Date.now() - startedAt,
      failureReason: answer.finishReason && answer.finishReason !== "STOP" ? `finishReason ${answer.finishReason}` : undefined,
    });
    return { ok: true, answer: answer.text };
  } catch (cause) {
    const latencyMs = Date.now() - startedAt;
    const failure = cause instanceof Error ? cause.message : "Unknown failure.";
    const outcome: AssistantOutcome =
      cause instanceof GeminiApiError && cause.code === "BLOCKED" ? "BLOCKED"
        : cause instanceof GeminiApiError && cause.code === "RATE_LIMITED" ? "RATE_LIMITED"
          : "UNAVAILABLE";

    await record(outcome, { contextSummary, revisionCursor, latencyMs, failureReason: failure });
    return {
      ok: false,
      outcome: outcome as Exclude<AssistantOutcome, "ANSWERED">,
      // Provider messages here are our own strings from the Gemini client, not
      // relayed provider prose, so they are safe to show a member.
      message: cause instanceof GeminiApiError ? cause.message : "The Warden could not be reached. Try again shortly.",
    };
  }
}

/**
 * The audit surface. Every exchange by every member, newest first, with the
 * outcome and cost attached — an audit trail nobody can read is not an audit.
 */
export async function getAssistantAudit(limit = 50) {
  const [rows, today, totals] = await Promise.all([
    db.storyAssistantMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { displayName: true, name: true, username: true } },
        arc: { select: { slug: true, title: true } },
      },
    }),
    db.providerRequestUsage.findUnique({ where: { provider_usageDay: { provider: geminiProviderKey, usageDay: utcUsageDay() } }, select: { requestCount: true } }),
    db.storyAssistantMessage.groupBy({ by: ["outcome"], _count: { _all: true } }),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      asker: row.user.displayName ?? row.user.name ?? row.user.username ?? "A member",
      arc: row.arc,
      question: row.question,
      answer: row.answer,
      outcome: row.outcome,
      model: row.model,
      contextSummary: row.contextSummary,
      promptTokens: row.promptTokens,
      responseTokens: row.responseTokens,
      thinkingTokens: row.thinkingTokens,
      latencyMs: row.latencyMs,
      failureReason: row.failureReason,
      createdAt: row.createdAt,
    })),
    requestsToday: today?.requestCount ?? 0,
    countsByOutcome: Object.fromEntries(totals.map((total) => [total.outcome, total._count._all])) as Record<string, number>,
  };
}

/** The signed-in member's own recent exchanges on this arc, oldest first. */
export async function getAssistantThread(userId: string, arcId: string | null, limit = 12) {
  const rows = await db.storyAssistantMessage.findMany({
    where: { userId, arcId, outcome: "ANSWERED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, question: true, answer: true, createdAt: true },
  });
  return rows.reverse();
}
