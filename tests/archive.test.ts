import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { extractArchiveMetadata } from '../src/main/extractors/archive';

describe('Archive Inspection Engine', () => {
  const tempDir = path.join(os.tmpdir(), `filepeek_test_archive_${Date.now()}`);
  const zipPath = path.join(tempDir, 'sample_archive.zip');

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });

    // Create a real test ZIP archive
    const zip = new AdmZip();
    zip.addFile('readme.txt', Buffer.from('Welcome to FilePeek Archive Inspector!'));
    zip.addFile('data/config.json', Buffer.from(JSON.stringify({ name: 'FilePeek', active: true })));
    zip.addFile('data/logs/sample.log', Buffer.from('Log line 1\nLog line 2\nLog line 3\n'));
    zip.writeZip(zipPath);
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('inspects ZIP central directory entries without extracting to disk', async () => {
    const stats = fs.statSync(zipPath);
    const metadata = await extractArchiveMetadata(zipPath, stats.size);

    expect(metadata.format).toBe('ZIP Archive');
    expect(metadata.totalFiles).toBeGreaterThanOrEqual(3);
    expect(metadata.totalUncompressedSizeBytes).toBeGreaterThan(0);
    expect(metadata.totalCompressedSizeBytes).toBe(stats.size);
    expect(metadata.isEncrypted).toBe(false);

    // Verify entries exist
    const paths = metadata.entries.map((e) => e.path);
    expect(paths.some((p) => p.includes('readme.txt'))).toBe(true);
    expect(paths.some((p) => p.includes('config.json'))).toBe(true);
  });

  it('computes compression ratio accurately', async () => {
    const stats = fs.statSync(zipPath);
    const metadata = await extractArchiveMetadata(zipPath, stats.size);

    expect(metadata.compressionRatioPercent).toBeGreaterThanOrEqual(0);
    expect(metadata.compressionRatioPercent).toBeLessThanOrEqual(100);
  });
});
