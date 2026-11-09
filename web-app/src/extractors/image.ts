import * as fs from 'fs';
import * as path from 'path';
import { ImageMetadata } from '../shared/types';
import { calculateAspectRatio } from '../shared/formatters';

/**
 * Image Metadata Extractor
 * Parses image headers (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, AVIF)
 * and extracts EXIF metadata without loading large files into memory.
 */
export async function extractImageMetadata(
  filePath: string,
  fileSizeBytes: number,
  maxPreviewSizeBytes: number = 10 * 1024 * 1024
): Promise<ImageMetadata> {
  const ext = path.extname(filePath).toLowerCase();

  // Read first 64KB for header and EXIF inspection
  let fd: number | null = null;
  const headerSize = Math.min(fileSizeBytes, 65536);
  const headerBuf = Buffer.alloc(headerSize);

  try {
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, headerBuf, 0, headerSize, 0);
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }

  let metadata: Partial<ImageMetadata> = {
    previewAvailable: false,
  };

  // Dispatch to format-specific parser
  if (headerBuf.slice(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) {
    metadata = parseJpeg(headerBuf, filePath, fileSizeBytes);
  } else if (headerBuf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
    metadata = parsePng(headerBuf);
  } else if (headerBuf.slice(0, 4).toString('ascii') === 'RIFF' && headerBuf.slice(8, 12).toString('ascii') === 'WEBP') {
    metadata = parseWebp(headerBuf);
  } else if (headerBuf.slice(0, 3).toString('ascii') === 'GIF') {
    metadata = parseGif(headerBuf);
  } else if (headerBuf.slice(0, 2).equals(Buffer.from([0x42, 0x4D]))) {
    metadata = parseBmp(headerBuf);
  } else if (
    headerBuf.slice(0, 4).equals(Buffer.from([0x49, 0x49, 0x2A, 0x00])) ||
    headerBuf.slice(0, 4).equals(Buffer.from([0x4D, 0x4D, 0x00, 0x2A]))
  ) {
    metadata = parseTiff(headerBuf);
  } else if (ext === '.svg' || isSvgBuffer(headerBuf)) {
    metadata = parseSvg(filePath, fileSizeBytes);
  } else if (headerBuf.slice(4, 8).toString('ascii') === 'ftyp' && (headerBuf.slice(8, 12).toString('ascii').startsWith('avif') || headerBuf.slice(8, 12).toString('ascii').startsWith('avis'))) {
    metadata = parseAvif(headerBuf);
  } else {
    metadata = {
      format: ext.replace('.', '').toUpperCase(),
      width: 0,
      height: 0,
      aspectRatio: 'Unknown',
      previewAvailable: false,
    };
  }

  // Calculate Aspect Ratio if width and height are known
  if (metadata.width && metadata.height && (!metadata.aspectRatio || metadata.aspectRatio === 'Unknown')) {
    metadata.aspectRatio = calculateAspectRatio(metadata.width, metadata.height);
  }

  // Generate safe Preview URL if applicable
  const canPreview = ['JPEG', 'PNG', 'GIF', 'WebP', 'BMP', 'SVG'].includes(metadata.format || '');
  if (canPreview && fileSizeBytes > 0 && fileSizeBytes <= maxPreviewSizeBytes) {
    try {
      const data = await fs.promises.readFile(filePath);
      const mime = getMimeForFormat(metadata.format || '', ext);
      metadata.previewUrl = `data:${mime};base64,${data.toString('base64')}`;
      metadata.previewAvailable = true;
    } catch {
      metadata.previewAvailable = false;
      metadata.previewNote = 'Could not generate preview.';
    }
  } else if (fileSizeBytes > maxPreviewSizeBytes) {
    metadata.previewAvailable = false;
    metadata.previewNote = `Preview disabled for files larger than ${Math.round(maxPreviewSizeBytes / (1024 * 1024))} MB.`;
  }

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    aspectRatio: metadata.aspectRatio || 'Unknown',
    format: metadata.format || 'Image',
    colorSpace: metadata.colorSpace,
    bitDepth: metadata.bitDepth,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    cameraMake: metadata.cameraMake,
    cameraModel: metadata.cameraModel,
    lensModel: metadata.lensModel,
    dateTimeOriginal: metadata.dateTimeOriginal,
    iso: metadata.iso,
    fNumber: metadata.fNumber,
    exposureTime: metadata.exposureTime,
    focalLength: metadata.focalLength,
    software: metadata.software,
    previewUrl: metadata.previewUrl,
    previewAvailable: metadata.previewAvailable || false,
    previewNote: metadata.previewNote,
  };
}

