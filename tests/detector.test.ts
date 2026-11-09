import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectFormatAndCategory } from '../src/main/detector';

describe('Format & Extension Mismatch Detector', () => {
  const tempDir = path.join(os.tmpdir(), `filepeek_test_detector_${Date.now()}`);

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('detects PNG image format correctly', async () => {
    const pngPath = path.join(tempDir, 'sample.png');
    // PNG magic signature: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    fs.writeFileSync(pngPath, pngHeader);

    const result = await detectFormatAndCategory(pngPath);
    expect(result.detectedFormat).toBe('PNG Image');
    expect(result.category).toBe('image');
    expect(result.verification.isMismatch).toBe(false);
    expect(result.verification.magicSignatureHex).toContain('89504E47');
  });

  it('detects format mismatch when executable is renamed to .png', async () => {
    const fakePng = path.join(tempDir, 'malicious_rename.png');
    // MZ signature: 4D 5A
    const exeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    fs.writeFileSync(fakePng, exeHeader);

    const result = await detectFormatAndCategory(fakePng);
    expect(result.detectedFormat).toBe('Windows Executable / DLL (PE)');
    expect(result.category).toBe('executable');
    expect(result.verification.isMismatch).toBe(true);
    expect(result.verification.warningMessage).toBe('File extension does not match detected format.');
  });

  it('detects format mismatch when zip is disguised as .pdf', async () => {
    const fakePdf = path.join(tempDir, 'archive_renamed.pdf');
    // ZIP magic: 50 4B 03 04
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    fs.writeFileSync(fakePdf, zipHeader);

    const result = await detectFormatAndCategory(fakePdf);
    expect(result.detectedFormat).toBe('ZIP Archive');
    expect(result.category).toBe('archive');
    expect(result.verification.isMismatch).toBe(true);
    expect(result.verification.warningMessage).toBe('File extension does not match detected format.');
  });

  it('detects legitimate PDF document format without mismatch', async () => {
    const pdfPath = path.join(tempDir, 'document.pdf');
    // PDF signature: %PDF-1.7
    const pdfHeader = Buffer.from('%PDF-1.7\n%âãÏÓ\n');
    fs.writeFileSync(pdfPath, pdfHeader);

    const result = await detectFormatAndCategory(pdfPath);
    expect(result.detectedFormat).toBe('PDF Document');
    expect(result.category).toBe('pdf');
    expect(result.verification.isMismatch).toBe(false);
  });

  it('detects JPEG format and permits both .jpg and .jpeg', async () => {
    const jpgPath = path.join(tempDir, 'photo.jpg');
    const jpegPath = path.join(tempDir, 'photo.jpeg');
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    fs.writeFileSync(jpgPath, jpegHeader);
    fs.writeFileSync(jpegPath, jpegHeader);

    const res1 = await detectFormatAndCategory(jpgPath);
    const res2 = await detectFormatAndCategory(jpegPath);

    expect(res1.detectedFormat).toBe('JPEG Image');
    expect(res1.verification.isMismatch).toBe(false);
    expect(res2.detectedFormat).toBe('JPEG Image');
    expect(res2.verification.isMismatch).toBe(false);
  });

  it('detects plain text and source code files', async () => {
    const txtPath = path.join(tempDir, 'notes.txt');
    fs.writeFileSync(txtPath, 'Hello FilePeek, this is a plain text file without binary signatures.\n');

    const result = await detectFormatAndCategory(txtPath);
    expect(result.detectedFormat).toBe('Plain Text / Source Code');
    expect(result.category).toBe('text');
    expect(result.verification.isMismatch).toBe(false);
  });

  it('handles non-existent or inaccessible files gracefully without crashing', async () => {
    const nonExistent = path.join(tempDir, 'does_not_exist.bin');
    const result = await detectFormatAndCategory(nonExistent);
    expect(result.verification.isUnknownFormat).toBe(true);
    expect(result.verification.warningMessage).toContain('Could not read');
  });
});
