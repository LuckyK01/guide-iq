import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MentorMatch — AI Onboarding Mentor" },
      { name: "description", content: "Approved knowledge, personalised onboarding journeys and an AI mentor for every new joiner." },
      { property: "og:title", content: "MentorMatch — AI Onboarding Mentor" },
      { property: "og:description", content: "Approved knowledge, personalised onboarding journeys and an AI mentor for every new joiner." },
    ],
  }),
  component: Index,
});

const STEPS = ["Knowledge", "AI processing", "Human approval", "Learning journey", "AI Mentor", "Assessment", "Analytics"];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">M</span> MentorMatch
        </div>
        <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <p className="text-sm font-medium text-primary">Enterprise onboarding platform</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Onboard every new joiner from approved knowledge — not guesswork.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          AI suggests, people approve. New joiners get a personalised journey and a mentor that answers only from published company knowledge, with sources.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/auth">Get started</Link></Button>
        </div>
        <ol className="mt-20 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4 lg:grid-cols-7">
          {STEPS.map((s, i) => (
            <li key={s} className="bg-card p-4">
              <div className="text-xs text-muted-foreground">0{i + 1}</div>
              <div className="mt-1 text-sm font-medium">{s}</div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
