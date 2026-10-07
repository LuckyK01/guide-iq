import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyModules } from "@/lib/learning";
import { PageHeader, Loading, Empty, StatusPill } from "@/components/app-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/assessments")({
  head: () => ({ meta: [{ title: "Assessments — MentorMatch" }, { name: "description", content: "Your assessments, scores and attempts." }] }),
  component: Assessments,
});

function Assessments() {
  const { data: mods, isLoading } = useMyModules();
  if (isLoading) return <Loading />;
  const list = (mods ?? []).filter((m) => m.questions.length);
  return (
    <div>
      <PageHeader title="Assessments" subtitle="Each assessment unlocks after you finish the module content." />
      {list.length === 0 ? <Empty>No assessments assigned.</Empty> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Questions</TableHead><TableHead>Attempts</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((m) => (
                <TableRow key={m.id}>
                  <TableCell><Link to="/modules/$id" params={{ id: m.id }} className="font-medium hover:text-primary">{m.title}</Link></TableCell>
                  <TableCell>{m.questions.length}</TableCell>
                  <TableCell>{m.p?.attempts ?? 0}</TableCell>
                  <TableCell>{m.p?.score != null ? `${m.p.score}% ${m.p.score >= m.pass_mark ? "· Pass" : "· Fail"}` : "—"}</TableCell>
                  <TableCell><StatusPill status={m.state} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
