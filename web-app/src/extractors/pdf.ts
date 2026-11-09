import * as fs from 'fs';
import { PdfMetadata } from '../shared/types';
import { formatDate } from '../shared/formatters';

/**
 * PDF Metadata Extractor
 * Parses PDF documents for version, page count, and document info dictionary.
 * Does not require external rendering binaries or remote network requests.
 */
export async function extractPdfMetadata(
  filePath: string,
  fileSizeBytes: number
): Promise<PdfMetadata> {
  let fd: number | null = null;
  const readSize = Math.min(fileSizeBytes, 512 * 1024); // Read up to 512 KB
  const buffer = Buffer.alloc(readSize);

  try {
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, readSize, 0);
  } catch {
    // ignore
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }

  // Also read the last 64 KB for trailer and xref info
  let tailBuffer = Buffer.alloc(0);
  if (fileSizeBytes > readSize) {
    const tailReadSize = Math.min(fileSizeBytes, 64 * 1024);
    tailBuffer = Buffer.alloc(tailReadSize);
    let tailFd: number | null = null;
    try {
      tailFd = fs.openSync(filePath, 'r');
      fs.readSync(tailFd, tailBuffer, 0, tailReadSize, fileSizeBytes - tailReadSize);
    } catch {
      // ignore
    } finally {
      if (tailFd !== null) {
        try { fs.closeSync(tailFd); } catch { /* ignore */ }
      }
    }
  }

  const headText = buffer.toString('latin1');
  const tailText = tailBuffer.toString('latin1');
  const fullSample = headText + tailText;

  // 1. PDF Version from header '%PDF-1.x'
  let pdfVersion: string | undefined;
  const verMatch = headText.match(/%PDF-([0-9]+\.[0-9]+)/);
  if (verMatch) {
    pdfVersion = `PDF ${verMatch[1]}`;
  }

  // 2. Encryption check
  const isEncrypted = fullSample.includes('/Encrypt');

  // 3. Page Count
  // Method A: Look for /Type /Pages ... /Count N
  let pageCount = 0;
  const pagesCountMatch = fullSample.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
  if (pagesCountMatch) {
    pageCount = parseInt(pagesCountMatch[1], 10);
  }

  // Method B: If not found, count instances of /Type /Page (word boundary)
  if (!pageCount || pageCount <= 0) {
    const pageMatches = fullSample.match(/\/Type\s*\/Page\b/g);
    if (pageMatches) {
      pageCount = pageMatches.length;
    }
  }

  // 4. Extract /Info Dictionary metadata (Title, Author, Subject, Creator, Producer, Dates)
  const extractField = (fieldName: string): string | undefined => {
    // Matches /Title (value) or /Title <hex>
    const strRegex = new RegExp(`\\/${fieldName}\\s*\\(([^)]*)\\)`, 'i');
    const match = fullSample.match(strRegex);
    if (match && match[1]) {
      return sanitizePdfString(match[1]);
    }

    const hexRegex = new RegExp(`\\/${fieldName}\\s*<([0-9A-Fa-f]+)>`, 'i');
    const hexMatch = fullSample.match(hexRegex);
    if (hexMatch && hexMatch[1]) {
      return Buffer.from(hexMatch[1], 'hex').toString('utf8').replace(/\0/g, '').trim();
    }
    return undefined;
  };

  const title = extractField('Title');
  const author = extractField('Author');
  const subject = extractField('Subject');
  const creator = extractField('Creator');
  const producer = extractField('Producer');

  const rawCreationDate = extractField('CreationDate');
  const rawModDate = extractField('ModDate');

  return {
    pageCount: pageCount || 1,
    pdfVersion: pdfVersion || 'PDF Standard',
    title,
    author,
    subject,
    creator,
    producer,
    creationDate: parsePdfDate(rawCreationDate),
    modificationDate: parsePdfDate(rawModDate),
    isEncrypted,
    previewAvailable: false,
  };
}

function sanitizePdfString(str: string): string {
  // Handle escaped characters in PDF string literals: \(, \), \\, \r, \n, \t
  let cleaned = str
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\r/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\0/g, '')
    .trim();

  // If starts with UTF-16 BE BOM (FE FF)
  if (cleaned.startsWith('\xFE\xFF')) {
    return Buffer.from(cleaned, 'binary').slice(2).toString('utf16be').trim();
  }
  return cleaned;
}

function parsePdfDate(rawDate?: string): string | undefined {
  if (!rawDate) return undefined;
  // Format: D:YYYYMMDDHHmmSSOHH'mm'
  const cleaned = rawDate.replace(/^D:/, '').replace(/'/g, '');
  if (cleaned.length >= 8) {
    const year = parseInt(cleaned.slice(0, 4), 10);
    const month = parseInt(cleaned.slice(4, 6), 10) - 1;
    const day = parseInt(cleaned.slice(6, 8), 10);
    const hour = cleaned.length >= 10 ? parseInt(cleaned.slice(8, 10), 10) : 0;
    const minute = cleaned.length >= 12 ? parseInt(cleaned.slice(10, 12), 10) : 0;
    const second = cleaned.length >= 14 ? parseInt(cleaned.slice(12, 14), 10) : 0;

    const d = new Date(Date.UTC(year, month, day, hour, minute, second));
    if (!isNaN(d.getTime())) {
      return formatDate(d);
    }
  }
  return rawDate;
}
