import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Loading, Empty, Denied, Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — MentorMatch" }, { name: "description", content: "Who did what, when, across the platform." }] }),
  component: Audit,
});

function Audit() {
  const { data: me } = useMe();
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const allowed = !!me && (me.isAdmin || me.roles.includes("manager"));
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  if (!me) return <Loading />;
  if (!allowed) return <Denied />;
  const actions = [...new Set((data ?? []).map((d) => d.action))];
  const types = [...new Set((data ?? []).map((d) => d.resource_type))];
  const rows = (data ?? []).filter((d) =>
    (action === "all" || d.action === action) && (type === "all" || d.resource_type === type) &&
    (!from || d.created_at >= from) &&
    `${d.actor_name} ${d.resource_label}`.toLowerCase().includes(q.toLowerCase()));
  const sel = "h-9 rounded-md border bg-card px-2 text-sm";
  return (
    <div>
      <PageHeader title="Audit Trail" subtitle="Every upload, AI generation, approval, publish, assessment attempt and permission change." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search user or resource…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className={sel} value={action} onChange={(e) => setAction(e.target.value)}><option value="all">All actions</option>{actions.map((a) => <option key={a}>{a}</option>)}</select>
        <select className={sel} value={type} onChange={(e) => setType(e.target.value)}><option value="all">All resources</option>{types.map((a) => <option key={a}>{a}</option>)}</select>
        <Input type="date" className="w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
      </div>
      {isLoading ? <Loading /> : rows.length === 0 ? <Empty>No audit events match.</Empty> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Resource</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{r.actor_name ?? "—"}</TableCell>
                  <TableCell><Pill tone={r.action.includes("reject") || r.action.includes("blocked") ? "danger" : r.action.includes("publish") || r.action.includes("approv") ? "success" : "neutral"}>{r.action}</Pill></TableCell>
                  <TableCell className="text-sm"><span className="text-muted-foreground">{r.resource_type}</span> · {r.resource_label}</TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">{r.details ? JSON.stringify(r.details) : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
