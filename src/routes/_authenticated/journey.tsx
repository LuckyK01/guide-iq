import { createFileRoute, Link } from "@tanstack/react-router";
import { useMe } from "@/lib/session";
import { useMyModules, TRACK_LABEL } from "@/lib/learning";
import { PageHeader, Panel, StatusPill, Loading, Empty, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/journey")({
  head: () => ({ meta: [{ title: "My Journey — MentorMatch" }, { name: "description", content: "Your personalised onboarding journey." }] }),
  component: Journey,
});

function Journey() {
  const { data: me } = useMe();
  const { data: mods, isLoading } = useMyModules();
  if (isLoading || !me) return <Loading />;
  const p = me.profile;
  const fields: [string, string | null | undefined][] = [
    ["Type", p?.employee_type], ["Role", p?.role_title], ["Unit", p?.unit], ["Tribe", p?.tribe], ["Team", p?.team],
    ["Joining date", p?.joining_date], ["Experience", p?.experience_level], ["Manager", p?.manager_name], ["Buddy", p?.buddy_name],
  ];
  return (
    <div>
      <PageHeader title="My Journey" subtitle="Mandatory modules apply to everyone. Role and experience modules are tailored to your profile." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Profile" className="h-fit">
          <dl className="space-y-2 text-sm">
            {fields.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium capitalize">{v || "—"}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">Your manager or HR maintains these details.</p>
        </Panel>
        <div className="space-y-6 lg:col-span-2">
          {(["mandatory", "role", "experience"] as const).map((t) => {
            const list = (mods ?? []).filter((m) => m.track === t);
            return (
              <Panel key={t} title={TRACK_LABEL[t] ?? t} action={t === "mandatory" ? <Pill tone="primary">Required</Pill> : undefined}>
                {list.length === 0 ? <Empty>No modules in this track.</Empty> : (
                  <ol className="space-y-2">
                    {list.map((m, i) => (
                      <li key={m.id}>
                        <Link to="/modules/$id" params={{ id: m.id }} className="flex items-center gap-4 rounded-lg border p-3 hover:border-primary">
                          <span className="grid size-7 place-items-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{m.title}</div>
                            <div className="text-xs text-muted-foreground">{m.duration_min} min · {m.progress}%</div>
                          </div>
                          <StatusPill status={m.state} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}
