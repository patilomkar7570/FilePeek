import * as fs from 'fs';
import * as path from 'path';
import { KNOWN_MAGIC_SIGNATURES } from '../shared/constants';
import { FileCategory, FormatVerification } from '../shared/types';

// Extensions that map to common categories even if plain text
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.html', '.htm',
  '.css', '.scss', '.sass', '.less', '.xml', '.svg', '.csv', '.tsv',
  '.yaml', '.yml', '.ini', '.conf', '.env', '.sh', '.bat', '.ps1',
  '.py', '.rb', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.php', '.sql', '.log', '.toml'
]);

export interface DetectionResult {
  detectedFormat: string;
  mimeType: string;
  category: FileCategory;
  verification: FormatVerification;
  sampleBuffer: Buffer;
}

/**
 * Reads the initial header chunk of a file and inspects magic signatures.
 */
export async function detectFormatAndCategory(filePath: string): Promise<DetectionResult> {
  const ext = path.extname(filePath).toLowerCase();
  const headerBuf = Buffer.alloc(4096);
  let bytesRead = 0;

  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    fileHandle = await fs.promises.open(filePath, 'r');
    const readResult = await fileHandle.read(headerBuf, 0, 4096, 0);
    bytesRead = readResult.bytesRead;
  } catch (err) {
    // If file cannot be read, return fallback
    return {
      detectedFormat: 'Inaccessible File',
      mimeType: 'application/octet-stream',
      category: 'other',
      sampleBuffer: Buffer.alloc(0),
      verification: {
        extension: ext,
        detectedFormat: 'Unreadable',
        detectedMime: 'application/octet-stream',
        isMismatch: false,
        isUnknownFormat: true,
        warningMessage: 'Could not read file header due to permission or I/O error.',
      },
    };
  } finally {
    if (fileHandle) {
      await fileHandle.close().catch(() => {});
    }
  }

  const validBuf = headerBuf.subarray(0, bytesRead);
  const signatureHex = validBuf.subarray(0, Math.min(16, validBuf.length)).toString('hex').toUpperCase();
  const signatureAscii = validBuf.subarray(0, Math.min(16, validBuf.length)).toString('ascii').replace(/[^\x20-\x7E]/g, '.');

  // Try file-type dynamically if available
  let fileTypeResult: { ext: string; mime: string } | undefined;
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    if (fileTypeFromBuffer) {
      const res = await fileTypeFromBuffer(validBuf);
      if (res) {
        fileTypeResult = res;
      }
    }
  } catch {
    // file-type import fallback
  }

  // 1. Check known magic signatures
  for (const sig of KNOWN_MAGIC_SIGNATURES) {
    if (sig.match(validBuf)) {
      const isMismatch = isExtensionMismatch(ext, sig.extensions, sig.category);
      return {
        detectedFormat: sig.name,
        mimeType: sig.mime,
        category: sig.category,
        sampleBuffer: validBuf,
        verification: {
          extension: ext || '(none)',
          detectedFormat: sig.name,
          detectedMime: sig.mime,
          isMismatch,
          warningMessage: isMismatch
            ? 'File extension does not match detected format.'
            : undefined,
          isUnknownFormat: false,
          magicSignatureHex: signatureHex,
          magicSignatureAscii: signatureAscii,
        },
      };
    }
  }

  // 2. Check if file-type detected something not in our manual list
  if (fileTypeResult) {
    const detectedExt = `.${fileTypeResult.ext}`;
    const category = categorizeMime(fileTypeResult.mime);
    const isMismatch = isExtensionMismatch(ext, [detectedExt], category);
    const formatName = `${fileTypeResult.ext.toUpperCase()} File`;

    return {
      detectedFormat: formatName,
      mimeType: fileTypeResult.mime,
      category,
      sampleBuffer: validBuf,
      verification: {
        extension: ext || '(none)',
        detectedFormat: formatName,
        detectedMime: fileTypeResult.mime,
        isMismatch,
        warningMessage: isMismatch
          ? 'File extension does not match detected format.'
          : undefined,
        isUnknownFormat: false,
        magicSignatureHex: signatureHex,
        magicSignatureAscii: signatureAscii,
      },
    };
  }

  // 3. Check for SVG / XML
  if (isXmlOrSvg(validBuf)) {
    const isSvg = validBuf.toString('utf8', 0, Math.min(1024, validBuf.length)).includes('<svg');
    const detectedFormat = isSvg ? 'Scalable Vector Graphics (SVG)' : 'XML Document';
    const mime = isSvg ? 'image/svg+xml' : 'application/xml';
    const category: FileCategory = isSvg ? 'image' : 'text';
    const isMismatch = isExtensionMismatch(ext, isSvg ? ['.svg'] : ['.xml'], category);

    return {
      detectedFormat,
      mimeType: mime,
      category,
      sampleBuffer: validBuf,
      verification: {
        extension: ext || '(none)',
        detectedFormat,
        detectedMime: mime,
        isMismatch,
        warningMessage: isMismatch ? 'File extension does not match detected format.' : undefined,
        isUnknownFormat: false,
        magicSignatureHex: signatureHex,
        magicSignatureAscii: signatureAscii,
      },
    };
  }

  // 4. Check for Plain Text / Code / JSON
  if (isLikelyPlainText(validBuf)) {
    const isJson = isLikelyJson(validBuf);
    const detectedFormat = isJson ? 'JSON Data Document' : 'Plain Text / Source Code';
    const mime = isJson ? 'application/json' : 'text/plain';
    const category: FileCategory = 'text';

    // If extension is a known binary extension (like .exe, .png, .mp4, etc.) but content is text
    const isMismatch = isBinaryExtension(ext);

    return {
      detectedFormat,
      mimeType: mime,
      category,
      sampleBuffer: validBuf,
      verification: {
        extension: ext || '(none)',
        detectedFormat,
        detectedMime: mime,
        isMismatch,
        warningMessage: isMismatch
          ? 'File extension does not match detected format.'
          : undefined,
        isUnknownFormat: false,
        magicSignatureHex: signatureHex,
        magicSignatureAscii: signatureAscii,
      },
    };
  }

  // 5. Unknown Format Fallback
  const isMismatch = isWellKnownNonGenericExtension(ext);
  return {
    detectedFormat: 'Unidentified Binary Format',
    mimeType: 'application/octet-stream',
    category: 'other',
    sampleBuffer: validBuf,
    verification: {
      extension: ext || '(none)',
      detectedFormat: 'Unidentified Binary / Unknown Signature',
      detectedMime: 'application/octet-stream',
      isMismatch,
      warningMessage: isMismatch
        ? `File extension "${ext}" expects specific binary signature, but header signature is unrecognized.`
        : undefined,
      isUnknownFormat: true,
      magicSignatureHex: signatureHex,
      magicSignatureAscii: signatureAscii,
    },
  };
}

