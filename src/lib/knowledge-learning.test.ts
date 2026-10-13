import { describe, expect, it } from "vitest";
import { checkSourceSize, generationInput, validateLearning, validateQuestions } from "./knowledge-learning";
import { kindOf, extractLocal } from "./office-extract";
import { rtfToText } from "./rtf-extract";

const questions = (count: number) => Array.from({ length: count }, (_, i) => ({ q: `Document scenario ${i + 1}?`, type: "mcq", options: ["Correct", "Incorrect"], answer: [0] }));
describe("document-based learning requirements", () => {
  it("requires at least 10 questions per module", () => {
    expect(() => validateQuestions(questions(9))).toThrow();
    expect(validateQuestions(questions(10))).toHaveLength(10);
  });
  it("allows at most 15 questions per module", () => {
    expect(validateQuestions(questions(15))).toHaveLength(15);
    expect(() => validateQuestions(questions(16))).toThrow();
  });
  it("rejects invalid answers and repeated questions", () => {
    const invalid = questions(12); invalid[0] = { q: "Invalid answer?", type: "mcq", options: ["One", "Two"], answer: [4] };
    expect(() => validateQuestions(invalid)).toThrow();
    invalid[0] = { q: "Document scenario 2?", type: "mcq", options: ["Correct", "Incorrect"], answer: [0] }; expect(() => validateQuestions(invalid)).toThrow();
  });
  it("requires detailed lessons and a practical assignment", () => {
    const learning = { title: "BRD review", description: "Source-backed learning", summary: "Summary", category: "Requirements", tags: [], faqs: [], gaps: [], objectives: ["Review", "Apply", "Check"], duration_min: 30, questions: questions(12), content: "Source-backed explanation. ".repeat(60) + "\n## Practical assignment\nReview requirements." };
    expect(validateLearning(learning).questions).toHaveLength(12);
    expect(() => validateLearning({ ...learning, content: "Brief note" })).toThrow();
    expect(() => validateLearning({ ...learning, content: "Long explanation. ".repeat(100) })).toThrow();
  });
  it("includes every selected source in deterministic input for reuse", () => {
    const items = [{ id: "b", title: "Excel requirements", version: 2, body: "All sheet rows" }, { id: "a", title: "BRD", version: 1, body: "All requirements" }];
    const input = generationInput(items);
    expect(input).toContain("All sheet rows"); expect(input).toContain("All requirements");
    expect(generationInput(items.slice().reverse())).toBe(input);
    expect(generationInput(items.map((item) => ({ ...item, body: "Updated" })))).not.toBe(input);
  });
  it("preserves text beyond the former 20,000-character cap and refuses overflow", async () => {
    const text = "Requirements\n".repeat(5000);
    const file = new File([text], "BRD.txt");
    Object.defineProperty(file, "arrayBuffer", { value: async () => new TextEncoder().encode(text).buffer });
    expect(await extractLocal(file)).toBe(text);
    expect(checkSourceSize("x".repeat(300000))).toHaveLength(300000);
    expect(() => checkSourceSize("x".repeat(300001))).toThrow();
  });
  it("supports PDFs, Word BRDs, Excel and images", () => {
    for (const name of ["policy.pdf", "BRD.doc", "BRD.docx", "data.xls", "data.xlsx", "deck.pptx", "data.ods"]) expect(kindOf(new File([], name))).toBe("local");
    expect(kindOf(new File([], "scan.png"))).toBe("ocr");
    expect(kindOf(new File([], "recording.mp4"))).toBe("unsupported");
  });
  it("reads plain RTF text without an AI call", () => {
    expect(rtfToText("{\\rtf1\\ansi First requirement\\par Second requirement}" )).toBe("First requirement\nSecond requirement");
  });
});