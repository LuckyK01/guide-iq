import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processKnowledge } from "@/lib/ai.functions";
import { useMe, logAudit } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatusPill, Loading, Empty, Denied, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Hub — MentorMatch" }, { name: "description", content: "Central library of organisational knowledge." }] }),
  component: Knowledge,
});

const TYPES = ["Policy", "SOP", "FAQ", "Training material", "Internal website", "Document"];
const STATUSES = ["all", "draft", "ai_processed", "pending_review", "published", "review_due", "archived"];

function Knowledge() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const process = useServerFn(processKnowledge);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["knowledge"],
    enabled: !!me?.isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_items").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (!me) return <Loading />;
  if (!me.isStaff) return <Denied />;

  async function runAI(id: string) {
    setBusyId(id);
    try { await process({ data: { id } }); toast.success("AI suggestions ready for review"); qc.invalidateQueries({ queryKey: ["knowledge"] }); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusyId(null); }
  }
  async function submitForReview(id: string, title: string) {
    const { error } = await supabase.from("knowledge_items").update({ status: "pending_review" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAudit("submitted_for_review", "knowledge", id, title);
    qc.invalidateQueries({ queryKey: ["knowledge"] });
  }

  const rows = (data ?? []).filter((k) => (filter === "all" || k.status === filter) && k.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Knowledge Hub" subtitle="Source of truth for onboarding. Only published items are visible to new joiners and the AI Mentor." actions={<NewItem onDone={() => qc.invalidateQueries({ queryKey: ["knowledge"] })} owner={me.name} />} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border bg-card px-3 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s.replace("_", " ")}</option>)}
        </select>
      </div>
      {isLoading ? <Loading /> : rows.length === 0 ? <Empty>No knowledge items match.</Empty> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Owner</TableHead><TableHead>Version</TableHead><TableHead>Review due</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {rows.map((k) => (
                <TableRow key={k.id}>
                  <TableCell>
                    <div className="font-medium">{k.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1">{k.tags.slice(0, 3).map((t) => <Pill key={t}>{t}</Pill>)}{k.ai_model && <Pill tone="primary">AI suggestions</Pill>}</div>
                  </TableCell>
                  <TableCell>{k.content_type}</TableCell>
                  <TableCell className="text-sm">{k.owner_name}</TableCell>
                  <TableCell>v{k.version}</TableCell>
                  <TableCell className="text-sm">{k.review_due ?? "—"}</TableCell>
                  <TableCell><StatusPill status={k.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {(k.status === "draft" || k.status === "ai_processed") && (
                      <>
                        <Button size="sm" variant="ghost" disabled={busyId === k.id} onClick={() => runAI(k.id)}><Sparkles className="size-3.5" />{busyId === k.id ? "Processing…" : "AI process"}</Button>
                        <Button size="sm" variant="outline" onClick={() => submitForReview(k.id, k.title)}>Submit for review</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">File upload with OCR/transcription (PDF, Office, video, audio) is planned for the next phase. Today, paste text content and source references.</p>
    </div>
  );
}

function NewItem({ onDone, owner }: { onDone: () => void; owner: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", content_type: "Policy", category: "", tags: "", source: "", team: "All", body: "" });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 3 || f.body.trim().length < 20) { toast.error("Add a title and at least 20 characters of content."); return; }
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("knowledge_items").insert({
      title: f.title.trim().slice(0, 200), content_type: f.content_type, category: f.category.slice(0, 80), team: f.team.slice(0, 80),
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10), source: f.source.slice(0, 300), body: f.body.slice(0, 20000),
      owner_id: u.user!.id, owner_name: owner,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    await logAudit("uploaded", "knowledge", data.id, f.title);
    toast.success("Draft created"); setOpen(false); onDone();
    setF({ title: "", content_type: "Policy", category: "", tags: "", source: "", team: "All", body: "" });
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" /> Add knowledge</Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>New knowledge item</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Title</Label><Input value={f.title} onChange={set("title")} maxLength={200} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label><select value={f.content_type} onChange={set("content_type")} className="h-9 w-full rounded-md border bg-card px-2 text-sm">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><Label>Category</Label><Input value={f.category} onChange={set("category")} /></div>
            <div><Label>Team / Unit</Label><Input value={f.team} onChange={set("team")} /></div>
            <div><Label>Tags (comma separated)</Label><Input value={f.tags} onChange={set("tags")} /></div>
          </div>
          <div><Label>Source reference</Label><Input value={f.source} onChange={set("source")} placeholder="e.g. HR Handbook v3, section 2" /></div>
          <div><Label>Content</Label><Textarea rows={8} value={f.body} onChange={set("body")} /></div>
          <Button className="w-full">Save as draft</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
