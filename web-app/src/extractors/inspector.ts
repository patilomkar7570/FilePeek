import * as fs from 'fs';
import * as path from 'path';
import {
  FileInspectionResult,
  GeneralFileInfo,
  TechnicalMetadata,
} from '../shared/types';
import { formatBytes, formatDate } from '../shared/formatters';
import { detectFileFormat } from './detector';
import { extractImageMetadata } from './image';
import { extractVideoMetadata } from './video';
import { extractAudioMetadata } from './audio';
import { extractPdfMetadata } from './pdf';
import { extractArchiveMetadata } from './archive';
import { calculateFileHashes } from './hasher';
import { analyzeFileForensics } from './forensics';

/**
 * Complete File Inspection Pipeline
 * Takes a validated file path and extracts general, format, technical, cryptographic,
 * and deep forensic properties that Windows File Explorer Properties never reveals.
 */
export async function inspectFile(
  filePath: string,
  options?: {
    calculateInitialHash?: boolean;
    maxPreviewSizeBytes?: number;
    maxArchiveScanEntries?: number;
  }
): Promise<FileInspectionResult> {
  const resolvedPath = path.resolve(filePath);

  let stats: fs.Stats;
  try {
    stats = await fs.promises.stat(resolvedPath);
  } catch (err: any) {
    throw new Error(`Cannot access file at "${filePath}": ${err.message || 'File not found or permission denied'}`);
  }

  if (stats.isDirectory()) {
    throw new Error(`"${filePath}" is a directory. FilePeek inspects individual files.`);
  }

  const parsed = path.parse(resolvedPath);
  const fileSizeBytes = stats.size;

  // General File Information
  const general: GeneralFileInfo = {
    fileName: parsed.base,
    filePath: resolvedPath,
    fileExtension: parsed.ext.toLowerCase(),
    fileSizeBytes,
    fileSizeFormatted: formatBytes(fileSizeBytes),
    creationTimeMs: stats.birthtimeMs || stats.ctimeMs,
    creationTimeFormatted: formatDate(stats.birthtimeMs || stats.ctimeMs),
    lastModifiedTimeMs: stats.mtimeMs,
    lastModifiedTimeFormatted: formatDate(stats.mtimeMs),
    lastAccessedTimeMs: stats.atimeMs,
    lastAccessedTimeFormatted: formatDate(stats.atimeMs),
    isReadOnly: (stats.mode & 0o200) === 0,
    isHidden: parsed.base.startsWith('.'),
  };

  // Format Detection (Magic Bytes + Extension Comparison)
  const format = await detectFileFormat(resolvedPath);

  // Forensic Deep Analysis (Entropy, Byte Density, Hex Grid, Encoding, PE Headers)
  const forensics = await analyzeFileForensics(resolvedPath, fileSizeBytes);

  // Category-specific Technical Metadata
  const technical: TechnicalMetadata = {
    category: format.category,
    forensics,
  };

  try {
    switch (format.category) {
      case 'image':
        technical.image = await extractImageMetadata(
          resolvedPath,
          fileSizeBytes,
          options?.maxPreviewSizeBytes ?? 10 * 1024 * 1024
        );
        break;

      case 'video':
        technical.video = await extractVideoMetadata(resolvedPath, fileSizeBytes);
        break;

      case 'audio':
        technical.audio = await extractAudioMetadata(resolvedPath, fileSizeBytes);
        break;

      case 'pdf':
        technical.pdf = await extractPdfMetadata(resolvedPath, fileSizeBytes);
        break;

      case 'archive':
        technical.archive = await extractArchiveMetadata(
          resolvedPath,
          fileSizeBytes,
          options?.maxArchiveScanEntries ?? 5000
        );
        break;

      default:
        technical.notes = 'Detailed metadata is unavailable for this file type.';
        break;
    }
  } catch (extractorErr: any) {
    technical.notes = `Detailed metadata extractor encountered an error: ${extractorErr.message || String(extractorErr)}`;
  }

  // Initial Hash (SHA-256)
  const hashes: FileInspectionResult['hashes'] = {};
  if (options?.calculateInitialHash !== false) {
    try {
      const hashRes = await calculateFileHashes({
        filePath: resolvedPath,
        algorithms: ['sha256'],
      });
      if (hashRes.sha256) hashes.sha256 = hashRes.sha256;
    } catch {
      // ignore
    }
  }

  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    general,
    format,
    technical,
    hashes,
    forensics,
    inspectedAt: new Date().toISOString(),
  };
}
