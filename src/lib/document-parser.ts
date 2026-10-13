import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from '@e965/xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Vite worker import - pdfjs-dist 4.0+ uses .mjs
// Using ?url tells Vite to provide the path to the asset
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source only in browser
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export type SupportedFormat = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx';

/**
 * Extracts plain text from various document formats browser-side.
 * Reduces AI credits by processing files locally before sending to LLM.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() as SupportedFormat;
  const arrayBuffer = await file.arrayBuffer();

  switch (extension) {
    case 'pdf':
      return extractTextFromPDF(arrayBuffer);
    case 'docx':
      return extractTextFromDocx(arrayBuffer);
    case 'doc':
      return extractTextFromLegacyDoc(arrayBuffer);
    case 'xlsx':
    case 'xls':
      return extractTextFromExcel(arrayBuffer);
    case 'pptx':
      return extractTextFromPptx(arrayBuffer);
    default:
      // Fallback to basic text decoding for unknown formats
      return extractTextFromPlain(arrayBuffer);
  }
}

async function extractTextFromPDF(data: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return fullText.trim();
}

async function extractTextFromDocx(data: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: data });
  return result.value.trim();
}

/**
 * Legacy .doc (Word 97-2003) extraction.
 * Uses @file-viewer/doc to parse the binary CFB format.
 */
async function extractTextFromLegacyDoc(data: ArrayBuffer): Promise<string> {
  try {
    const { parseMsDoc } = await import('@file-viewer/doc');
    const doc = await parseMsDoc(new Uint8Array(data));
    
    // The AST structure typically has sections/paragraphs with text
    // We iterate through the AST to collect all text values.
    let text = '';
    const traverse = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === 'text') {
          text += (node.value || '') + ' ';
        } else if (node.children) {
          traverse(node.children);
        }
        // Add newline for paragraphs
        if (node.type === 'paragraph') text += '\n';
      }
    };

    if (doc.sections) {
      doc.sections.forEach((s: any) => traverse(s.children || []));
    }
    
    return text.trim();
  } catch (error) {
    console.warn('Legacy .doc extraction failed', error);
    return extractTextFromPlain(data);
  }
}

async function extractTextFromExcel(data: ArrayBuffer): Promise<string> {
  // @e965/xlsx supports both .xls and .xlsx
  const workbook = XLSX.read(data, { type: 'array' });
  let fullText = '';

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    fullText += `Sheet: ${sheetName}\n`;
    fullText += XLSX.utils.sheet_to_txt(worksheet) + '\n\n';
  });

  return fullText.trim();
}

async function extractTextFromPptx(data: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(data);
  let fullText = '';
  
  const slideFiles = Object.keys(zip.files).filter(name => 
    name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
  );

  slideFiles.sort((a, b) => {
    const aNum = parseInt(a.match(/\d+/)?[0] || '0');
    const bNum = parseInt(b.match(/\d+/)?[0] || '0');
    return aNum - bNum;
  });

  for (const slideFile of slideFiles) {
    const content = await zip.files[slideFile].async('text');
    // Extract text from <a:t> tags
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    const textElements = xmlDoc.getElementsByTagName("a:t");
    
    let slideText = '';
    for (let i = 0; i < textElements.length; i++) {
      slideText += textElements[i].textContent + ' ';
    }
    
    if (slideText.trim()) {
      fullText += `Slide ${slideFile.match(/\d+/)?.[0]}: ${slideText.trim()}\n\n`;
    }
  }

  return fullText.trim();
}

async function extractTextFromPlain(data: ArrayBuffer): Promise<string> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const text = decoder.decode(data);
  // Remove most non-printable characters but keep basic whitespace
  return text.replace(/[^\x20-\x7E\n\r\t\u00A0-\u00FF]/g, ' ').replace(/\s+/g, ' ').trim();
}