// --- JPEG Parser ---
function parseJpeg(buf: Buffer, filePath: string, fileSizeBytes: number): Partial<ImageMetadata> {
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorSpace = 'sRGB';
  let exifData: Partial<ImageMetadata> = {};

  let offset = 2; // skip 0xFFD8
  while (offset < buf.length - 1) {
    if (buf[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = buf[offset + 1];
    // Standalone markers without length
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      offset += 2;
      continue;
    }

    if (offset + 4 > buf.length) break;
    const length = buf.readUInt16BE(offset + 2);

    // Baseline (SOF0 = 0xC0) or Progressive (SOF2 = 0xC2)
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
      if (offset + 2 + length <= buf.length) {
        bitDepth = buf[offset + 4];
        height = buf.readUInt16BE(offset + 5);
        width = buf.readUInt16BE(offset + 7);
        const components = buf[offset + 9];
        colorSpace = components === 1 ? 'Grayscale' : components === 3 ? 'sRGB' : components === 4 ? 'CMYK' : 'Unknown';
      }
    }

    // APP1 EXIF segment (0xE1)
    if (marker === 0xE1 && offset + 2 + length <= buf.length) {
      const app1 = buf.slice(offset + 4, offset + 2 + length);
      if (app1.slice(0, 6).toString('ascii') === 'Exif\0\0') {
        exifData = parseTiffExifBlock(app1.slice(6));
      }
    }

    offset += 2 + length;
  }

  return {
    format: 'JPEG',
    width,
    height,
    bitDepth,
    colorSpace,
    ...exifData,
  };
}

// --- PNG Parser ---
function parsePng(buf: Buffer): Partial<ImageMetadata> {
  if (buf.length < 24) return { format: 'PNG' };
  // IHDR starts at offset 8, length at 8, type at 12, data at 16
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];

  let colorSpace = 'sRGB';
  let hasAlpha = false;
  switch (colorType) {
    case 0: colorSpace = 'Grayscale'; break;
    case 2: colorSpace = 'RGB'; break;
    case 3: colorSpace = 'Indexed Color (Palette)'; break;
    case 4: colorSpace = 'Grayscale with Alpha'; hasAlpha = true; break;
    case 6: colorSpace = 'RGBA'; hasAlpha = true; break;
  }

  return {
    format: 'PNG',
    width,
    height,
    bitDepth,
    colorSpace,
    hasAlpha,
  };
}

// --- GIF Parser ---
function parseGif(buf: Buffer): Partial<ImageMetadata> {
  if (buf.length < 13) return { format: 'GIF' };
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  const packed = buf[10];
  const colorResolution = ((packed >> 4) & 0x07) + 1;
  const bitDepth = colorResolution;

  return {
    format: 'GIF',
    width,
    height,
    bitDepth,
    colorSpace: 'Indexed Color',
    hasAlpha: true,
  };
}

// --- WebP Parser ---
function parseWebp(buf: Buffer): Partial<ImageMetadata> {
  let width = 0;
  let height = 0;
  let hasAlpha = false;

  if (buf.length >= 30) {
    const chunkType = buf.slice(12, 16).toString('ascii');
    if (chunkType === 'VP8 ') {
      // Lossy VP8
      // Keyframe check: 0x9D 0x01 0x2A at offset 23
      if (buf[23] === 0x9D && buf[24] === 0x01 && buf[25] === 0x2A) {
        width = buf.readUInt16LE(26) & 0x3FFF;
        height = buf.readUInt16LE(28) & 0x3FFF;
      }
    } else if (chunkType === 'VP8L') {
      // Lossless VP8L
      if (buf[20] === 0x2F) {
        const b1 = buf[21];
        const b2 = buf[22];
        const b3 = buf[23];
        const b4 = buf[24];
        width = 1 + (((b2 & 0x3F) << 8) | b1);
        height = 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6));
        hasAlpha = (b4 & 0x10) !== 0;
      }
    } else if (chunkType === 'VP8X') {
      // Extended WebP
      width = 1 + buf.readUIntLE(24, 3);
      height = 1 + buf.readUIntLE(27, 3);
      hasAlpha = (buf[20] & 0x10) !== 0;
    }
  }

  return {
    format: 'WebP',
    width,
    height,
    bitDepth: 8,
    colorSpace: hasAlpha ? 'RGBA' : 'sRGB',
    hasAlpha,
  };
}

