import * as fs from 'fs';
import * as crypto from 'crypto';
import { FileHashResult, HashProgressUpdate } from '../shared/types';

export interface HashTaskOptions {
  filePath: string;
  algorithms: Array<'sha256' | 'sha1' | 'md5'>;
  onProgress?: (update: HashProgressUpdate) => void;
  signal?: { isCancelled: boolean };
}

/**
 * Streamed Multi-Hash Calculator
 * Calculates cryptographic hashes simultaneously over a single streaming pass.
 * Never loads large files entirely into RAM.
 * Supports cancellation and continuous progress updates.
 */
export async function calculateFileHashes(
  options: HashTaskOptions
): Promise<Partial<Record<'sha256' | 'sha1' | 'md5', FileHashResult>>> {
  const { filePath, algorithms, onProgress, signal } = options;
  const stats = await fs.promises.stat(filePath);
  const totalBytes = stats.size;

  if (totalBytes === 0) {
    // Handle empty file immediately
    const results: Partial<Record<'sha256' | 'sha1' | 'md5', FileHashResult>> = {};
    for (const algo of algorithms) {
      const h = crypto.createHash(algo).digest('hex');
      results[algo] = {
        algorithm: algo,
        hash: h,
        calculatedAtMs: Date.now(),
        durationMs: 0,
        isLegacy: algo === 'md5' || algo === 'sha1',
        recommendationNote: algo === 'sha256'
          ? 'Recommended secure standard'
          : 'Legacy algorithm - not recommended for security-critical integrity verification',
      };
    }
    return results;
  }

  const startTime = Date.now();
  const hashers: Record<string, crypto.Hash> = {};
  for (const algo of algorithms) {
    hashers[algo] = crypto.createHash(algo);
  }

  return new Promise((resolve, reject) => {
    let bytesRead = 0;
    const stream = fs.createReadStream(filePath, { highWaterMark: 256 * 1024 }); // 256 KB chunks

    let lastProgressTime = 0;

    stream.on('data', (chunk: Buffer) => {
      if (signal?.isCancelled) {
        stream.destroy();
        return reject(new Error('Hash calculation cancelled by user.'));
      }

      for (const algo of algorithms) {
        hashers[algo].update(chunk);
      }

      bytesRead += chunk.length;

      const now = Date.now();
      if (onProgress && (now - lastProgressTime > 80 || bytesRead === totalBytes)) {
        lastProgressTime = now;
        const pct = Math.min(100, Math.round((bytesRead / totalBytes) * 100));
        onProgress({
          algorithm: algorithms.join(' + '),
          bytesProcessed: bytesRead,
          totalBytes,
          percentage: pct,
        });
      }
    });

    stream.on('end', () => {
      const durationMs = Date.now() - startTime;
      const results: Partial<Record<'sha256' | 'sha1' | 'md5', FileHashResult>> = {};

      for (const algo of algorithms) {
        results[algo] = {
          algorithm: algo,
          hash: hashers[algo].digest('hex'),
          calculatedAtMs: Date.now(),
          durationMs,
          isLegacy: algo === 'md5' || algo === 'sha1',
          recommendationNote: algo === 'sha256'
            ? 'Recommended secure standard'
            : 'Legacy algorithm - not recommended for security-critical integrity verification',
        };
      }

      resolve(results);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}
