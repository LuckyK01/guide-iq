import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from '@e965/xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Vite worker import - only used in browser
let pdfWorkerUrl = '';
if (typeof window !== 'undefined') {
  // Use a dynamic import or static URL depending on build setup
  // For Vite, ?url is the recommended way to get a reference to a worker file
  import('pdfjs-dist/build/pdf.worker.mjs?url').then(m => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = m.default;
  });
}

export type ExtractKind = "local" | "ocr" | "unsupported";

/**
 * Determines how a file should be processed.
 * Modern office docs, PDFs, and text files are processed locally.
 * Images still require OCR (server-side).
 */
export function kindOf(file: File): ExtractKind {
  const n = file.name.toLowerCase();
  if (/\.(docx|pptx|xlsx|xls|doc|pdf|txt|md|csv)$/.test(n)) return "local";
  if (/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return "ocr";
  return "unsupported";
}

/**
 * Browser-side text extraction for various document formats.
 * Reduces AI credits by extracting text before sending to LLM.
 */
export async function extractLocal(file: File): Promise<string> {
  const n = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  try {
    if (n.endsWith(".pdf")) {
      return await extractPDF(arrayBuffer);
    }
    if (n.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    if (n.endsWith(".doc")) {
      return await extractLegacyDoc(arrayBuffer);
    }
    if (n.endsWith(".xlsx") || n.endsWith(".xls")) {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      return workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        return `## Sheet: ${name}\n${XLSX.utils.sheet_to_txt(sheet)}`;
      }).join('\n\n');
    }
    if (n.endsWith(".pptx")) {
      return await extractPptx(arrayBuffer);
    }
    if (/\.(txt|md|csv)$/.test(n)) {
      return new TextDecoder().decode(arrayBuffer).slice(0, 50000);
    }
  } catch (err) {
    console.error(`Extraction failed for ${n}:`, err);
    // Fallback to basic text extraction if binary parsing fails
    return extractBasicText(arrayBuffer);
  }

  return "";
}

async function extractPDF(data: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
}

async function extractLegacyDoc(data: ArrayBuffer): Promise<string> {
  try {
    const { parseMsDoc } = await import('@file-viewer/doc');
    const doc = await parseMsDoc(new Uint8Array(data));
    let text = "";
    const traverse = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === 'text') text += (node.value || '') + ' ';
        else if (node.children) traverse(node.children);
        if (node.type === 'paragraph') text += '\n';
      }
    };
    doc.sections?.forEach((s: any) => traverse(s.children || []));
    return text.trim() || extractBasicText(data);
  } catch {
    return extractBasicText(data);
  }
}

async function extractPptx(data: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(data);
  const slides = Object.keys(zip.files)
    .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?[0] || '0');
      return aNum - bNum;
    });

  let text = "";
  for (const [i, s] of slides.entries()) {
    const xml = await zip.file(s)!.async("string");
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
    const slideText = matches?.map(m => m.replace(/<a:t>|<\/a:t>/g, '')).join(" ") ?? "";
    text += `## Slide ${i + 1}\n${slideText}\n\n`;
  }
  return text;
}

function extractBasicText(data: ArrayBuffer): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(data)
    .replace(/[^\x20-\x7E\n\r\t\u00A0-\u00FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000);
}