// --- BMP Parser ---
function parseBmp(buf: Buffer): Partial<ImageMetadata> {
  if (buf.length < 28) return { format: 'BMP' };
  const width = buf.readInt32LE(18);
  const height = Math.abs(buf.readInt32LE(22));
  const bitDepth = buf.readUInt16LE(28);

  return {
    format: 'BMP',
    width,
    height,
    bitDepth,
    colorSpace: bitDepth === 32 ? 'RGBA' : bitDepth === 24 ? 'sRGB' : 'Indexed',
    hasAlpha: bitDepth === 32,
  };
}

// --- TIFF Parser ---
function parseTiff(buf: Buffer): Partial<ImageMetadata> {
  const isLittle = buf[0] === 0x49;
  const readU16 = (off: number) => isLittle ? buf.readUInt16LE(off) : buf.readUInt16BE(off);
  const readU32 = (off: number) => isLittle ? buf.readUInt32LE(off) : buf.readUInt32BE(off);

  let width = 0;
  let height = 0;
  let bitDepth = 8;

  try {
    const firstIfd = readU32(4);
    if (firstIfd + 2 <= buf.length) {
      const numEntries = readU16(firstIfd);
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = firstIfd + 2 + i * 12;
        if (entryOffset + 12 > buf.length) break;
        const tag = readU16(entryOffset);
        const type = readU16(entryOffset + 2);
        const valueOffset = entryOffset + 8;

        const val = (type === 3) ? readU16(valueOffset) : readU32(valueOffset);
        if (tag === 256) width = val; // ImageWidth
        if (tag === 257) height = val; // ImageLength
        if (tag === 258) bitDepth = val; // BitsPerSample
      }
    }
  } catch {
    // Ignore corrupt TIFF
  }

  return {
    format: 'TIFF',
    width,
    height,
    bitDepth,
    colorSpace: 'RGB',
  };
}

