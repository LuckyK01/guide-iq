import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, logAudit, ROLE_LABEL, type AppRole } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PageHeader, Loading, Empty, Denied, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/people")({
  head: () => ({ meta: [{ title: "People & Roles — MentorMatch" }, { name: "description", content: "New joiners, profiles and role access." }] }),
  component: People,
});

const ROLES: AppRole[] = ["new_joiner", "manager", "sme", "admin"];
type Profile = { id: string; full_name: string; email: string | null; employee_type: string; role_title: string | null; unit: string | null; tribe: string | null; team: string | null; joining_date: string | null; experience_level: string; manager_name: string | null; buddy_name: string | null };

function People() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Profile | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["people"],
    enabled: !!me?.isStaff,
    queryFn: async () => {
      const [p, r, prog, mods] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("module_progress").select("user_id,state"),
        supabase.from("modules").select("id").eq("published", true),
      ]);
      if (p.error) throw p.error;
      return { people: p.data as Profile[], roles: r.data ?? [], prog: prog.data ?? [], total: mods.data?.length ?? 0 };
    },
  });
  if (!me) return <Loading />;
  if (!me.isStaff) return <Denied />;

  async function toggleRole(uid: string, role: AppRole, has: boolean, name: string) {
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    await logAudit(has ? "role_revoked" : "role_granted", "user", uid, name, { role });
    qc.invalidateQueries({ queryKey: ["people"] });
  }

  async function saveProfile(p: Profile) {
    const { id, email: _e, ...rest } = p;
    const { error } = await supabase.from("profiles").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit("profile_updated", "user", id, p.full_name);
    toast.success("Profile saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["people"] });
  }

  return (
    <div>
      <PageHeader title="People & Roles" subtitle={me.isAdmin ? "Manage onboarding profiles and role-based access." : "Track your team's onboarding progress."} />
      {isLoading ? <Loading /> : !data?.people.length ? <Empty>No people yet.</Empty> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Team</TableHead><TableHead>Joined</TableHead><TableHead className="w-40">Progress</TableHead><TableHead>Roles</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {data.people.map((p) => {
                const roles = data.roles.filter((r) => r.user_id === p.id).map((r) => r.role as AppRole);
                const done = data.prog.filter((x) => x.user_id === p.id && (x.state === "completed" || x.state === "passed")).length;
                const pct = data.total ? Math.round((done / data.total) * 100) : 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell><div className="font-medium">{p.full_name}</div><div className="text-xs text-muted-foreground">{p.email}</div></TableCell>
                    <TableCell className="text-sm">{[p.unit, p.tribe, p.team].filter(Boolean).join(" › ") || "—"}</TableCell>
                    <TableCell className="text-sm">{p.joining_date}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={pct} className="h-1.5" /><span className="text-xs">{pct}%</span></div></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {me.isAdmin ? ROLES.map((r) => {
                          const has = roles.includes(r);
                          const self = p.id === me.id && r === "admin";
                          return <button key={r} disabled={self} onClick={() => toggleRole(p.id, r, has, p.full_name)} title={self ? "You can't remove your own admin role" : undefined}><Pill tone={has ? "primary" : "neutral"} className={has ? "" : "opacity-50"}>{ROLE_LABEL[r]}</Pill></button>;
                        }) : roles.map((r) => <Pill key={r}>{ROLE_LABEL[r]}</Pill>)}
                      </div>
                    </TableCell>
                    <TableCell>{(me.isAdmin || me.roles.includes("manager")) && <Button size="sm" variant="ghost" onClick={() => setEdit(p)}>Edit</Button>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Onboarding profile</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={(e) => { e.preventDefault(); saveProfile(edit); }} className="grid grid-cols-2 gap-3">
              {([["full_name", "Name"], ["role_title", "Role"], ["unit", "Unit"], ["tribe", "Tribe"], ["team", "Team"], ["manager_name", "Manager"], ["buddy_name", "Buddy"]] as const).map(([k, l]) => (
                <div key={k}><Label>{l}</Label><Input value={(edit[k] as string) ?? ""} maxLength={100} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>
              ))}
              <div><Label>Joining date</Label><Input type="date" value={edit.joining_date ?? ""} onChange={(e) => setEdit({ ...edit, joining_date: e.target.value })} /></div>
              <div><Label>Type</Label><select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={edit.employee_type} onChange={(e) => setEdit({ ...edit, employee_type: e.target.value })}>{["employee", "intern", "contractor"].map((x) => <option key={x}>{x}</option>)}</select></div>
              <div><Label>Experience</Label><select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={edit.experience_level} onChange={(e) => setEdit({ ...edit, experience_level: e.target.value })}>{["fresher", "experienced", "intern", "internal transfer"].map((x) => <option key={x}>{x}</option>)}</select></div>
              <Button className="col-span-2">Save profile</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
