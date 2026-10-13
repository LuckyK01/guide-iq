import { z } from "zod";

export const MAX_SOURCE_CHARACTERS = 300000;
export const MIN_MODULE_QUESTIONS = 10;
export const MAX_MODULE_QUESTIONS = 15;

export const questionSchema = z.object({
  q: z.string(), type: z.enum(["mcq", "multi", "tf"]), options: z.array(z.string()), answer: z.array(z.number()),
}).strict();
export const generatedLearningSchema = z.object({
  summary: z.string(), category: z.string(), tags: z.array(z.string()),
  faqs: z.array(z.object({ q: z.string(), a: z.string() }).strict()), gaps: z.array(z.string()),
  title: z.string(), description: z.string(), objectives: z.array(z.string()),
  content: z.string(), duration_min: z.number(), questions: z.array(questionSchema),
}).strict();
export type GeneratedLearning = z.infer<typeof generatedLearningSchema>;

export function validateQuestions(value: unknown) {
  const questions = z.array(questionSchema).min(MIN_MODULE_QUESTIONS).max(MAX_MODULE_QUESTIONS).parse(value);
  const seen = new Set<string>();
  for (const q of questions) {
    const key = q.q.trim().toLowerCase();
    if (!key || seen.has(key)) throw new Error("Questions must be distinct and non-empty.");
    seen.add(key);
    if (q.options.length < 2 || q.options.some((o) => !o.trim()) || new Set(q.options).size !== q.options.length) throw new Error("Each question needs distinct answer choices.");
    if (!q.answer.length || new Set(q.answer).size !== q.answer.length || q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length)) throw new Error("Each question needs valid correct-answer indexes.");
    if (q.type !== "multi" && q.answer.length !== 1) throw new Error("Single-answer questions must have exactly one correct answer.");
    if (q.type === "tf" && q.options.length !== 2) throw new Error("True/false questions must have two choices.");
  }
  return questions;
}

export function validateLearning(value: unknown): GeneratedLearning {
  const p = generatedLearningSchema.parse(value);
  validateQuestions(p.questions);
  if (p.content.trim().length < 1200 || !/^## Practical assignment\s*$/m.test(p.content)) throw new Error("The module needs detailed lessons and a practical assignment. Review the source or try generating again manually.");
  if (p.objectives.length < 3 || !p.title.trim() || !p.description.trim()) throw new Error("The module needs a title, description and at least three objectives.");
  return p;
}

export function checkSourceSize(text: string) {
  if (text.length > MAX_SOURCE_CHARACTERS) throw new Error("Source text exceeds 300,000 characters. Split it into smaller knowledge items; nothing has been truncated.");
  return text;
}

export function generationInput(items: { id: string; title: string; version: number; body: string }[]) {
  return checkSourceSize(items.slice().sort((a, b) => a.id.localeCompare(b.id)).map((k) => `[Source ${k.id}; ${k.title}; version ${k.version}]\n${k.body}`).join("\n\n"));
}