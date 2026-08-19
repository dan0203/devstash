"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { openai, AI_MODEL, isAiEnabled } from "@/lib/openai";
import { checkRateLimit, rateLimiters, rateLimitErrorMessage } from "@/lib/rate-limit";

const CONTENT_TRUNCATE_LENGTH = 2000;
const MAX_SUGGESTED_TAGS = 5;

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string(),
});

export type GenerateAutoTagsInput = z.infer<typeof generateAutoTagsSchema>;

export interface GenerateAutoTagsState {
  success: boolean;
  tags?: string[];
  error?: string;
}

const GENERIC_AI_ERROR = "Couldn't generate tag suggestions. Try again.";

const generateDescriptionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  itemType: z.string(),
});

export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;

export interface GenerateDescriptionState {
  success: boolean;
  description?: string;
  error?: string;
}

const GENERIC_DESCRIPTION_ERROR = "Couldn't generate a description. Try again.";

function parseTagsFromResponse(outputText: string): string[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(outputText);
  } catch {
    return null;
  }

  const list = Array.isArray(raw) ? raw : Array.isArray((raw as { tags?: unknown })?.tags) ? (raw as { tags: unknown[] }).tags : null;
  if (!list) return null;

  const normalized = Array.from(
    new Set(
      list
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, MAX_SUGGESTED_TAGS);

  return normalized;
}

export async function generateAutoTags(input: GenerateAutoTagsInput): Promise<GenerateAutoTagsState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI features require a Pro plan" };
  }

  if (!isAiEnabled()) {
    return { success: false, error: "AI features are not configured" };
  }

  const parsed = generateAutoTagsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const rl = await checkRateLimit(rateLimiters.aiSuggestTags, session.user.id);
  if (!rl.success) {
    return { success: false, error: rateLimitErrorMessage(rl.reset) };
  }

  const truncatedContent = parsed.data.content.trim().slice(0, CONTENT_TRUNCATE_LENGTH);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a tagging assistant for a developer knowledge base. Given an item's title and content, suggest 3-5 short, lowercase, freeform tags that describe it. Respond with strict JSON only, in the shape {\"tags\": [\"tag1\", \"tag2\"]}, and nothing else.",
      input: `Suggest tags for this item and respond in JSON.\n\nTitle: ${parsed.data.title}\n\nContent:\n${truncatedContent || "(no content)"}`,
      text: { format: { type: "json_object" } },
    });

    const tags = parseTagsFromResponse(response.output_text ?? "");
    if (!tags || tags.length === 0) {
      return { success: false, error: GENERIC_AI_ERROR };
    }

    return { success: true, tags };
  } catch (error) {
    console.error("generateAutoTags failed", error);
    return { success: false, error: GENERIC_AI_ERROR };
  }
}

function parseDescriptionFromResponse(outputText: string): string | null {
  let raw: unknown;
  try {
    raw = JSON.parse(outputText);
  } catch {
    return null;
  }

  const description = (raw as { description?: unknown })?.description;
  if (typeof description !== "string") return null;

  const trimmed = description.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const explainCodeSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
  language: z.string().nullable().optional(),
  itemType: z.string(),
});

export type ExplainCodeInput = z.infer<typeof explainCodeSchema>;

export interface ExplainCodeState {
  success: boolean;
  explanation?: string;
  error?: string;
}

const GENERIC_EXPLAIN_ERROR = "Couldn't generate an explanation. Try again.";

function parseExplanationFromResponse(outputText: string): string | null {
  let raw: unknown;
  try {
    raw = JSON.parse(outputText);
  } catch {
    return null;
  }

  const explanation = (raw as { explanation?: unknown })?.explanation;
  if (typeof explanation !== "string") return null;

  const trimmed = explanation.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function explainCode(input: ExplainCodeInput): Promise<ExplainCodeState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI features require a Pro plan" };
  }

  if (!isAiEnabled()) {
    return { success: false, error: "AI features are not configured" };
  }

  const parsed = explainCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const rl = await checkRateLimit(rateLimiters.aiExplainCode, session.user.id);
  if (!rl.success) {
    return { success: false, error: rateLimitErrorMessage(rl.reset) };
  }

  const { content, language, itemType } = parsed.data;
  const truncatedContent = content.trim().slice(0, CONTENT_TRUNCATE_LENGTH);

  const detailLines = [
    `Item type: ${itemType}`,
    language ? `Language: ${language}` : null,
    `Content:\n${truncatedContent}`,
  ].filter(Boolean);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a code-explanation assistant for a developer knowledge base. Given a code snippet or terminal command, explain what it does and the key concepts involved in about 200-300 words. Format the explanation as markdown (short paragraphs, inline code, and lists where useful). Respond with strict JSON only, in the shape {"explanation": "..."}, and nothing else.',
      input: `Explain this code and respond in JSON.\n\n${detailLines.join("\n")}`,
      text: { format: { type: "json_object" } },
    });

    const explanation = parseExplanationFromResponse(response.output_text ?? "");
    if (!explanation) {
      return { success: false, error: GENERIC_EXPLAIN_ERROR };
    }

    return { success: true, explanation };
  } catch (error) {
    console.error("explainCode failed", error);
    return { success: false, error: GENERIC_EXPLAIN_ERROR };
  }
}

const optimizePromptSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
});

export type OptimizePromptInput = z.infer<typeof optimizePromptSchema>;

export interface OptimizePromptState {
  success: boolean;
  optimizedContent?: string;
  error?: string;
}

const GENERIC_OPTIMIZE_ERROR = "Couldn't optimize this prompt. Try again.";

function parseOptimizedPromptFromResponse(outputText: string): string | null {
  let raw: unknown;
  try {
    raw = JSON.parse(outputText);
  } catch {
    return null;
  }

  const optimizedPrompt = (raw as { optimizedPrompt?: unknown })?.optimizedPrompt;
  if (typeof optimizedPrompt !== "string") return null;

  const trimmed = optimizedPrompt.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function optimizePrompt(input: OptimizePromptInput): Promise<OptimizePromptState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI features require a Pro plan" };
  }

  if (!isAiEnabled()) {
    return { success: false, error: "AI features are not configured" };
  }

  const parsed = optimizePromptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const rl = await checkRateLimit(rateLimiters.aiOptimizePrompt, session.user.id);
  if (!rl.success) {
    return { success: false, error: rateLimitErrorMessage(rl.reset) };
  }

  const truncatedContent = parsed.data.content.trim().slice(0, CONTENT_TRUNCATE_LENGTH);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a prompt engineering assistant for a developer knowledge base. Given a prompt intended for use with an AI assistant, refine it for clarity, specificity, and effectiveness while fully preserving its original intent and goal. If the prompt is already clear and effective, return it unchanged. Respond with strict JSON only, in the shape {"optimizedPrompt": "..."}, and nothing else.',
      input: `Optimize this prompt and respond in JSON.\n\nPrompt:\n${truncatedContent}`,
      text: { format: { type: "json_object" } },
    });

    const optimizedContent = parseOptimizedPromptFromResponse(response.output_text ?? "");
    if (!optimizedContent) {
      return { success: false, error: GENERIC_OPTIMIZE_ERROR };
    }

    return { success: true, optimizedContent };
  } catch (error) {
    console.error("optimizePrompt failed", error);
    return { success: false, error: GENERIC_OPTIMIZE_ERROR };
  }
}

export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI features require a Pro plan" };
  }

  if (!isAiEnabled()) {
    return { success: false, error: "AI features are not configured" };
  }

  const parsed = generateDescriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const rl = await checkRateLimit(rateLimiters.aiSuggestDescription, session.user.id);
  if (!rl.success) {
    return { success: false, error: rateLimitErrorMessage(rl.reset) };
  }

  const { title, content, url, language, itemType } = parsed.data;
  const truncatedContent = content?.trim().slice(0, CONTENT_TRUNCATE_LENGTH) || "";

  const detailLines = [
    `Item type: ${itemType}`,
    `Title: ${title}`,
    url ? `URL: ${url}` : null,
    language ? `Language: ${language}` : null,
    `Content:\n${truncatedContent || "(no content)"}`,
  ].filter(Boolean);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a summarizing assistant for a developer knowledge base. Given an item's type, title, and available content, write a concise 1-2 sentence description summarizing what it is or does. Use only the information provided. Respond with strict JSON only, in the shape {\"description\": \"...\"}, and nothing else.",
      input: `Summarize this item and respond in JSON.\n\n${detailLines.join("\n")}`,
      text: { format: { type: "json_object" } },
    });

    const description = parseDescriptionFromResponse(response.output_text ?? "");
    if (!description) {
      return { success: false, error: GENERIC_DESCRIPTION_ERROR };
    }

    return { success: true, description };
  } catch (error) {
    console.error("generateDescription failed", error);
    return { success: false, error: GENERIC_DESCRIPTION_ERROR };
  }
}