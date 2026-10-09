// Browser-side text extraction for Office Open XML files (docx, pptx, xlsx) and plain text.
const decode = (xml: string) =>
  xml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

function textRuns(xml: string, para: RegExp, run: RegExp) {
  return xml.split(para).map((p) => decode([...p.matchAll(run)].map((m) => m[1]).join(""))).map((s) => s.trim()).filter(Boolean).join("\n");
}

export type ExtractKind = "office" | "text" | "ocr" | "unsupported";

export function kindOf(file: File): ExtractKind {
  const n = file.name.toLowerCase();
  if (/\.(docx|pptx|xlsx)$/.test(n)) return "office";
  if (/\.(txt|md|csv)$/.test(n)) return "text";
  if (n.endsWith(".pdf") || /^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return "ocr";
  return "unsupported";
}

export async function extractLocal(file: File): Promise<string> {
  const n = file.name.toLowerCase();
  if (/\.(txt|md|csv)$/.test(n)) return (await file.text()).slice(0, 20000);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const files = Object.keys(zip.files);
  const read = (p: string) => zip.file(p)!.async("string");
  const num = (p: string) => Number(p.match(/(\d+)\.xml$/)?.[1] ?? 0);
  let out = "";
  if (n.endsWith(".docx")) {
    out = textRuns(await read("word/document.xml"), /<\/w:p>/, /<w:t[^>]*>([^<]*)<\/w:t>/g);
  } else if (n.endsWith(".pptx")) {
    const slides = files.filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort((a, b) => num(a) - num(b));
    const parts: string[] = [];
    for (const [i, s] of slides.entries()) parts.push(`## Slide ${i + 1}\n` + textRuns(await read(s), /<\/a:p>/, /<a:t>([^<]*)<\/a:t>/g));
    out = parts.join("\n\n");
  } else if (n.endsWith(".xlsx")) {
    const shared = files.includes("xl/sharedStrings.xml")
      ? (await read("xl/sharedStrings.xml")).split(/<\/si>/).map((si) => decode([...si.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]).join("")))
      : [];
    const sheets = files.filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort((a, b) => num(a) - num(b));
    const parts: string[] = [];
    for (const [i, s] of sheets.entries()) {
      const xml = await read(s);
      const rows = xml.split(/<\/row>/).map((r) =>
        [...r.matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => {
          const v = c[2]?.match(/<v>([^<]*)<\/v>/)?.[1] ?? c[2]?.match(/<t[^>]*>([^<]*)<\/t>/)?.[1] ?? "";
          return /t="s"/.test(c[1] ?? "") ? shared[Number(v)] ?? "" : decode(v);
        }).join(" | "),
      ).filter((r) => r.replace(/[\s|]/g, ""));
      parts.push(`## Sheet ${i + 1}\n` + rows.join("\n"));
    }
    out = parts.join("\n\n");
  }
  return out.slice(0, 20000);
}
