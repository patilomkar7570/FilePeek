import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PDFDocument } from 'pdf-lib';
import { extractPdfMetadata } from '../src/main/extractors/pdf';
import { createFallbackMetadata } from '../src/main/extractors/fallback';
import { generateTextReport, generateJsonReport } from '../src/main/exporter';
import { FileInspectionResult } from '../src/shared/types';

describe('Extractors & Exporter', () => {
  const tempDir = path.join(os.tmpdir(), `filepeek_test_extractors_${Date.now()}`);
  const pdfPath = path.join(tempDir, 'test_sample.pdf');

  beforeAll(async () => {
    fs.mkdirSync(tempDir, { recursive: true });

    // Generate a valid PDF document on disk using pdf-lib
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle('FilePeek Security & Architecture Specification');
    pdfDoc.setAuthor('Antigravity Team');
    pdfDoc.setSubject('Desktop File Inspection');
    pdfDoc.setCreator('FilePeek Engine');
    pdfDoc.setProducer('FilePeek PDF Pipeline');
    pdfDoc.addPage([600, 400]);
    pdfDoc.addPage([600, 400]);

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('extracts PDF page count, version and metadata correctly', async () => {
    const metadata = await extractPdfMetadata(pdfPath);
    expect(metadata.pageCount).toBe(2);
    expect(metadata.title).toBe('FilePeek Security & Architecture Specification');
    expect(metadata.author).toBe('Antigravity Team');
    expect(metadata.subject).toBe('Desktop File Inspection');
    expect(metadata.creator).toBe('FilePeek Engine');
    expect(metadata.pdfVersion).toBeDefined();
  });

  it('generates aligned 16-byte raw hex rows for fallback viewer', () => {
    const sampleBuffer = Buffer.from('Antigravity FilePeek 2026 Test Buffer with Binary Data');
    const fallback = createFallbackMetadata(sampleBuffer);

    expect(fallback.headerHexPreview.length).toBeGreaterThan(0);
    const firstRow = fallback.headerHexPreview[0];
    expect(firstRow.offset).toBe('00000000');
    expect(firstRow.hex.length).toBe(16);
    expect(firstRow.ascii.length).toBe(16);
  });

  it('generates plaintext and JSON export reports without including raw binary bytes', () => {
    const mockResult: FileInspectionResult = {
      id: 'test_123',
      timestamp: new Date().toISOString(),
      general: {
        fileName: 'report_sample.png',
        fileExtension: '.png',
        detectedFormat: 'PNG Image',
        mimeType: 'image/png',
        sizeBytes: 1024,
        sizeFormatted: '1 KB',
        filePath: 'C:\\test\\report_sample.png',
        directory: 'C:\\test',
        createdTime: '2026-01-01T00:00:00.000Z',
        modifiedTime: '2026-01-01T00:00:00.000Z',
        accessedTime: '2026-01-01T00:00:00.000Z',
        isReadOnly: false,
        isHidden: false,
      },
      verification: {
        extension: '.png',
        detectedFormat: 'PNG Image',
        detectedMime: 'image/png',
        isMismatch: false,
        isUnknownFormat: false,
        magicSignatureHex: '89504E47',
      },
      category: 'image',
      image: {
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        format: 'PNG',
        previewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      },
      hashes: {
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        progress: 100,
        isCalculating: false,
        cancelled: false,
      },
    };

    const textReport = generateTextReport(mockResult);
    expect(textReport).toContain('FILEPEEK INSPECTION REPORT');
    expect(textReport).toContain('report_sample.png');
    expect(textReport).toContain('PNG Image');
    expect(textReport).toContain('1920 x 1080 pixels');
    expect(textReport).toContain('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');

    const jsonReport = generateJsonReport(mockResult);
    const parsed = JSON.parse(jsonReport);
    expect(parsed.general.fileName).toBe('report_sample.png');
    // Ensure huge base64 preview is omitted from exported json
    expect(parsed.image.previewUrl).toBe('[Preview omitted from report]');
  });
});
