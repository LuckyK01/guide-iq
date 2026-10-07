import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyModules, TRACK_LABEL } from "@/lib/learning";
import { PageHeader, StatusPill, Loading, Empty, Pill } from "@/components/app-ui";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/modules/")({
  head: () => ({ meta: [{ title: "Modules — MentorMatch" }, { name: "description", content: "Your learning modules." }] }),
  component: Modules,
});

function Modules() {
  const { data: mods, isLoading, error } = useMyModules();
  if (isLoading) return <Loading />;
  if (error) return <Empty>Couldn't load modules: {(error as Error).message}</Empty>;
  const groups = [
    ["In progress", mods!.filter((m) => m.state === "in_progress" || m.state === "assessment_pending")],
    ["Not started", mods!.filter((m) => m.state === "not_started")],
    ["Completed", mods!.filter((m) => m.state === "completed" || m.state === "passed")],
  ] as const;
  return (
    <div>
      <PageHeader title="Learning Modules" subtitle="Track your progress and continue your journey." />
      <div className="space-y-8">
        {groups.map(([label, list]) => (
          <section key={label}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{label} · {list.length}</h2>
            {list.length === 0 ? <Empty>Nothing here yet.</Empty> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <Link key={m.id} to="/modules/$id" params={{ id: m.id }} className="flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-primary">
                    <div className="flex items-center justify-between gap-2"><Pill>{TRACK_LABEL[m.track]}</Pill><StatusPill status={m.state} /></div>
                    <h3 className="mt-3 font-semibold">{m.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">{m.description}</p>
                    <Progress value={m.progress} className="mt-4 h-1.5" />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{m.duration_min} min</span><span>{m.p?.score != null ? `Score ${m.p.score}%` : `${m.progress}%`}</span></div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
