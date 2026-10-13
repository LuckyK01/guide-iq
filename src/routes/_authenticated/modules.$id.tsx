import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Bot, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyModules, TRACK_LABEL, type Question } from "@/lib/learning";
import { logAudit } from "@/lib/session";
import { assessmentResult } from "@/lib/assessment-result";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, StatusPill, Loading, Empty, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/modules/$id")({
  head: () => ({ meta: [{ title: "Module — MentorMatch" }, { name: "description", content: "Module content and assessment." }, { property: "og:title", content: "Module — MentorMatch" }, { property: "og:description", content: "Module content and assessment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ModulePage,
});

function ModulePage() {
  const { id } = Route.useParams();
  const { data: mods, isLoading, error } = useMyModules();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  if (isLoading) return <Loading />;
  if (error) return <Empty>Unable to load your learning. Please reload and try again.</Empty>;
  const m = mods?.find((x) => x.id === id);
  if (!m) return <Empty>Module not found or not available to you.</Empty>;

  async function save(patch: Record<string, unknown>) {
    if (!m) return false;
    const { data: u, error: authError } = await supabase.auth.getUser();
    if (authError || !u.user) { toast.error("Please sign in again."); return false; }
    const { error } = await supabase.from("module_progress").upsert({ user_id: u.user.id, module_id: m.id, updated_at: new Date().toISOString(), ...patch }, { onConflict: "user_id,module_id" });
    if (error) { toast.error(error.message); return false; }
    await qc.invalidateQueries({ queryKey: ["my-modules"] });
    return true;
  }

  async function finishReading() {
    if (!m || busy) return;
    if (await save({ state: m.questions.length ? "assessment_pending" : "completed", progress: m.questions.length ? 60 : 100, started_at: m.p?.started_at ?? new Date().toISOString(), completed_at: m.questions.length ? null : new Date().toISOString() }))
      toast.success(m.questions.length ? "Content complete — take the assessment below." : "Module completed");
  }

  async function submit() {
    if (!m || busy || !m.questions.length) return;
    setBusy(true);
    try {
    const qs = m.questions;
    const correct = qs.filter((q, i) => {
      const a = [...(answers[i] ?? [])].sort().join(",");
      return a === [...q.answer].sort().join(",");
    }).length;
    const score = Math.round((correct / qs.length) * 100);
    const passed = score >= m.pass_mark;
    const patch = assessmentResult(score, m.pass_mark, m.p, new Date().toISOString());
    if (!await save(patch)) return;
    await logAudit("assessment_attempt", "module", m.id, m.title, { score, passed, attempts: patch.attempts });
    setResult({ score, passed });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save assessment. Please try again.");
    } finally { setBusy(false); }
  }

  const toggle = (qi: number, oi: number, q: Question) =>
    setAnswers((a) => {
      const cur = a[qi] ?? [];
      if (q.type === "multi") return { ...a, [qi]: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi] };
      return { ...a, [qi]: [oi] };
    });

  const showAssessment = m.questions.length > 0 && m.state !== "not_started" && m.state !== "in_progress";

  return (
    <div className="space-y-6">
      <div>
        <Link to="/modules" className="text-sm text-muted-foreground hover:text-foreground">← Modules</Link>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Pill>{TRACK_LABEL[m.track]}</Pill><StatusPill status={m.state} /></div>
        <h1 className="mt-2 text-2xl font-semibold">{m.title}</h1>
        <p className="mt-1 text-muted-foreground">{m.description}</p>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>{m.duration_min} min</span><span>Attempts: {m.p?.attempts ?? 0}</span>{m.p?.score != null && <span>Best score: {m.p.score}%</span>}<span>Pass mark: {m.pass_mark}%</span>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Learning objectives">
            <ul className="space-y-2 text-sm">{m.objectives.map((o) => <li key={o} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-primary" />{o}</li>)}</ul>
          </Panel>
          <Panel title="Content">
            <div className="module-markdown text-sm leading-relaxed"><ReactMarkdown>{m.content}</ReactMarkdown></div>
            {m.state === "not_started" || m.state === "in_progress" ? (
              <Button className="mt-5" onClick={finishReading}>Mark content as read</Button>
            ) : null}
          </Panel>
          {showAssessment && (
            <Panel title="Assessment">
              {result && (
                <div className={`mb-4 rounded-lg p-3 text-sm ${result.passed ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                  {result.passed ? `Passed with ${result.score}%. Module completed.` : `Scored ${result.score}%. You need ${m.pass_mark}% — review the content and retry.`}
                </div>
              )}
              <div className="space-y-5">
                {m.questions.map((q, qi) => (
                  <fieldset key={qi}>
                    <legend className="text-sm font-medium">{qi + 1}. {q.q} {q.type === "multi" && <span className="text-xs text-muted-foreground">(select all that apply)</span>}</legend>
                    <div className="mt-2 space-y-1.5">
                      {q.options.map((o, oi) => (
                        <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                          <Checkbox checked={(answers[qi] ?? []).includes(oi)} onCheckedChange={() => toggle(qi, oi, q)} /> {o}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <Button className="mt-5" onClick={submit} disabled={busy || m.questions.some((_, i) => !(answers[i]?.length))}>
                {busy ? "Saving…" : m.p?.attempts ? "Retry assessment" : "Submit assessment"}
              </Button>
            </Panel>
          )}
        </div>
        <Panel title="Stuck on something?" className="h-fit">
          <p className="text-sm text-muted-foreground">Ask the AI Mentor about this module. It answers from approved knowledge only.</p>
          <Button asChild variant="outline" className="mt-4 w-full"><Link to="/mentor" search={{ q: `Help me understand ${m.title}` }}><Bot className="size-4" /> Ask AI Mentor</Link></Button>
        </Panel>
      </div>
    </div>
  );
}