function isXmlOrSvg(buf: Buffer): boolean {
  if (buf.length < 5) return false;
  const str = buf.toString('utf8', 0, Math.min(256, buf.length)).trimStart();
  return str.startsWith('<?xml') || str.startsWith('<svg') || str.startsWith('<!DOCTYPE html');
}

function isLikelyPlainText(buf: Buffer): boolean {
  if (buf.length === 0) return true;
  let textChars = 0;
  const checkLen = Math.min(buf.length, 512);

  for (let i = 0; i < checkLen; i++) {
    const byte = buf[i];
    // Allow tabs, newlines, carriage returns, and ASCII 32..126, or valid UTF-8 lead bytes
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126) || byte >= 128) {
      textChars++;
    } else if (byte === 0) {
      // Null byte strongly indicates binary
      return false;
    }
  }

  return textChars / checkLen > 0.92;
}

function isLikelyJson(buf: Buffer): boolean {
  const str = buf.toString('utf8', 0, Math.min(buf.length, 256)).trimStart();
  return (str.startsWith('{') || str.startsWith('[')) && (str.includes(':') || str.includes(']'));
}

function isExtensionMismatch(ext: string, expectedExtensions: string[], category: FileCategory): boolean {
  if (!ext) return true;
  const normalizedExt = ext.toLowerCase();

  // Exact match with expected extensions
  if (expectedExtensions.some((e) => e.toLowerCase() === normalizedExt)) {
    return false;
  }

  // Allow equivalent image extensions
  if (normalizedExt === '.jpg' && expectedExtensions.includes('.jpeg')) return false;
  if (normalizedExt === '.jpeg' && expectedExtensions.includes('.jpg')) return false;
  if (normalizedExt === '.tif' && expectedExtensions.includes('.tiff')) return false;
  if (normalizedExt === '.tiff' && expectedExtensions.includes('.tif')) return false;

  // Otherwise, mismatch!
  return true;
}

function isBinaryExtension(ext: string): boolean {
  const binaryExts = new Set([
    '.exe', '.dll', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4',
    '.mkv', '.avi', '.mov', '.zip', '.pdf', '.iso', '.bin', '.tar', '.gz'
  ]);
  return binaryExts.has(ext.toLowerCase());
}

function isWellKnownNonGenericExtension(ext: string): boolean {
  const known = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.zip', '.mp4',
    '.mp3', '.flac', '.wav', '.exe', '.dll'
  ]);
  return known.has(ext.toLowerCase());
}

function categorizeMime(mime: string): FileCategory {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/zip' || mime.includes('compressed') || mime.includes('archive') || mime.includes('tar')) return 'archive';
  if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml') return 'text';
  if (mime.includes('executable') || mime.includes('x-dosexec') || mime.includes('x-elf')) return 'executable';
  return 'other';
}
