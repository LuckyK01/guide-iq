import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { useMyModules } from "@/lib/learning";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Panel, Stat, StatusPill, Empty, Loading, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MentorMatch" }, { name: "description", content: "Your onboarding overview." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useMe();
  if (!me) return <Loading />;
  return (
    <div className="space-y-10">
      <LearnerView name={me.name} />
      {me.isStaff && <StaffView />}
    </div>
  );
}

function LearnerView({ name }: { name: string }) {
  const { data: mods, isLoading } = useMyModules();
  if (isLoading || !mods) return <Loading />;
  const done = mods.filter((m) => m.state === "completed" || m.state === "passed").length;
  const pct = mods.length ? Math.round((done / mods.length) * 100) : 0;
  const current = mods.find((m) => m.state === "in_progress" || m.state === "assessment_pending") ?? mods.find((m) => m.state === "not_started");
  const pending = mods.filter((m) => m.state === "assessment_pending" || m.state === "in_progress");
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
        <p className="text-sm opacity-80">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{name}</h1>
        <p className="mt-2 text-sm opacity-90">You've completed <b>{pct}%</b> of your onboarding journey.</p>
        <div className="mt-4 h-2 max-w-md overflow-hidden rounded-full bg-primary-foreground/25">
          <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${pct}%` }} />
        </div>
        {current && (
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/modules/$id" params={{ id: current.id }}>Continue: {current.title} <ArrowRight className="size-4" /></Link>
          </Button>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Modules completed" value={`${done}/${mods.length}`} />
        <Stat label="Pending assessments" value={pending.length} />
        <Stat label="Mandatory remaining" value={mods.filter((m) => m.track === "mandatory" && m.state !== "completed" && m.state !== "passed").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Up next" className="lg:col-span-2" action={<Link to="/journey" className="text-sm text-primary">View journey</Link>}>
          {mods.length === 0 ? <Empty>No modules have been assigned yet.</Empty> : (
            <ul className="divide-y">
              {mods.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to="/modules/$id" params={{ id: m.id }} className="font-medium hover:text-primary">{m.title}</Link>
                    <div className="text-xs text-muted-foreground">{m.duration_min} min</div>
                  </div>
                  <StatusPill status={m.state} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Need help?">
          <p className="text-sm text-muted-foreground">Ask the AI Mentor anything about policies, tools or processes. Answers come only from approved knowledge, with sources.</p>
          <Button asChild className="mt-4 w-full"><Link to="/mentor"><Bot className="size-4" /> Ask AI Mentor</Link></Button>
        </Panel>
      </div>
    </div>
  );
}

function StaffView() {
  const { data } = useQuery({
    queryKey: ["staff-overview"],
    queryFn: async () => {
      const [k, e, p, prog, mods] = await Promise.all([
        supabase.from("knowledge_items").select("id,title,status,review_due"),
        supabase.from("mentor_escalations").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id,full_name,joining_date,team"),
        supabase.from("module_progress").select("user_id,state"),
        supabase.from("modules").select("id").eq("published", true),
      ]);
      return { k: k.data ?? [], e: e.data ?? [], p: p.data ?? [], prog: prog.data ?? [], total: mods.data?.length ?? 0 };
    },
  });
  if (!data) return <Loading />;
  const awaiting = data.k.filter((x) => x.status === "pending_review" || x.status === "ai_processed");
  const due = data.k.filter((x) => x.review_due && new Date(x.review_due) < new Date(Date.now() + 30 * 864e5) && x.status === "published");
  const learners = data.p.map((p) => {
    const done = data.prog.filter((x) => x.user_id === p.id && (x.state === "completed" || x.state === "passed")).length;
    return { ...p, pct: data.total ? Math.round((done / data.total) * 100) : 0 };
  });
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Team & content overview</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="People onboarding" value={learners.length} />
        <Stat label="Avg. completion" value={`${learners.length ? Math.round(learners.reduce((a, b) => a + b.pct, 0) / learners.length) : 0}%`} />
        <Stat label="Awaiting review" value={awaiting.length} />
        <Stat label="Open AI escalations" value={data.e.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Learner progress" action={<Link to="/people" className="text-sm text-primary">All people</Link>}>
          {learners.length === 0 ? <Empty>No learners yet.</Empty> : (
            <ul className="space-y-3">
              {learners.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-3">
                  <span className="w-40 truncate text-sm">{l.full_name}</span>
                  <Progress value={l.pct} className="h-2 flex-1" />
                  <span className="w-10 text-right text-xs text-muted-foreground">{l.pct}%</span>
                  {l.pct < 25 && <Pill tone="warning">At risk</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Unanswered questions (knowledge gaps)">
          {data.e.length === 0 ? <Empty>No open escalations. The mentor is answering everything from approved knowledge.</Empty> : (
            <ul className="divide-y">
              {data.e.map((x) => (
                <li key={x.id} className="py-2.5 text-sm">
                  <div className="font-medium">"{x.question}"</div>
                  <div className="text-xs text-muted-foreground">{x.user_name} · {new Date(x.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Content awaiting review" action={<Link to="/review" className="text-sm text-primary">Review queue</Link>}>
          {awaiting.length === 0 ? <Empty>Nothing waiting.</Empty> : (
            <ul className="divide-y">{awaiting.map((k) => <li key={k.id} className="flex justify-between py-2.5 text-sm"><span>{k.title}</span><StatusPill status={k.status} /></li>)}</ul>
          )}
        </Panel>
        <Panel title="Review due in 30 days">
          {due.length === 0 ? <Empty>No published content is due for review.</Empty> : (
            <ul className="divide-y">{due.map((k) => <li key={k.id} className="flex justify-between py-2.5 text-sm"><span>{k.title}</span><span className="text-xs text-muted-foreground">{k.review_due}</span></li>)}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
