import { describe, expect, it } from "vitest";
import { assessmentResult } from "./assessment-result";

describe("assessment retries", () => {
  it("preserves a higher previous score", () => {
    expect(assessmentResult(0, 70, { score: 100, attempts: 1, state: "completed" }, "2026-10-13").score).toBe(100);
  });
  it("does not revoke completed learning on a failed retry", () => {
    const result = assessmentResult(0, 70, { score: 100, attempts: 1, state: "completed", completed_at: "2026-10-12" }, "2026-10-13");
    expect(result).toMatchObject({ state: "completed", progress: 100, attempts: 2, completed_at: "2026-10-12" });
  });
  it("keeps a first failed attempt pending", () => {
    expect(assessmentResult(60, 70, undefined, "2026-10-13")).toMatchObject({ score: 60, attempts: 1, state: "assessment_pending", progress: 60, completed_at: null });
  });
  it("completes at the module's exact pass mark", () => {
    expect(assessmentResult(70, 70, undefined, "2026-10-13")).toMatchObject({ state: "completed", progress: 100 });
  });
});