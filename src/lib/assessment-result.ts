export function assessmentResult(score: number, passMark: number, previous: { score?: number | null; attempts?: number; state?: string; completed_at?: string | null } | undefined, now: string) {
  const passed = score >= passMark;
  const completed = passed || previous?.state === "completed" || previous?.state === "passed";
  return {
    score: Math.max(score, previous?.score ?? 0),
    attempts: (previous?.attempts ?? 0) + 1,
    state: completed ? "completed" as const : "assessment_pending" as const,
    progress: completed ? 100 : 60,
    completed_at: completed ? previous?.completed_at ?? now : null,
  };
}