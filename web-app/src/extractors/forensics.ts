import * as fs from 'fs';
import {
  EntropyAnalysis,
  ByteDistribution,
  TextEncodingAnalysis,
  PeBinaryAnalysis,
  HexDumpLine,
  ForensicDetails,
} from '../shared/types';

/**
 * FilePeek Forensic Analysis Engine
 * Extracts low-level binary, entropy, encoding, PE executable, and structural
 * information that Windows File Explorer Properties never displays.
 */

export function calculateEntropy(buffer: Buffer): EntropyAnalysis {
  if (buffer.length === 0) {
    return {
      score: 0.0,
      rating: 'Very Low (Padded / Sparse)',
      assessment: 'Empty file with zero Shannon entropy.',
    };
  }

  // Count frequencies of each byte (0..255)
  const freq = new Uint32Array(256);
  for (let i = 0; i < buffer.length; i++) {
    freq[buffer[i]]++;
  }

  let entropy = 0;
  const len = buffer.length;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / len;
      entropy -= p * Math.log2(p);
    }
  }

  const score = parseFloat(entropy.toFixed(3));
  let rating: EntropyAnalysis['rating'] = 'Normal (Executable / Code)';
  let assessment = 'Typical entropy for compiled binaries, structured documents, or markup.';

  if (score < 2.5) {
    rating = 'Very Low (Padded / Sparse)';
    assessment = 'Heavily repetitive, zero-padded, or sparse byte distribution.';
  } else if (score < 5.0) {
    rating = 'Low (Structured / Text)';
    assessment = 'Plain text, uncompressed source code, or low-density structure.';
  } else if (score >= 7.2) {
    rating = 'High (Compressed / Encrypted)';
    assessment = 'High byte randomness indicating strong compression, cryptographic ciphertext, or packed binary.';
  }

  return { score, rating, assessment };
}

export function analyzeByteDistribution(buffer: Buffer): ByteDistribution {
  const len = buffer.length;
  if (len === 0) {
    return {
      nullByteCount: 0,
      nullByteRatio: 0,
      printableAsciiCount: 0,
      printableAsciiRatio: 0,
      controlCharCount: 0,
      controlCharRatio: 0,
      highBinaryCount: 0,
      highBinaryRatio: 0,
    };
  }

  let nulls = 0;
  let printable = 0;
  let control = 0;
  let highBinary = 0;

  for (let i = 0; i < len; i++) {
    const b = buffer[i];
    if (b === 0) nulls++;
    else if (b >= 32 && b <= 126) printable++;
    else if (b === 9 || b === 10 || b === 13) printable++; // tab, newline
    else if (b < 32) control++;
    else highBinary++;
  }

  return {
    nullByteCount: nulls,
    nullByteRatio: parseFloat(((nulls / len) * 100).toFixed(1)),
    printableAsciiCount: printable,
    printableAsciiRatio: parseFloat(((printable / len) * 100).toFixed(1)),
    controlCharCount: control,
    controlCharRatio: parseFloat(((control / len) * 100).toFixed(1)),
    highBinaryCount: highBinary,
    highBinaryRatio: parseFloat(((highBinary / len) * 100).toFixed(1)),
  };
}

export function detectTextEncoding(buffer: Buffer): TextEncodingAnalysis {
  let detectedEncoding = 'UTF-8 (without BOM)';
  let hasBOM = false;
  let bomName: string | undefined = undefined;

  // Check BOM markers
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    hasBOM = true;
    bomName = 'UTF-8 BOM (EF BB BF)';
    detectedEncoding = 'UTF-8 with BOM';
  } else if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    hasBOM = true;
    bomName = 'UTF-16 Little-Endian BOM (FF FE)';
    detectedEncoding = 'UTF-16 LE';
  } else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    hasBOM = true;
    bomName = 'UTF-16 Big-Endian BOM (FE FF)';
    detectedEncoding = 'UTF-16 BE';
  } else {
    // Check if pure ASCII
    let isAscii = true;
    for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
      if (buffer[i] > 127) {
        isAscii = false;
        break;
      }
    }
    if (isAscii && buffer.length > 0) {
      detectedEncoding = '7-bit US-ASCII';
    }
  }

  // Line ending detection
  let crlfCount = 0;
  let lfCount = 0;
  let crOnlyCount = 0;

  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === 0x0D && buffer[i + 1] === 0x0A) {
      crlfCount++;
      i++; // skip LF
    } else if (buffer[i] === 0x0A) {
      lfCount++;
    } else if (buffer[i] === 0x0D) {
      crOnlyCount++;
    }
  }

  let lineEndingType: TextEncodingAnalysis['lineEndingType'] = 'None (Binary / Single Line)';
  if (crlfCount > 0 && lfCount === 0 && crOnlyCount === 0) {
    lineEndingType = 'CRLF (Windows)';
  } else if (lfCount > 0 && crlfCount === 0 && crOnlyCount === 0) {
    lineEndingType = 'LF (Unix/macOS)';
  } else if (crOnlyCount > 0 && crlfCount === 0 && lfCount === 0) {
    lineEndingType = 'CR (Classic Mac)';
  } else if (crlfCount > 0 && lfCount > 0) {
    lineEndingType = 'Mixed';
  }

  return {
    detectedEncoding,
    hasBOM,
    bomName,
    lineEndingType,
    crlfCount,
    lfCount,
  };
}

