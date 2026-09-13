"use server";

import { z } from "zod";

import { MistralError } from "@mistralai/mistralai/models/errors";

import { mistral, AI_MODEL, isAiEnabled } from "@/lib/mistral";
import { checkRateLimit, rateLimiters, rateLimitErrorMessage } from "@/lib/rate-limit";
import { requireSession } from "@/lib/auth-utils";
import { parseOrError } from "@/lib/validation";

const CONTENT_TRUNCATE_LENGTH = 2000;
const MAX_SUGGESTED_TAGS = 5;

const MISTRAL_RATE_LIMIT_ERROR = "Too many AI requests right now. Wait a few seconds and try again.";

/**
 * Builds a strict JSON Schema response format for `chat.complete`. Plain
 * `{type: "json_object"}` mode only guarantees *some* JSON comes back — smaller
 * models like ministral-14b sometimes nest an expected string field into a
 * richer object despite prompt instructions saying otherwise. `json_schema` +
 * `strict: true` has the API itself enforce the exact shape.
 */
function jsonSchemaResponseFormat(
  name: string,
  schema: Record<string, unknown>
): { type: "json_schema"; jsonSchema: { name: string; schemaDefinition: Record<string, unknown>; strict: true } } {
  return {
    type: "json_schema",
    jsonSchema: { name, schemaDefinition: schema, strict: true },
  };
}

/** Pro-gates an AI action; returns an error message, or null if allowed to proceed. */
function requireProAi(isPro: boolean): string | null {
  if (!isPro) return "AI features require a Pro plan";
  if (!isAiEnabled()) return "AI features are not configured";
  return null;
}

/** Checks a per-user AI rate limit; returns an error message, or null if allowed to proceed. */
async function checkAiRateLimit(
  limiter: Parameters<typeof checkRateLimit>[0],
  userId: string
): Promise<string | null> {
  const rl = await checkRateLimit(limiter, userId);
  return rl.success ? null : rateLimitErrorMessage(rl.reset);
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Mistral's assistant message content is `string | ContentChunk[] | null`; JSON mode always returns a plain string. */
function messageTextContent(
  content: string | Array<{ type: string; text?: string }> | null | undefined
): string {
  if (typeof content === "string") return content;
  return "";
}

/** Logs the raw Mistral response when it couldn't be parsed into the shape an action expected — a 200 response isn't caught by runAiAction's try/catch, so without this the failure is otherwise silent. */
function logParseFailure(actionName: string, rawText: string): void {
  console.warn(`${actionName}: couldn't parse Mistral response as expected JSON`, rawText);
}

type AiActionResult<TResult> =
  | { success: true; data: TResult }
  | { success: false; error: string };

/**
 * Shared scaffold for every AI action: session check, Pro gate, Zod validation,
 * rate limit, then a try/catch around the actual Mistral call + response parsing
 * (which stays in each call site's `run`, since prompts/parsing genuinely differ).
 */
async function runAiAction<TData, TResult>({
  actionName,
  input,
  schema,
  limiter,
  genericError,
  run,
}: {
  actionName: string;
  input: unknown;
  schema: z.ZodType<TData>;
  limiter: Parameters<typeof checkRateLimit>[0];
  genericError: string;
  run: (data: TData, userId: string) => Promise<TResult | null>;
}): Promise<AiActionResult<TResult>> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const proError = requireProAi(auth.isPro);
  if (proError) {
    return { success: false, error: proError };
  }

  const parsed = parseOrError(schema, input);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  const rateLimitError = await checkAiRateLimit(limiter, auth.userId);
  if (rateLimitError) {
    return { success: false, error: rateLimitError };
  }

  try {
    const result = await run(parsed.data, auth.userId);
    if (result === null) {
      return { success: false, error: genericError };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error(`${actionName} failed`, error);
    if (error instanceof MistralError && error.statusCode === 429) {
      return { success: false, error: MISTRAL_RATE_LIMIT_ERROR };
    }
    return { success: false, error: genericError };
  }
}

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
  const raw = safeJsonParse(outputText);

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
  const result = await runAiAction({
    actionName: "generateAutoTags",
    input,
    schema: generateAutoTagsSchema,
    limiter: rateLimiters.aiSuggestTags,
    genericError: GENERIC_AI_ERROR,
    run: async (data) => {
      const truncatedContent = data.content.trim().slice(0, CONTENT_TRUNCATE_LENGTH);

      const response = await mistral.chat.complete({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a tagging assistant for a developer knowledge base. Given an item's title and content, suggest 3-5 short, lowercase, freeform tags that describe it. Respond with strict JSON only, in the shape {\"tags\": [\"tag1\", \"tag2\"]}, and nothing else.",
          },
          {
            role: "user",
            content: `Suggest tags for this item and respond in JSON.\n\nTitle: ${data.title}\n\nContent:\n${truncatedContent || "(no content)"}`,
          },
        ],
        responseFormat: jsonSchemaResponseFormat("tag_suggestions", {
          type: "object",
          properties: { tags: { type: "array", items: { type: "string" } } },
          required: ["tags"],
          additionalProperties: false,
        }),
      });

      const rawText = messageTextContent(response.choices?.[0]?.message?.content);
      const tags = parseTagsFromResponse(rawText);
      if (!tags || tags.length === 0) {
        logParseFailure("generateAutoTags", rawText);
        return null;
      }
      return tags;
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, tags: result.data };
}