// --- SVG Parser (Safe XML attribute parsing, no eval) ---
function parseSvg(filePath: string, fileSizeBytes: number): Partial<ImageMetadata> {
  try {
    const readLen = Math.min(fileSizeBytes, 32768);
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(readLen);
    fs.readSync(fd, buf, 0, readLen, 0);
    fs.closeSync(fd);

    const text = buf.toString('utf8');
    let width = 0;
    let height = 0;

    // Search for viewBox="min-x min-y width height"
    const viewBoxMatch = text.match(/viewBox\s*=\s*["']\s*([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s*["']/i);
    if (viewBoxMatch) {
      width = Math.round(parseFloat(viewBoxMatch[3]));
      height = Math.round(parseFloat(viewBoxMatch[4]));
    }

    if (!width || !height) {
      const widthMatch = text.match(/<svg[^>]*\bwidth\s*=\s*["']([0-9.]+)(?:px)?["']/i);
      const heightMatch = text.match(/<svg[^>]*\bheight\s*=\s*["']([0-9.]+)(?:px)?["']/i);
      if (widthMatch) width = Math.round(parseFloat(widthMatch[1]));
      if (heightMatch) height = Math.round(parseFloat(heightMatch[1]));
    }

    return {
      format: 'SVG',
      width: width || 800,
      height: height || 600,
      aspectRatio: width && height ? calculateAspectRatio(width, height) : 'Scalable Vector',
      colorSpace: 'Vector / sRGB',
    };
  } catch {
    return {
      format: 'SVG',
      width: 0,
      height: 0,
      aspectRatio: 'Scalable Vector',
    };
  }
}

// --- AVIF Parser ---
function parseAvif(buf: Buffer): Partial<ImageMetadata> {
  let width = 0;
  let height = 0;

  // Search for 'ispe' box in meta
  const ispeIndex = buf.indexOf(Buffer.from('ispe', 'ascii'));
  if (ispeIndex !== -1 && ispeIndex + 12 <= buf.length) {
    // ispe box payload: 4 bytes version+flags, 4 bytes width, 4 bytes height
    width = buf.readUInt32BE(ispeIndex + 8);
    height = buf.readUInt32BE(ispeIndex + 12);
  }

  return {
    format: 'AVIF',
    width,
    height,
    colorSpace: 'YUV / RGB',
  };
}

// --- EXIF Block Parser (TIFF structured block) ---
function parseTiffExifBlock(buf: Buffer): Partial<ImageMetadata> {
  if (buf.length < 8) return {};
  const isLittle = buf[0] === 0x49;
  const readU16 = (off: number) => (isLittle ? buf.readUInt16LE(off) : buf.readUInt16BE(off));
  const readU32 = (off: number) => (isLittle ? buf.readUInt32LE(off) : buf.readUInt32BE(off));

  const result: Partial<ImageMetadata> = {};

  try {
    const firstIfd = readU32(4);
    if (firstIfd + 2 > buf.length) return result;

    const numEntries = readU16(firstIfd);
    let exifSubIfdOffset = 0;

    for (let i = 0; i < numEntries; i++) {
      const entryOff = firstIfd + 2 + i * 12;
      if (entryOff + 12 > buf.length) break;

      const tag = readU16(entryOff);
      const type = readU16(entryOff + 2);
      const count = readU32(entryOff + 4);
      const valueOff = entryOff + 8;

      if (tag === 0x010F) result.cameraMake = readString(buf, valueOff, count, isLittle); // Make
      if (tag === 0x0110) result.cameraModel = readString(buf, valueOff, count, isLittle); // Model
      if (tag === 0x0112) result.orientation = type === 3 ? readU16(valueOff) : readU32(valueOff); // Orientation
      if (tag === 0x0131) result.software = readString(buf, valueOff, count, isLittle); // Software
      if (tag === 0x8769) exifSubIfdOffset = readU32(valueOff); // Exif IFD Pointer
    }

    // Parse EXIF SubIFD if present
    if (exifSubIfdOffset > 0 && exifSubIfdOffset + 2 <= buf.length) {
      const subEntries = readU16(exifSubIfdOffset);
      for (let i = 0; i < subEntries; i++) {
        const entryOff = exifSubIfdOffset + 2 + i * 12;
        if (entryOff + 12 > buf.length) break;

        const tag = readU16(entryOff);
        const count = readU32(entryOff + 4);
        const valueOff = entryOff + 8;

        if (tag === 0x9003) result.dateTimeOriginal = readString(buf, valueOff, count, isLittle);
        if (tag === 0x8827) result.iso = readU16(valueOff);
        if (tag === 0x829D) { // FNumber (Rational)
          const rOff = readU32(valueOff);
          if (rOff + 8 <= buf.length) {
            const num = readU32(rOff);
            const den = readU32(rOff + 4);
            if (den !== 0) result.fNumber = parseFloat((num / den).toFixed(1));
          }
        }
        if (tag === 0x829A) { // ExposureTime (Rational)
          const rOff = readU32(valueOff);
          if (rOff + 8 <= buf.length) {
            const num = readU32(rOff);
            const den = readU32(rOff + 4);
            if (num && den) result.exposureTime = num === 1 ? `1/${den}s` : `${(num / den).toFixed(3)}s`;
          }
        }
        if (tag === 0x920A) { // FocalLength
          const rOff = readU32(valueOff);
          if (rOff + 8 <= buf.length) {
            const num = readU32(rOff);
            const den = readU32(rOff + 4);
            if (den !== 0) result.focalLength = `${(num / den).toFixed(1)} mm`;
          }
        }
        if (tag === 0xA434) result.lensModel = readString(buf, valueOff, count, isLittle);
      }
    }
  } catch {
    // Ignore corrupt EXIF
  }

  return result;
}

function readString(buf: Buffer, valOff: number, count: number, isLittle: boolean): string | undefined {
  try {
    const offset = count <= 4 ? valOff : (isLittle ? buf.readUInt32LE(valOff) : buf.readUInt32BE(valOff));
    if (offset + count <= buf.length) {
      return buf.slice(offset, offset + count).toString('utf8').replace(/\0/g, '').trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

function isSvgBuffer(buf: Buffer): boolean {
  const text = buf.slice(0, Math.min(buf.length, 1024)).toString('utf8').trim().toLowerCase();
  return text.startsWith('<svg') || (text.startsWith('<?xml') && text.includes('<svg'));
}

function getMimeForFormat(format: string, ext: string): string {
  switch (format) {
    case 'JPEG': return 'image/jpeg';
    case 'PNG': return 'image/png';
    case 'GIF': return 'image/gif';
    case 'WebP': return 'image/webp';
    case 'BMP': return 'image/bmp';
    case 'SVG': return 'image/svg+xml';
    case 'AVIF': return 'image/avif';
    default: return ext === '.svg' ? 'image/svg+xml' : 'image/png';
  }
}
