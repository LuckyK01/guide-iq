import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generationInput, validateLearning, validateQuestions } from "./knowledge-learning";

async function hash(input: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))), (b) => b.toString(16).padStart(2, "0")).join("");
}
const marker = (fingerprint: string) => `<!-- learning-source:${fingerprint} -->`;

export const generateModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1).max(20), track: z.enum(["mandatory", "role", "experience"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");
    const ids = [...new Set(data.ids)];
    const { data: items, error } = await supabase.from("knowledge_items").select("*").in("id", ids).order("id");
    if (error) throw new Error(error.message);
    if (!items || items.length !== ids.length || items.some((k) => k.status === "archived")) throw new Error("Some sources are missing or archived.");
    const input = generationInput(items);
    const fingerprint = await hash(input);
    const { data: existing, error: cacheError } = await supabase.from("modules").select("id,content,questions").contains("knowledge_ids", ids).eq("track", data.track);
    if (cacheError) throw new Error(cacheError.message);
    const cached = existing?.find((m) => m.content.includes(marker(fingerprint)));
    if (cached) { validateQuestions(cached.questions); return { id: cached.id, reused: true }; }
    const suggestions = items.length === 1 ? items[0]?.ai_faqs as { fingerprint?: string; learning?: unknown } | null : null;
    let learning;
    if (suggestions?.fingerprint === fingerprint && suggestions.learning) learning = validateLearning(suggestions.learning);
    else {
      const { generateLearning } = await import("./ai.server");
      learning = await generateLearning(input);
    }
    const { data: module, error: saveError } = await supabase.from("modules").insert({
      title: learning.title, description: learning.description, objectives: learning.objectives,
      content: `${learning.content}\n\n${marker(fingerprint)}`, questions: learning.questions as never,
      duration_min: Math.max(5, Math.round(learning.duration_min)), knowledge_ids: ids, track: data.track, published: false,
    }).select("id").single();
    if (saveError || !module) throw new Error(saveError?.message ?? "Could not save the draft module.");
    await supabase.from("audit_logs").insert({ actor_id: userId, action: "module_generated", resource_type: "module", resource_id: module.id, resource_label: learning.title, details: { sources: items.map((k) => ({ id: k.id, version: k.version })), questions: learning.questions.length, reused_suggestions: Boolean(suggestions?.fingerprint === fingerprint) } as never });
    return { id: module.id, reused: Boolean(suggestions?.fingerprint === fingerprint) };
  });

export const saveModuleDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), title: z.string().trim().min(3).max(200), description: z.string().trim().min(20).max(2000), content: z.string().min(1200).max(100000), objectives: z.array(z.string().trim().min(3)).min(3).max(10), questions: z.unknown(), publish: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Forbidden");
    const questions = validateQuestions(data.questions);
    if (!/^## Practical assignment\s*$/m.test(data.content)) throw new Error("Keep the practical assignment section in the module.");
    const { data: module, error } = await supabase.from("modules").select("*").eq("id", data.id).single();
    if (error || !module || module.published) throw new Error("Only unpublished drafts can be edited here.");
    const fingerprint = module.content.match(/<!-- learning-source:([a-f0-9]+) -->/)?.[1];
    if (!fingerprint) throw new Error("This draft has no generated source record.");
    const { data: items } = await supabase.from("knowledge_items").select("id,title,body,version,status").in("id", module.knowledge_ids);
    if (!items || items.length !== module.knowledge_ids.length || await hash(generationInput(items)) !== fingerprint) throw new Error("Source content changed. Generate a new draft from the updated sources.");
    if (data.publish && items.some((k) => k.status !== "published")) throw new Error("Publish every source knowledge item before publishing this module.");
    const cleanContent = data.content.replace(/<!-- learning-source:[a-f0-9]+ -->/g, "").trim();
    const { error: updateError } = await supabase.from("modules").update({ title: data.title, description: data.description, content: `${cleanContent}\n\n${marker(fingerprint)}`, objectives: data.objectives, questions: questions as never, published: data.publish }).eq("id", data.id).eq("published", false);
    if (updateError) throw new Error(updateError.message);
    await supabase.from("audit_logs").insert({ actor_id: userId, action: data.publish ? "module_published" : "module_draft_saved", resource_type: "module", resource_id: module.id, resource_label: data.title, details: { questions: questions.length, knowledge_ids: module.knowledge_ids } as never });
    return { ok: true };
  });