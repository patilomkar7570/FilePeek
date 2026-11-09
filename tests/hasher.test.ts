import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { computeFileHashes, cancelHashJob } from '../src/main/hasher';

describe('Cryptographic Hasher (Streaming & Cancellation)', () => {
  const tempDir = path.join(os.tmpdir(), `filepeek_test_hasher_${Date.now()}`);

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('computes SHA-256 for an empty file', async () => {
    const emptyFile = path.join(tempDir, 'empty.txt');
    fs.writeFileSync(emptyFile, '');

    const result = await computeFileHashes(emptyFile, ['sha256'], 'req_empty');
    expect(result.sha256).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(result.progress).toBe(100);
    expect(result.cancelled).toBe(false);
  });

  it('computes SHA-256, SHA-1 and MD5 matching Node crypto standard', async () => {
    const sampleFile = path.join(tempDir, 'sample_data.bin');
    const content = Buffer.from('FilePeek Premium Privacy-Focused Desktop Inspector 2026');
    fs.writeFileSync(sampleFile, content);

    const expectedSha256 = crypto.createHash('sha256').update(content).digest('hex');
    const expectedSha1 = crypto.createHash('sha1').update(content).digest('hex');
    const expectedMd5 = crypto.createHash('md5').update(content).digest('hex');

    const result = await computeFileHashes(
      sampleFile,
      ['sha256', 'sha1', 'md5'],
      'req_all_algos'
    );

    expect(result.sha256).toBe(expectedSha256);
    expect(result.sha1).toBe(expectedSha1);
    expect(result.md5).toBe(expectedMd5);
    expect(result.progress).toBe(100);
  });

  it('handles multi-megabyte files with streaming progress reporting', async () => {
    const largeFile = path.join(tempDir, 'large_file.dat');
    // Generate a 2MB test file with repeatable pattern
    const chunkSize = 64 * 1024;
    const chunk = Buffer.alloc(chunkSize, 'A');
    const handle = fs.openSync(largeFile, 'w');
    for (let i = 0; i < 32; i++) {
      fs.writeSync(handle, chunk);
    }
    fs.closeSync(handle);

    const progressReports: number[] = [];
    const result = await computeFileHashes(
      largeFile,
      ['sha256'],
      'req_large',
      (p) => {
        progressReports.push(p);
      }
    );

    expect(result.sha256).toBeDefined();
    expect(result.progress).toBe(100);
    expect(progressReports.length).toBeGreaterThan(0);
    expect(progressReports[progressReports.length - 1]).toBe(100);
  });

  it('supports cancellation of active hashing job', async () => {
    const largeFile = path.join(tempDir, 'cancel_test.dat');
    const chunkSize = 128 * 1024;
    const chunk = Buffer.alloc(chunkSize, 'Z');
    const handle = fs.openSync(largeFile, 'w');
    for (let i = 0; i < 40; i++) {
      fs.writeSync(handle, chunk);
    }
    fs.closeSync(handle);

    const reqId = 'req_to_cancel';
    const hashPromise = computeFileHashes(largeFile, ['sha256'], reqId);

    // Cancel immediately after kickoff
    const didCancel = cancelHashJob(reqId);
    expect(didCancel).toBe(true);

    const result = await hashPromise;
    expect(result.cancelled).toBe(true);
  });
});
