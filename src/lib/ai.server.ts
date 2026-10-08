import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const AI_MODEL = "openai/gpt-6-astra";

export async function runAI(instructions: string, prompt: string): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const provider = createOpenAI({
    apiKey,
  });
  let failure: unknown = null;
  const result = streamText({
    model: provider.responses(AI_MODEL),
    system: instructions,
    messages: [{ role: "user", content: prompt }],
    maxRetries: 0,
    onError: ({ error }) => { failure = error; },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  if (failure) {
    const e = failure as { statusCode?: number; message?: string };
    if (e.statusCode === 429) throw new Error("AI is busy right now. Please try again in a moment.");
    if (e.statusCode === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(e.message || "AI request failed");
  }
  return text;
}

export function extractJson<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}
