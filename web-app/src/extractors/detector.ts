import * as fs from 'fs';
import * as path from 'path';
import { FileCategory, FileFormatDetection } from '../shared/types';

export interface SignatureRule {
  format: string;
  mime: string;
  category: FileCategory;
  extensions: string[];
  match: (buffer: Buffer, fileSizeBytes?: number) => boolean;
}

// Magic bytes helper functions
function matchBytes(buffer: Buffer, offset: number, bytes: number[]): boolean {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

function matchAscii(buffer: Buffer, offset: number, str: string): boolean {
  if (buffer.length < offset + str.length) return false;
  return buffer.toString('ascii', offset, offset + str.length) === str;
}

function matchFtyp(buffer: Buffer, brand: string): boolean {
  if (buffer.length < 12) return false;
  // ftyp box: 4 bytes length, 'ftyp', 4 bytes major_brand or compatible brands
  if (buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
  const majorBrand = buffer.toString('ascii', 8, 12);
  if (majorBrand.trim().toLowerCase() === brand.toLowerCase()) return true;

  // Check compatible brands in the first 64 bytes
  const limit = Math.min(buffer.length, 64);
  for (let i = 16; i + 4 <= limit; i += 4) {
    if (buffer.toString('ascii', i, i + 4).trim().toLowerCase() === brand.toLowerCase()) {
      return true;
    }
  }
  return false;
}

export const SIGNATURE_RULES: SignatureRule[] = [
  // --- IMAGES ---
  {
    format: 'JPEG',
    mime: 'image/jpeg',
    category: 'image',
    extensions: ['jpg', 'jpeg', 'jpe', 'jif', 'jfif'],
    match: (buf) => matchBytes(buf, 0, [0xFF, 0xD8, 0xFF]),
  },
  {
    format: 'PNG',
    mime: 'image/png',
    category: 'image',
    extensions: ['png'],
    match: (buf) => matchBytes(buf, 0, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  },
  {
    format: 'GIF',
    mime: 'image/gif',
    category: 'image',
    extensions: ['gif'],
    match: (buf) => matchAscii(buf, 0, 'GIF87a') || matchAscii(buf, 0, 'GIF89a'),
  },
  {
    format: 'WebP',
    mime: 'image/webp',
    category: 'image',
    extensions: ['webp'],
    match: (buf) => matchAscii(buf, 0, 'RIFF') && matchAscii(buf, 8, 'WEBP'),
  },
  {
    format: 'BMP',
    mime: 'image/bmp',
    category: 'image',
    extensions: ['bmp', 'dib'],
    match: (buf) => matchBytes(buf, 0, [0x42, 0x4D]),
  },
  {
    format: 'TIFF (Little-Endian)',
    mime: 'image/tiff',
    category: 'image',
    extensions: ['tif', 'tiff'],
    match: (buf) => matchBytes(buf, 0, [0x49, 0x49, 0x2A, 0x00]),
  },
  {
    format: 'TIFF (Big-Endian)',
    mime: 'image/tiff',
    category: 'image',
    extensions: ['tif', 'tiff'],
    match: (buf) => matchBytes(buf, 0, [0x4D, 0x4D, 0x00, 0x2A]),
  },
  {
    format: 'AVIF',
    mime: 'image/avif',
    category: 'image',
    extensions: ['avif'],
    match: (buf) => matchFtyp(buf, 'avif') || matchFtyp(buf, 'avis'),
  },
  {
    format: 'ICO',
    mime: 'image/x-icon',
    category: 'image',
    extensions: ['ico', 'cur'],
    match: (buf) => matchBytes(buf, 0, [0x00, 0x00, 0x01, 0x00]) || matchBytes(buf, 0, [0x00, 0x00, 0x02, 0x00]),
  },
  {
    format: 'SVG',
    mime: 'image/svg+xml',
    category: 'image',
    extensions: ['svg'],
    match: (buf) => {
      const text = buf.slice(0, Math.min(buf.length, 1024)).toString('utf8').trim().toLowerCase();
      return (text.startsWith('<?xml') && text.includes('<svg')) || text.startsWith('<svg');
    },
  },

  // --- AUDIO ---
  {
    format: 'MP3 (ID3v2)',
    mime: 'audio/mpeg',
    category: 'audio',
    extensions: ['mp3'],
    match: (buf) => matchAscii(buf, 0, 'ID3'),
  },
  {
    format: 'MP3 (MPEG Frame)',
    mime: 'audio/mpeg',
    category: 'audio',
    extensions: ['mp3'],
    match: (buf) => {
      if (buf.length < 2) return false;
      // Sync word 11 bits set: 0xFF followed by high 3 bits set (0xE0)
      return buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0 && (buf[1] & 0x06) !== 0x00;
    },
  },
  {
    format: 'WAV',
    mime: 'audio/wav',
    category: 'audio',
    extensions: ['wav', 'wave'],
    match: (buf) => matchAscii(buf, 0, 'RIFF') && matchAscii(buf, 8, 'WAVE'),
  },
  {
    format: 'FLAC',
    mime: 'audio/flac',
    category: 'audio',
    extensions: ['flac'],
    match: (buf) => matchAscii(buf, 0, 'fLaC'),
  },
  {
    format: 'OGG Container / Audio',
    mime: 'audio/ogg',
    category: 'audio',
    extensions: ['ogg', 'oga', 'opus'],
    match: (buf) => matchAscii(buf, 0, 'OggS'),
  },
  {
    format: 'AAC Audio',
    mime: 'audio/aac',
    category: 'audio',
    extensions: ['aac'],
    match: (buf) => matchBytes(buf, 0, [0xFF, 0xF1]) || matchBytes(buf, 0, [0xFF, 0xF9]),
  },
  {
    format: 'M4A Audio',
    mime: 'audio/mp4',
    category: 'audio',
    extensions: ['m4a', 'm4b', 'alac'],
    match: (buf) => matchFtyp(buf, 'M4A ') || matchFtyp(buf, 'm4a ') || matchFtyp(buf, 'mp42') && buf.toString('ascii', 8, 12) === 'M4A ',
  },

  // --- VIDEO ---
  {
    format: 'MP4 Video',
    mime: 'video/mp4',
    category: 'video',
    extensions: ['mp4', 'm4v'],
    match: (buf) => {
      if (bufferStartsWithIsoBmff(buf)) {
        // Exclude pure m4a brand
        const major = buf.slice(8, 12).toString('ascii');
        return major !== 'M4A ';
      }
      return false;
    },
  },
  {
    format: 'MKV / WebM Video (EBML)',
    mime: 'video/x-matroska',
    category: 'video',
    extensions: ['mkv', 'webm', 'mka'],
    match: (buf) => matchBytes(buf, 0, [0x1A, 0x45, 0xDF, 0xA3]),
  },
  {
    format: 'AVI Video',
    mime: 'video/x-msvideo',
    category: 'video',
    extensions: ['avi'],
    match: (buf) => matchAscii(buf, 0, 'RIFF') && matchAscii(buf, 8, 'AVI '),
  },
  {
    format: 'QuickTime MOV',
    mime: 'video/quicktime',
    category: 'video',
    extensions: ['mov', 'qt'],
    match: (buf) => matchFtyp(buf, 'qt  ') || matchAscii(buf, 4, 'moov') || matchAscii(buf, 4, 'mdat'),
  },

  // --- PDF & DOCUMENTS ---
  {
    format: 'PDF Document',
    mime: 'application/pdf',
    category: 'pdf',
    extensions: ['pdf'],
    match: (buf) => matchAscii(buf, 0, '%PDF-'),
  },
  {
    format: 'Rich Text Format (RTF)',
    mime: 'application/rtf',
    category: 'document',
    extensions: ['rtf'],
    match: (buf) => matchAscii(buf, 0, '{\\rtf'),
  },

  // --- ARCHIVES ---
  {
    format: 'ZIP Archive',
    mime: 'application/zip',
    category: 'archive',
    extensions: ['zip', 'jar', 'apk', 'docx', 'xlsx', 'pptx', 'epub'],
    match: (buf) => matchBytes(buf, 0, [0x50, 0x4B, 0x03, 0x04]) || matchBytes(buf, 0, [0x50, 0x4B, 0x05, 0x06]),
  },
  {
    format: '7-Zip Archive',
    mime: 'application/x-7z-compressed',
    category: 'archive',
    extensions: ['7z'],
    match: (buf) => matchBytes(buf, 0, [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]),
  },
  {
    format: 'GZIP Compressed Archive',
    mime: 'application/gzip',
    category: 'archive',
    extensions: ['gz', 'tgz'],
    match: (buf) => matchBytes(buf, 0, [0x1F, 0x8B]),
  },
  {
    format: 'RAR Archive',
    mime: 'application/x-rar-compressed',
    category: 'archive',
    extensions: ['rar'],
    match: (buf) => matchBytes(buf, 0, [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07]),
  },
  {
    format: 'TAR Archive',
    mime: 'application/x-tar',
    category: 'archive',
    extensions: ['tar'],
    match: (buf) => buf.length >= 265 && matchAscii(buf, 257, 'ustar'),
  },

  // --- EXECUTABLES & SYSTEM (Security awareness) ---
  {
    format: 'Windows Executable / DLL (PE)',
    mime: 'application/vnd.microsoft.portable-executable',
    category: 'executable',
    extensions: ['exe', 'dll', 'sys', 'scr', 'cpl'],
    match: (buf) => {
      if (!matchBytes(buf, 0, [0x4D, 0x5A])) return false; // MZ header
      // If we have enough bytes, check for PE offset at 0x3C
      if (buf.length >= 0x40) {
        const peOffset = buf.readUInt32LE(0x3C);
        if (peOffset > 0 && peOffset + 4 <= buf.length) {
          return matchBytes(buf, peOffset, [0x50, 0x45, 0x00, 0x00]); // 'PE\0\0'
        }
      }
      return true; // MZ header is a strong indicator of DOS/Windows executable
    },
  },
  {
    format: 'ELF Linux/Unix Executable',
    mime: 'application/x-executable',
    category: 'executable',
    extensions: ['elf', 'so', 'bin'],
    match: (buf) => matchBytes(buf, 0, [0x7F, 0x45, 0x4C, 0x46]),
  },
  {
    format: 'Mach-O Binary (macOS)',
    mime: 'application/x-mach-binary',
    category: 'executable',
    extensions: ['dylib', 'bundle', 'app'],
    match: (buf) => 
      matchBytes(buf, 0, [0xFE, 0xED, 0xFA, 0xCE]) ||
      matchBytes(buf, 0, [0xFE, 0xED, 0xFA, 0xCF]) ||
      matchBytes(buf, 0, [0xCE, 0xFA, 0xED, 0xFE]) ||
      matchBytes(buf, 0, [0xCF, 0xFA, 0xED, 0xFE]),
  },
  {
    format: 'WebAssembly Binary',
    mime: 'application/wasm',
    category: 'code',
    extensions: ['wasm'],
    match: (buf) => matchBytes(buf, 0, [0x00, 0x61, 0x73, 0x6D]),
  },
];

function bufferStartsWithIsoBmff(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString('ascii', 4, 8) !== 'ftyp') return false;
  const major = buf.toString('ascii', 8, 12).trim().toLowerCase();
  const knownIsoBrands = [
    'isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'dash', 'msnv', 
    'avc1', 'm4v', '3gp4', '3gp5', '3gp6'
  ];
  return knownIsoBrands.includes(major);
}

// Fallback extension-based lookup
export const EXTENSION_FALLBACKS: Record<string, { format: string; mime: string; category: FileCategory }> = {
  // Text & Code
  txt: { format: 'Plain Text Document', mime: 'text/plain', category: 'document' },
  md: { format: 'Markdown Document', mime: 'text/markdown', category: 'document' },
  json: { format: 'JSON Data', mime: 'application/json', category: 'code' },
  xml: { format: 'XML Document', mime: 'application/xml', category: 'code' },
  html: { format: 'HTML Document', mime: 'text/html', category: 'code' },
  htm: { format: 'HTML Document', mime: 'text/html', category: 'code' },
  css: { format: 'CSS Stylesheet', mime: 'text/css', category: 'code' },
  js: { format: 'JavaScript Source', mime: 'application/javascript', category: 'code' },
  mjs: { format: 'JavaScript Module', mime: 'application/javascript', category: 'code' },
  ts: { format: 'TypeScript Source', mime: 'application/typescript', category: 'code' },
  tsx: { format: 'TypeScript JSX Source', mime: 'application/typescript', category: 'code' },
  jsx: { format: 'JavaScript JSX Source', mime: 'application/javascript', category: 'code' },
  csv: { format: 'Comma-Separated Values', mime: 'text/csv', category: 'document' },
  yaml: { format: 'YAML Document', mime: 'text/yaml', category: 'code' },
  yml: { format: 'YAML Document', mime: 'text/yaml', category: 'code' },
  sql: { format: 'SQL Script', mime: 'application/sql', category: 'code' },
  sh: { format: 'Shell Script', mime: 'application/x-sh', category: 'code' },
  bat: { format: 'Windows Batch Script', mime: 'text/plain', category: 'code' },
  ps1: { format: 'PowerShell Script', mime: 'text/plain', category: 'code' },
  py: { format: 'Python Source', mime: 'text/x-python', category: 'code' },
  rs: { format: 'Rust Source', mime: 'text/x-rust', category: 'code' },
  go: { format: 'Go Source', mime: 'text/x-go', category: 'code' },
  java: { format: 'Java Source', mime: 'text/x-java', category: 'code' },
  c: { format: 'C Source', mime: 'text/x-c', category: 'code' },
  cpp: { format: 'C++ Source', mime: 'text/x-c++', category: 'code' },
  h: { format: 'C Header', mime: 'text/x-c', category: 'code' },
  // Office formats
  docx: { format: 'Microsoft Word Document (Office Open XML)', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document' },
  xlsx: { format: 'Microsoft Excel Spreadsheet (Office Open XML)', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'document' },
  pptx: { format: 'Microsoft PowerPoint Presentation (Office Open XML)', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'document' },
  doc: { format: 'Microsoft Word Document (Legacy)', mime: 'application/msword', category: 'document' },
  xls: { format: 'Microsoft Excel Spreadsheet (Legacy)', mime: 'application/vnd.ms-excel', category: 'document' },
  ppt: { format: 'Microsoft PowerPoint Presentation (Legacy)', mime: 'application/vnd.ms-powerpoint', category: 'document' },
  epub: { format: 'EPUB Electronic Book', mime: 'application/epub+zip', category: 'document' },
  // Image fallbacks
  tiff: { format: 'TIFF Image', mime: 'image/tiff', category: 'image' },
  tif: { format: 'TIFF Image', mime: 'image/tiff', category: 'image' },
};

/**
 * Detect file format by magic bytes first, falling back to extension inspection.
 * Compares detected format against file extension to identify mismatches.
 */
export function detectFormatFromBuffer(
  buffer: Buffer,
  rawExtension: string,
  fileSizeBytes: number = 0
): FileFormatDetection {
  const cleanExt = rawExtension.replace(/^\./, '').trim().toLowerCase();

  // Extract first 16 bytes for hex/ascii inspection preview
  const inspectSlice = buffer.slice(0, Math.min(buffer.length, 16));
  const magicBytesHex = Array.from(inspectSlice)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  const magicBytesAscii = Array.from(inspectSlice)
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');

  // 1. Try matching by magic byte signatures
  for (const rule of SIGNATURE_RULES) {
    if (rule.match(buffer, fileSizeBytes)) {
      // Check if file extension matches the signature's known extensions
      const extMatches = rule.extensions.includes(cleanExt);
      let isMismatch = false;
      let mismatchWarning: string | undefined = undefined;

      // Special case: Office formats (docx, xlsx, pptx) and epub are actually ZIP containers
      const isOfficeZip = (cleanExt === 'docx' || cleanExt === 'xlsx' || cleanExt === 'pptx' || cleanExt === 'epub') && rule.format === 'ZIP Archive';

      if (!extMatches && cleanExt.length > 0 && !isOfficeZip) {
        isMismatch = true;
        mismatchWarning = `File extension (.${cleanExt}) does not match detected format (${rule.format}).`;
      }

      return {
        extension: cleanExt ? `.${cleanExt}` : '',
        detectedFormat: rule.format,
        detectedMime: rule.mime,
        category: rule.category,
        isExtensionMismatch: isMismatch,
        mismatchWarning,
        confidence: 'high',
        magicBytesHex,
        magicBytesAscii,
      };
    }
  }

  // 2. Check if it's text/code (UTF-8 or ASCII check on sample buffer)
  if (buffer.length > 0 && isLikelyTextBuffer(buffer)) {
    const fallback = cleanExt ? EXTENSION_FALLBACKS[cleanExt] : undefined;
    return {
      extension: cleanExt ? `.${cleanExt}` : '',
      detectedFormat: fallback ? fallback.format : 'Plain Text Document',
      detectedMime: fallback ? fallback.mime : 'text/plain',
      category: fallback ? fallback.category : 'document',
      isExtensionMismatch: false,
      confidence: 'medium',
      magicBytesHex,
      magicBytesAscii,
    };
  }

  // 3. Fallback to extension if known
  if (cleanExt && EXTENSION_FALLBACKS[cleanExt]) {
    const fallback = EXTENSION_FALLBACKS[cleanExt];
    return {
      extension: `.${cleanExt}`,
      detectedFormat: `${fallback.format} (Extension Guess)`,
      detectedMime: fallback.mime,
      category: fallback.category,
      isExtensionMismatch: false,
      confidence: 'low',
      magicBytesHex,
      magicBytesAscii,
    };
  }

  // 4. Unknown format
  return {
    extension: cleanExt ? `.${cleanExt}` : '',
    detectedFormat: cleanExt ? `Unknown (${cleanExt.toUpperCase()} File)` : 'Unknown Binary File',
    detectedMime: 'application/octet-stream',
    category: 'unknown',
    isExtensionMismatch: false,
    confidence: 'unknown',
    magicBytesHex,
    magicBytesAscii,
  };
}

/**
 * Inspect file header asynchronously with minimal memory overhead
 */
export async function detectFileFormat(filePath: string): Promise<FileFormatDetection> {
  const extension = path.extname(filePath);
  let fd: number | null = null;
  try {
    const stats = await fs.promises.stat(filePath);
    const readSize = Math.min(stats.size, 4096);
    const buffer = Buffer.alloc(readSize);

    if (readSize > 0) {
      fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, readSize, 0);
      fs.closeSync(fd);
      fd = null;
    }

    return detectFormatFromBuffer(buffer, extension, stats.size);
  } catch (err: any) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
    return {
      extension,
      detectedFormat: 'Unreadable File',
      detectedMime: 'application/octet-stream',
      category: 'unknown',
      isExtensionMismatch: false,
      confidence: 'unknown',
      mismatchWarning: `Failed to inspect file: ${err.message || String(err)}`,
    };
  }
}

function isLikelyTextBuffer(buf: Buffer): boolean {
  const checkLen = Math.min(buf.length, 512);
  let zeroCount = 0;
  for (let i = 0; i < checkLen; i++) {
    const byte = buf[i];
    if (byte === 0) zeroCount++;
    // Binary control characters outside tab, LF, CR
    if (byte < 7 || (byte > 14 && byte < 32 && byte !== 27)) {
      return false;
    }
  }
  return zeroCount === 0;
}
