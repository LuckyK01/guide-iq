import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { generateModule, saveModuleDraft } from "@/lib/module-builder.functions";
import { validateQuestions } from "@/lib/knowledge-learning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Loading, Denied, Empty, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/module-builder")({
  head: () => ({ meta: [
    { title: "Module Builder — MentorMatch" }, { name: "description", content: "Review source-based lessons, practical assignments and assessments before publication." },
    { property: "og:title", content: "Module Builder — MentorMatch" }, { property: "og:description", content: "Review source-based lessons, practical assignments and assessments before publication." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: ModuleBuilder,
});

function ModuleBuilder() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const generate = useServerFn(generateModule);
  const save = useServerFn(saveModuleDraft);
  const [ids, setIds] = useState<string[]>([]);
  const [track, setTrack] = useState<"mandatory" | "role" | "experience">("mandatory");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ id: string; title: string; description: string; content: string; objectives: string; questions: string } | null>(null);
  const [preview, setPreview] = useState(true);
  const { data: sources } = useQuery({ queryKey: ["builder-sources"], enabled: Boolean(me?.isStaff), queryFn: async () => {
    const { data, error } = await supabase.from("knowledge_items").select("id,title,status,version,content_type").neq("status", "archived").order("title");
    if (error) throw error; return data;
  } });
  const { data: drafts } = useQuery({ queryKey: ["module-drafts"], enabled: Boolean(me?.isStaff), queryFn: async () => {
    const { data, error } = await supabase.from("modules").select("*").eq("published", false).order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  if (!me) return <Loading />;
  if (!me.isStaff) return <Denied />;

  async function openDraft(id: string) {
    const { data, error } = await supabase.from("modules").select("*").eq("id", id).single();
    if (error || !data) { toast.error(error?.message ?? "Draft not found"); return; }
    if (data.published) { toast.info("This source combination already has a published module. No AI credits used."); return; }
    setDraft({ id: data.id, title: data.title, description: data.description, content: data.content.replace(/<!-- learning-source:[a-f0-9]+ -->/g, "").trim(), objectives: data.objectives.join("\n"), questions: JSON.stringify(data.questions, null, 2) });
  }
  async function create() {
    setBusy(true);
    try {
      const result = await generate({ data: { ids, track } });
      await qc.invalidateQueries({ queryKey: ["module-drafts"] });
      await openDraft(result.id);
      toast.success(result.reused ? "Existing learning reused — no new AI call" : "Module draft ready for review");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function commit(publish: boolean) {
    if (!draft) return;
    setBusy(true);
    try {
      const questions = validateQuestions(JSON.parse(draft.questions));
      await save({ data: { ...draft, objectives: draft.objectives.split("\n").map((s) => s.trim()).filter(Boolean), questions, publish } });
      toast.success(publish ? "Module published to learners" : "Draft saved");
      qc.invalidateQueries({ queryKey: ["module-drafts"] }); qc.invalidateQueries({ queryKey: ["my-modules"] });
      if (publish) setDraft(null);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  const set = (field: "title" | "description" | "content" | "objectives" | "questions", value: string) => setDraft((d) => d ? { ...d, [field]: value } : null);

  return <div className="space-y-6">
    <PageHeader title="Module Builder" subtitle="Lessons, practical assignments & assessments" />
    <div className="grid gap-8 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
      <section className="space-y-4">
        <h2 className="font-semibold">Knowledge sources <span className="text-muted-foreground">({ids.length}/20)</span></h2>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {!sources?.length ? <Empty>No knowledge sources available.</Empty> : sources.map((k) => <label key={k.id} className="flex cursor-pointer items-start gap-3 border-b py-3 text-sm">
            <Checkbox checked={ids.includes(k.id)} disabled={busy || (!ids.includes(k.id) && ids.length >= 20)} onCheckedChange={(checked) => setIds((prev) => checked ? [...prev, k.id] : prev.filter((id) => id !== k.id))} />
            <span className="min-w-0"><span className="block break-words font-medium">{k.title}</span><span className="text-xs text-muted-foreground">{k.content_type} · v{k.version} · {k.status.replaceAll("_", " ")}</span></span>
          </label>)}
        </div>
        <Label htmlFor="module-track">Learning track</Label>
        <select id="module-track" value={track} disabled={busy} onChange={(e) => setTrack(e.target.value as typeof track)} className="h-9 w-full rounded-md border bg-card px-3 text-sm"><option value="mandatory">Mandatory</option><option value="role">Role-based</option><option value="experience">Experience-based</option></select>
        <Button className="w-full" onClick={create} disabled={busy || !ids.length}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {busy ? "Working…" : "Generate draft module"}</Button>
        <h2 className="pt-4 font-semibold">Unpublished modules</h2>
        {!drafts?.length ? <Empty>No draft modules.</Empty> : drafts.map((m) => <Button key={m.id} variant="outline" className="h-auto w-full justify-start whitespace-normal py-3 text-left" disabled={busy} onClick={() => openDraft(m.id)}>{m.title}</Button>)}
      </section>
      <section className="min-w-0 space-y-4">
        {!draft ? <Empty>Select sources or open a draft module.</Empty> : <>
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Review module</h2><Pill>Unpublished draft</Pill></div>
          <div><Label htmlFor="draft-title">Title</Label><Input id="draft-title" value={draft.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div><Label htmlFor="draft-description">Description</Label><Textarea id="draft-description" value={draft.description} onChange={(e) => set("description", e.target.value)} rows={3} /></div>
          <div><Label htmlFor="draft-objectives">Learning objectives</Label><Textarea id="draft-objectives" value={draft.objectives} onChange={(e) => set("objectives", e.target.value)} rows={4} /></div>
          <div className="flex items-center justify-between"><Label htmlFor="draft-content">Lessons & practical assignment</Label><Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>{preview ? "Edit lessons" : "Preview lessons"}</Button></div>
          {preview ? <div className="module-markdown text-sm leading-relaxed"><ReactMarkdown>{draft.content}</ReactMarkdown></div> : <Textarea id="draft-content" rows={18} value={draft.content} onChange={(e) => set("content", e.target.value)} />}
          <details><summary className="cursor-pointer font-semibold">Review assessment questions (10–15 required)</summary><Textarea className="mt-3 font-mono text-xs" aria-label="Assessment questions JSON" rows={18} value={draft.questions} onChange={(e) => set("questions", e.target.value)} /></details>
          <div className="flex flex-wrap gap-3 border-t pt-4"><Button variant="outline" disabled={busy} onClick={() => commit(false)}><Save className="size-4" /> Save draft</Button><Button disabled={busy} onClick={() => commit(true)}><CheckCircle2 className="size-4" /> Approve & publish module</Button></div>
        </>}
      </section>
    </div>
  </div>;
}