function parseDescriptionFromResponse(outputText: string): string | null {
  const raw = safeJsonParse(outputText);

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
  const raw = safeJsonParse(outputText);

  const explanation = (raw as { explanation?: unknown })?.explanation;
  if (typeof explanation !== "string") return null;

  const trimmed = explanation.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function explainCode(input: ExplainCodeInput): Promise<ExplainCodeState> {
  const result = await runAiAction({
    actionName: "explainCode",
    input,
    schema: explainCodeSchema,
    limiter: rateLimiters.aiExplainCode,
    genericError: GENERIC_EXPLAIN_ERROR,
    run: async (data) => {
      const { content, language, itemType } = data;
      const truncatedContent = content.trim().slice(0, CONTENT_TRUNCATE_LENGTH);

      const detailLines = [
        `Item type: ${itemType}`,
        language ? `Language: ${language}` : null,
        `Content:\n${truncatedContent}`,
      ].filter(Boolean);

      const response = await mistral.chat.complete({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              'You are a code-explanation assistant for a developer knowledge base. Given a code snippet or terminal command, explain what it does and the key concepts involved in about 200-300 words. Format the explanation as markdown (short paragraphs, inline code, and lists where useful). Respond with strict JSON only, in the shape {"explanation": "..."}, and nothing else.',
          },
          {
            role: "user",
            content: `Explain this code and respond in JSON.\n\n${detailLines.join("\n")}`,
          },
        ],
        responseFormat: jsonSchemaResponseFormat("code_explanation", {
          type: "object",
          properties: { explanation: { type: "string" } },
          required: ["explanation"],
          additionalProperties: false,
        }),
      });

      const rawText = messageTextContent(response.choices?.[0]?.message?.content);
      const explanation = parseExplanationFromResponse(rawText);
      if (!explanation) {
        logParseFailure("explainCode", rawText);
      }
      return explanation;
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, explanation: result.data };
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
  const raw = safeJsonParse(outputText);

  const optimizedPrompt = (raw as { optimizedPrompt?: unknown })?.optimizedPrompt;
  if (typeof optimizedPrompt !== "string") return null;

  const trimmed = optimizedPrompt.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function optimizePrompt(input: OptimizePromptInput): Promise<OptimizePromptState> {
  const result = await runAiAction({
    actionName: "optimizePrompt",
    input,
    schema: optimizePromptSchema,
    limiter: rateLimiters.aiOptimizePrompt,
    genericError: GENERIC_OPTIMIZE_ERROR,
    run: async (data) => {
      const truncatedContent = data.content.trim().slice(0, CONTENT_TRUNCATE_LENGTH);

      const response = await mistral.chat.complete({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              'You are a prompt engineering assistant for a developer knowledge base. Given a prompt intended for use with an AI assistant, refine it for clarity, specificity, and effectiveness while fully preserving its original intent and goal. If the prompt is already clear and effective, return it unchanged. Respond with strict JSON only, in the shape {"optimizedPrompt": "..."}, and nothing else.',
          },
          {
            role: "user",
            content: `Optimize this prompt and respond in JSON.\n\nPrompt:\n${truncatedContent}`,
          },
        ],
        responseFormat: jsonSchemaResponseFormat("optimized_prompt", {
          type: "object",
          properties: { optimizedPrompt: { type: "string" } },
          required: ["optimizedPrompt"],
          additionalProperties: false,
        }),
      });

      const rawText = messageTextContent(response.choices?.[0]?.message?.content);
      const optimizedPrompt = parseOptimizedPromptFromResponse(rawText);
      if (!optimizedPrompt) {
        logParseFailure("optimizePrompt", rawText);
      }
      return optimizedPrompt;
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, optimizedContent: result.data };
}

export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionState> {
  const result = await runAiAction({
    actionName: "generateDescription",
    input,
    schema: generateDescriptionSchema,
    limiter: rateLimiters.aiSuggestDescription,
    genericError: GENERIC_DESCRIPTION_ERROR,
    run: async (data) => {
      const { title, content, url, language, itemType } = data;
      const truncatedContent = content?.trim().slice(0, CONTENT_TRUNCATE_LENGTH) || "";

      const detailLines = [
        `Item type: ${itemType}`,
        `Title: ${title}`,
        url ? `URL: ${url}` : null,
        language ? `Language: ${language}` : null,
        `Content:\n${truncatedContent || "(no content)"}`,
      ].filter(Boolean);

      const response = await mistral.chat.complete({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a summarizing assistant for a developer knowledge base. Given an item's type, title, and available content, write a concise 1-2 sentence description summarizing what it is or does. Use only the information provided. Respond with strict JSON only, in the shape {\"description\": \"...\"}, and nothing else.",
          },
          {
            role: "user",
            content: `Summarize this item and respond in JSON.\n\n${detailLines.join("\n")}`,
          },
        ],
        responseFormat: jsonSchemaResponseFormat("item_description", {
          type: "object",
          properties: { description: { type: "string" } },
          required: ["description"],
          additionalProperties: false,
        }),
      });

      const rawText = messageTextContent(response.choices?.[0]?.message?.content);
      const description = parseDescriptionFromResponse(rawText);
      if (!description) {
        logParseFailure("generateDescription", rawText);
      }
      return description;
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, description: result.data };
}