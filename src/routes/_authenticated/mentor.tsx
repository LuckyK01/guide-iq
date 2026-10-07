import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { ArrowUp, BookOpen, FileText, ShieldAlert, ThumbsDown, ThumbsUp } from "lucide-react";
import { askMentor, type MentorAnswer } from "@/lib/ai.functions";
import { logAudit } from "@/lib/session";
import { Pill } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/mentor")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "AI Mentor — MentorMatch" }, { name: "description", content: "Ask onboarding questions answered from approved knowledge." }] }),
  component: Mentor,
});

type Msg = { role: "user" | "assistant"; content: string; meta?: MentorAnswer; rated?: "up" | "down" };
const KEY = "mentor-conversation";
const SUGGEST = ["How many days of annual leave do I get?", "How do I set up VPN on day one?", "What are our company values?"];

function Mentor() {
  const { q } = Route.useSearch();
  const ask = useServerFn(askMentor);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState(q ?? "");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { try { setMsgs(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* empty */ } ta.current?.focus(); }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(msgs)); end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const history = msgs.slice(-8).map(({ role, content }) => ({ role, content: content.slice(0, 3000) }));
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const r = await ask({ data: { question, history } });
      setMsgs((m) => [...m, { role: "assistant", content: r.answer, meta: r }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally { setBusy(false); ta.current?.focus(); }
  }

  async function rate(i: number, v: "up" | "down") {
    setMsgs((m) => m.map((x, j) => (j === i ? { ...x, rated: v } : x)));
    await logAudit("ai_feedback", "ai_mentor", null, msgs[i - 1]?.content.slice(0, 80) ?? "", { rating: v });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">AI Onboarding Mentor</h1>
          <p className="text-xs text-muted-foreground">Answers only from approved, published knowledge. Unanswered questions go to your Manager/HR.</p>
        </div>
        {msgs.length > 0 && <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setMsgs([])}>New conversation</button>}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto py-6">
        {msgs.length === 0 && (
          <div className="pt-10 text-center">
            <p className="text-sm text-muted-foreground">Try asking</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border bg-card px-3 py-1.5 text-sm hover:border-primary">{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="flex justify-end"><div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div></div>
        ) : (
          <div key={i} className="space-y-2">
            <div className="prose prose-sm max-w-none text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-2"><ReactMarkdown>{m.content}</ReactMarkdown></div>
            {m.meta && (
              <div className="flex flex-wrap items-center gap-2">
                {m.meta.blocked && <Pill tone="danger"><ShieldAlert className="mr-1 size-3" />{m.meta.blocked}</Pill>}
                {m.meta.escalated && <Pill tone="warning">Escalated to Manager/HR</Pill>}
                {m.meta.sources.map((s) => <Pill key={s.id} tone="primary"><FileText className="mr-1 size-3" />{s.title} · v{s.version}</Pill>)}
                {m.meta.modules.map((s) => (
                  <Link key={s.id} to="/modules/$id" params={{ id: s.id }}><Pill tone="success"><BookOpen className="mr-1 size-3" />{s.title}</Pill></Link>
                ))}
                {!m.meta.blocked && !m.meta.escalated && <span className="text-xs text-muted-foreground">Confidence {Math.round(m.meta.confidence * 100)}%</span>}
                <span className="ml-auto flex gap-1">
                  <button aria-label="Helpful" onClick={() => rate(i, "up")} className={`rounded p-1 ${m.rated === "up" ? "text-primary" : "text-muted-foreground"} hover:bg-muted`}><ThumbsUp className="size-3.5" /></button>
                  <button aria-label="Not helpful" onClick={() => rate(i, "down")} className={`rounded p-1 ${m.rated === "down" ? "text-destructive" : "text-muted-foreground"} hover:bg-muted`}><ThumbsDown className="size-3.5" /></button>
                </span>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="flex gap-1 py-2">{[0, 1, 2].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 120}ms` }} />)}</div>}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 rounded-2xl border bg-card p-2 focus-within:border-primary">
        <textarea
          ref={ta}
          rows={1}
          value={input}
          maxLength={1000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask about policies, tools, processes…"
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button disabled={busy || !input.trim()} aria-label="Send" className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"><ArrowUp className="size-4" /></button>
      </form>
    </div>
  );
}
