import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { PDFDocument } from 'pdf-lib';
import { detectFormatAndCategory } from '../src/main/detector';
import { extractMetadataForCategory } from '../src/main/extractors';
import { computeFileHashes } from '../src/main/hasher';
import { generateTextReport, generateJsonReport } from '../src/main/exporter';
import { FileInspectionResult } from '../src/shared/types';
import { formatBytes } from '../src/shared/formatters';

describe('End-to-End FilePeek Inspection Pipeline', () => {
  const tempDir = path.join(os.tmpdir(), `filepeek_test_e2e_${Date.now()}`);

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('runs complete inspection workflow on a ZIP archive', async () => {
    const zipPath = path.join(tempDir, 'test_bundle.zip');
    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from(JSON.stringify({ app: 'FilePeek', v: 1 })));
    zip.addFile('notes/todo.txt', Buffer.from('Finish testing FilePeek'));
    zip.writeZip(zipPath);

    const stats = fs.statSync(zipPath);

    // 1. Detection
    const detection = await detectFormatAndCategory(zipPath);
    expect(detection.detectedFormat).toBe('ZIP Archive');
    expect(detection.category).toBe('archive');
    expect(detection.verification.isMismatch).toBe(false);

    // 2. Metadata Extraction
    const metadata = await extractMetadataForCategory(
      zipPath,
      detection.category,
      detection.detectedFormat,
      detection.mimeType,
      stats.size,
      detection.sampleBuffer
    );
    expect(metadata.archive).toBeDefined();
    expect(metadata.archive!.totalFiles).toBe(2);
    expect(metadata.archive!.compressionRatioPercent).toBeGreaterThanOrEqual(0);

    // 3. Cryptographic Hashes
    const hashes = await computeFileHashes(zipPath, ['sha256', 'sha1', 'md5'], 'req_e2e_zip');
    expect(hashes.sha256).toBeDefined();
    expect(hashes.sha1).toBeDefined();
    expect(hashes.md5).toBeDefined();

    // 4. Assemble full Inspection Result
    const fullResult: FileInspectionResult = {
      id: 'e2e_zip_test',
      timestamp: new Date().toISOString(),
      general: {
        fileName: path.basename(zipPath),
        fileExtension: '.zip',
        detectedFormat: detection.detectedFormat,
        mimeType: detection.mimeType,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        filePath: zipPath,
        directory: path.dirname(zipPath),
        createdTime: stats.birthtime.toISOString(),
        modifiedTime: stats.mtime.toISOString(),
        accessedTime: stats.atime.toISOString(),
        isReadOnly: false,
        isHidden: false,
      },
      verification: detection.verification,
      category: detection.category,
      archive: metadata.archive,
      hashes,
    };

    // 5. Reports
    const textReport = generateTextReport(fullResult);
    expect(textReport).toContain('FILEPEEK INSPECTION REPORT');
    expect(textReport).toContain('test_bundle.zip');
    expect(textReport).toContain('ZIP Archive');

    const jsonReport = generateJsonReport(fullResult);
    const parsed = JSON.parse(jsonReport);
    expect(parsed.archive.totalFiles).toBe(2);
  });

  it('runs complete inspection workflow on an extension-mismatched file', async () => {
    // Disguise an executable binary as an image
    const fakePhotoPath = path.join(tempDir, 'vacation_photo.jpg');
    // MZ executable header
    const exeBuffer = Buffer.from([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
      0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
    ]);
    fs.writeFileSync(fakePhotoPath, exeBuffer);

    const stats = fs.statSync(fakePhotoPath);
    const detection = await detectFormatAndCategory(fakePhotoPath);

    // Assert mismatch detected
    expect(detection.detectedFormat).toBe('Windows Executable / DLL (PE)');
    expect(detection.verification.isMismatch).toBe(true);
    expect(detection.verification.warningMessage).toBe('File extension does not match detected format.');
    expect(detection.category).toBe('executable');

    const metadata = await extractMetadataForCategory(
      fakePhotoPath,
      detection.category,
      detection.detectedFormat,
      detection.mimeType,
      stats.size,
      detection.sampleBuffer
    );
    expect(metadata.fallback).toBeDefined();
    expect(metadata.fallback!.headerHexPreview[0].hex[0]).toBe('4D');
    expect(metadata.fallback!.headerHexPreview[0].hex[1]).toBe('5A');
  });
});
