import { checkSourceSize } from "./knowledge-learning";

export type ExtractKind = "local" | "ocr" | "unsupported";

/**
 * Determines how a file should be processed.
 * Modern office docs, PDFs, and text files are processed locally.
 * Images still require OCR (server-side).
 */
export function kindOf(file: File): ExtractKind {
  const n = file.name.toLowerCase();
  if (/\.(docx|pptx|xlsx|xls|xlsm|xlsb|ods|doc|pdf|txt|md|csv|tsv|json|html|htm|rtf)$/.test(n)) return "local";
  if (/^image\/(png|jpe?g|webp|gif)$/.test(file.type) || /\.(png|jpe?g|webp|gif)$/.test(n)) return "ocr";
  return "unsupported";
}

/**
 * Browser-side text extraction for various document formats.
 * Reduces AI credits by extracting text before sending to LLM.
 */
export async function extractLocal(file: File): Promise<string> {
  const n = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  let text = "";
    if (n.endsWith(".pdf")) {
      text = await extractPDF(arrayBuffer);
    }
    if (n.endsWith(".docx")) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    }
    if (n.endsWith(".doc")) {
      text = await extractLegacyDoc(arrayBuffer);
    }
    if (/\.(xlsx|xls|xlsm|xlsb|ods)$/.test(n)) {
      const XLSX = await import('@e965/xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      text = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        return sheet ? `## Sheet: ${name}\n${XLSX.utils.sheet_to_csv(sheet)}` : "";
      }).join('\n\n');
    }
    if (n.endsWith(".pptx")) {
      text = await extractPptx(arrayBuffer);
    }
    if (/\.(txt|md|csv|tsv|json)$/.test(n)) {
      text = new TextDecoder().decode(arrayBuffer);
    }
    if (/\.(html|htm)$/.test(n)) {
      const doc = new DOMParser().parseFromString(new TextDecoder().decode(arrayBuffer), "text/html");
      doc.querySelectorAll("script,style").forEach((el) => el.remove());
      text = doc.body.textContent ?? "";
    }
    if (n.endsWith(".rtf")) {
      const { rtfToText } = await import("./rtf-extract");
      text = rtfToText(new TextDecoder().decode(arrayBuffer));
    }
  return checkSourceSize(text);
}

async function extractPDF(data: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  let text = "";
  try { for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `## Page ${i}\n` + content.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("") + "\n";
    if (!content.items.some((item) => "str" in item && item.str.trim())) throw new Error("This PDF has scanned pages. Use AI text recognition to read all pages.");
    checkSourceSize(text);
  }
  return text; } finally { await loadingTask.destroy(); }
}

async function extractLegacyDoc(data: ArrayBuffer): Promise<string> {
  try {
    const { parseMsDoc } = await import('@file-viewer/doc');
    const doc = await parseMsDoc(new Uint8Array(data));
    const texts: string[] = [];
    const traverse = (value: unknown): void => {
      if (Array.isArray(value)) { value.forEach(traverse); return; }
      if (!value || typeof value !== "object") return;
      const node = value as Record<string, unknown>;
      if (typeof node['text'] === "string") { texts.push(node['text']); return; }
      Object.values(node).forEach(traverse);
    };
    traverse(doc.blocks);
    if (!texts.length) throw new Error("No readable text");
    return texts.join("\n");
  } catch {
    throw new Error("Could not read this legacy Word document. Save it as .docx or PDF and import again.");
  }
}

async function extractPptx(data: ArrayBuffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(data);
  const slides = Object.keys(zip.files)
    .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    });

  let text = "";
  for (const [i, s] of slides.entries()) {
    const entry = zip.file(s);
    if (!entry) throw new Error("Missing slide content");
    const xml = await entry.async("string");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const slideText = Array.from(doc.getElementsByTagName("a:t")).map((el) => el.textContent ?? "").join("\n");
    text += `## Slide ${i + 1}\n${slideText}\n\n`;
  }
  return text;
}

