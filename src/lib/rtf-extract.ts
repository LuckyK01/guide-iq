// Conservative text-only RTF extraction; unsupported embedded objects remain excluded.
export function rtfToText(rtf: string) {
  return rtf.replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict|object)[\s\S]*?\}/g, "")
    .replace(/\\'([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u(-?\d+)\??/g, (_, n: string) => String.fromCharCode(Number(n) & 65535))
    .replace(/\\(?:par|line)\b ?/g, "\n").replace(/\\tab\b ?/g, "\t")
    .replace(/\\([{}\\])/g, "$1").replace(/\\[a-z]+-?\d* ?/gi, "").replace(/[{}]/g, "").trim();
}