export function parsePeBinaryHeader(buffer: Buffer): PeBinaryAnalysis {
  // Check 'MZ' header
  if (buffer.length < 64 || buffer[0] !== 0x4D || buffer[1] !== 0x5A) {
    return { isPe: false };
  }

  // PE Header offset at 0x3C
  const peOffset = buffer.readUInt32LE(0x3C);
  if (peOffset + 24 > buffer.length) {
    return { isPe: true, machineArchitecture: 'DOS Stub Executable (Pre-PE)' };
  }

  // Check PE signature 'PE\0\0' (0x50 0x45 0x00 0x00)
  if (
    buffer[peOffset] !== 0x50 ||
    buffer[peOffset + 1] !== 0x45 ||
    buffer[peOffset + 2] !== 0x00 ||
    buffer[peOffset + 3] !== 0x00
  ) {
    return { isPe: true, machineArchitecture: '16-bit DOS Binary' };
  }

  // COFF File Header
  const machineId = buffer.readUInt16LE(peOffset + 4);
  const numberOfSections = buffer.readUInt16LE(peOffset + 6);
  const sizeOfOptionalHeader = buffer.readUInt16LE(peOffset + 20);
  const characteristics = buffer.readUInt16LE(peOffset + 22);

  let machineArchitecture = `Unknown Machine (0x${machineId.toString(16)})`;
  if (machineId === 0x014C) machineArchitecture = 'Intel 386 or later (x86 32-bit)';
  else if (machineId === 0x8664) machineArchitecture = 'AMD64 or Intel EM64T (x64 64-bit)';
  else if (machineId === 0xAA64) machineArchitecture = 'ARM64 (Little-Endian)';
  else if (machineId === 0x01C0) machineArchitecture = 'ARM (Thumb)';

  const isDll = (characteristics & 0x2000) !== 0;

  // Optional Header
  let subsystem = 'Unknown Subsystem';
  let entryPointRva = 'Unknown';
  let linkerVersion = 'Unknown';
  const charFlags: string[] = [];

  if (sizeOfOptionalHeader >= 68 && peOffset + 24 + sizeOfOptionalHeader <= buffer.length) {
    const optOffset = peOffset + 24;
    const magic = buffer.readUInt16LE(optOffset);
    const majorLinker = buffer[optOffset + 2];
    const minorLinker = buffer[optOffset + 3];
    linkerVersion = `Linker v${majorLinker}.${minorLinker}`;

    const entryPoint = buffer.readUInt32LE(optOffset + 16);
    entryPointRva = `0x${entryPoint.toString(16).toUpperCase().padStart(8, '0')}`;

    const isPE32Plus = magic === 0x020B; // 64-bit optional header
    const subsystemOffset = isPE32Plus ? optOffset + 68 : optOffset + 68;
    const dllCharOffset = isPE32Plus ? optOffset + 70 : optOffset + 70;

    const subId = buffer.readUInt16LE(subsystemOffset);
    if (subId === 2) subsystem = 'Windows GUI (Graphical)';
    else if (subId === 3) subsystem = 'Windows CUI (Console / CLI)';
    else if (subId === 1) subsystem = 'Native Windows Driver';
    else if (subId === 7) subsystem = 'Windows CE / POS';

    const dllChar = buffer.readUInt16LE(dllCharOffset);
    if (dllChar & 0x0040) charFlags.push('ASLR (Dynamic Base)');
    if (dllChar & 0x0100) charFlags.push('DEP / NX (No-Execute)');
    if (dllChar & 0x0400) charFlags.push('No SEH');
    if (dllChar & 0x0020) charFlags.push('High Entropy 64-bit VA');
  }

  return {
    isPe: true,
    machineArchitecture,
    subsystem,
    entryPointRva,
    sectionsCount: numberOfSections,
    linkerVersion,
    characteristics: charFlags,
    isDll,
  };
}

export function generateHexDump(buffer: Buffer, bytesToDump: number = 64): HexDumpLine[] {
  const lines: HexDumpLine[] = [];
  const limit = Math.min(buffer.length, bytesToDump);

  for (let offset = 0; offset < limit; offset += 16) {
    const chunk = buffer.slice(offset, Math.min(offset + 16, limit));
    const offsetHex = offset.toString(16).padStart(8, '0');

    const hexParts: string[] = [];
    for (let i = 0; i < 16; i++) {
      if (i < chunk.length) {
        hexParts.push(chunk[i].toString(16).padStart(2, '0').toUpperCase());
      } else {
        hexParts.push('  ');
      }
    }

    const asciiParts: string[] = [];
    for (let i = 0; i < chunk.length; i++) {
      const b = chunk[i];
      asciiParts.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : '.');
    }

    lines.push({
      offset: offsetHex,
      hex: `${hexParts.slice(0, 8).join(' ')}  ${hexParts.slice(8).join(' ')}`,
      ascii: asciiParts.join(''),
    });
  }

  return lines;
}

/**
 * Execute full forensic analysis pass
 */
export async function analyzeFileForensics(filePath: string, fileSizeBytes: number): Promise<ForensicDetails> {
  let fd: number | null = null;
  // Read first 64 KB for forensic header and byte distribution
  const readSize = Math.min(fileSizeBytes, 64 * 1024);
  const buffer = Buffer.alloc(readSize);

  try {
    if (readSize > 0) {
      fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, readSize, 0);
    }
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }

  const entropy = calculateEntropy(buffer);
  const byteDistribution = analyzeByteDistribution(buffer);
  const textEncoding = detectTextEncoding(buffer);
  const hexDump = generateHexDump(buffer, 64);

  let peBinary: PeBinaryAnalysis | undefined = undefined;
  if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    peBinary = parsePeBinaryHeader(buffer);
  }

  return {
    entropy,
    byteDistribution,
    textEncoding,
    peBinary,
    hexDump,
  };
}
