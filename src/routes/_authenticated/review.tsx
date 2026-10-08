import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, logAudit } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, StatusPill, Loading, Empty, Denied, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Content Review — MentorMatch" }, { name: "description", content: "Review, approve and publish knowledge." }] }),
  component: Review,
});

type Faq = { q: string; a: string };

function Review() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [comment, setComment] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    enabled: !!me?.canReview,
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_items").select("*").in("status", ["pending_review", "ai_processed", "approved", "review_due"]).order("updated_at");
      if (error) throw error;
      return data;
    },
  });
  const { data: versions } = useQuery({
    queryKey: ["versions", sel],
    enabled: !!sel,
    queryFn: async () => (await supabase.from("knowledge_versions").select("*").eq("item_id", sel!).order("created_at", { ascending: false })).data ?? [],
  });
  if (!me) return <Loading />;
  if (!me.canReview) return <Denied />;
  const item = data?.find((x) => x.id === sel);

  function pick(id: string) {
    const k = data!.find((x) => x.id === id)!;
    setSel(id); setBody(k.body); setComment("");
  }

  async function act(action: "approve" | "reject" | "changes" | "publish") {
    if (!item) return;
    const edited = body.trim() !== item.body.trim();
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { reviewer_name: me!.name, review_comment: comment || null, updated_at: now };
    if (action === "approve") Object.assign(patch, { status: "approved", approved_at: now, last_reviewed: now.slice(0, 10) });
    if (action === "publish") Object.assign(patch, { status: "published", approved_at: item.approved_at ?? now, last_reviewed: now.slice(0, 10) });
    if (action === "reject") Object.assign(patch, { status: "draft" });
    if (action === "changes") Object.assign(patch, { status: "draft" });
    if ((action === "reject" || action === "changes") && !comment.trim()) return toast.error("Add a comment explaining the decision.");
    if (edited) Object.assign(patch, { body, version: item.version + 1 });
    // Snapshot previous version before change — approved content is never silently overwritten.
    await supabase.from("knowledge_versions").insert({ item_id: item.id, version: item.version, title: item.title, body: item.body, status: item.status, changed_by: me!.name, note: `${action}${comment ? `: ${comment}` : ""}` });
    const { error } = await supabase.from("knowledge_items").update(patch).eq("id", item.id);
    if (error) return toast.error(error.message);
    await logAudit(action === "changes" ? "requested_changes" : action === "approve" ? "approved" : action === "publish" ? "published" : "rejected", "knowledge", item.id, item.title, {
      before: { status: item.status, version: item.version }, after: { status: patch.status, version: patch.version ?? item.version }, comment,
    });
    toast.success("Saved"); setSel(null);
    qc.invalidateQueries({ queryKey: ["review-queue"] });
  }

  async function applySuggestion(text: string) { setBody((b) => `${b}\n\n${text}`); }

  const faqs = (item?.ai_faqs as { faqs?: Faq[]; gaps?: string[] } | null) ?? null;

  return (
    <div>
      <PageHeader title="Content Review" subtitle="AI suggests, people approve. Nothing reaches learners until it is published here." />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {isLoading ? <Loading /> : !data?.length ? <Empty>The review queue is empty.</Empty> : (
            <ul className="space-y-2">
              {data.map((k) => (
                <li key={k.id}>
                  <button onClick={() => pick(k.id)} className={`w-full rounded-lg border bg-card p-3 text-left ${sel === k.id ? "border-primary" : "hover:border-primary/50"}`}>
                    <div className="flex items-start justify-between gap-2"><span className="font-medium">{k.title}</span><StatusPill status={k.status} /></div>
                    <div className="mt-1 text-xs text-muted-foreground">{k.content_type} · v{k.version} · {k.owner_name}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-4 lg:col-span-3">
          {!item ? <Empty>Select an item to review.</Empty> : (
            <>
              <Panel title={item.title} action={<StatusPill status={item.status} />}>
                <div className="mb-3 text-xs text-muted-foreground">Source: {item.source || "—"} · Version {item.version}</div>
                <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
                {body.trim() !== item.body.trim() && <p className="mt-2 text-xs text-warning">Edited — saving will create version {item.version + 1}.</p>}
                <Textarea rows={2} className="mt-3" placeholder="Reviewer comment (required for reject / request changes)" value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.status !== "approved" && <Button onClick={() => act("approve")}>Approve</Button>}
                  <Button variant={item.status === "approved" ? "default" : "outline"} onClick={() => act("publish")}>{item.status === "approved" ? "Publish" : "Approve & publish"}</Button>
                  <Button variant="outline" onClick={() => act("changes")}>Request changes</Button>
                  <Button variant="ghost" className="text-destructive" onClick={() => act("reject")}>Reject</Button>
                </div>
              </Panel>
              {item.ai_model ? (
                <Panel title="AI suggestions" action={<Pill tone="primary">{item.ai_model}</Pill>}>
                  <p className="text-xs text-muted-foreground">Generated {item.ai_processed_at && new Date(item.ai_processed_at).toLocaleString()} from this item's source. Suggestions are not applied unless you add them.</p>
                  {item.ai_summary && <><h3 className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Summary</h3><p className="mt-1 text-sm">{item.ai_summary}</p></>}
                  {item.ai_tags?.length ? <div className="mt-3 flex flex-wrap gap-1">{item.ai_tags.map((t) => <Pill key={t}>{t}</Pill>)}</div> : null}
                  {item.ai_objectives?.length ? <><h3 className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Learning objectives</h3><ul className="mt-1 list-disc pl-5 text-sm">{item.ai_objectives.map((o) => <li key={o}>{o}</li>)}</ul></> : null}
                  {faqs?.faqs?.length ? (
                    <><h3 className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Suggested FAQs</h3>
                      <ul className="mt-1 space-y-2 text-sm">{faqs.faqs.map((f) => (
                        <li key={f.q} className="rounded-md border p-2"><b>{f.q}</b><div className="text-muted-foreground">{f.a}</div>
                          <button className="mt-1 text-xs text-primary" onClick={() => applySuggestion(`Q: ${f.q}\nA: ${f.a}`)}>Add to content</button></li>
                      ))}</ul></>
                  ) : null}
                  {faqs?.gaps?.length ? <><h3 className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Possible knowledge gaps</h3><ul className="mt-1 list-disc pl-5 text-sm text-warning">{faqs.gaps.map((g) => <li key={g}>{g}</li>)}</ul></> : null}
                </Panel>
              ) : null}
              <Panel title="Change history">
                {!versions?.length ? <Empty>No previous versions.</Empty> : (
                  <ul className="divide-y text-sm">{versions.map((v) => <li key={v.id} className="py-2"><b>v{v.version}</b> · {v.status} · {v.changed_by} · {new Date(v.created_at).toLocaleString()}<div className="text-xs text-muted-foreground">{v.note}</div></li>)}</ul>
                )}
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
