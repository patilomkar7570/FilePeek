import * as fs from 'fs';
import * as crypto from 'crypto';
import { HashProgressResult } from '../shared/types';

interface ActiveJob {
  stream?: fs.ReadStream;
  cancelled: boolean;
}

const activeJobs = new Map<string, ActiveJob>();

export function cancelHashJob(requestId: string): boolean {
  const job = activeJobs.get(requestId);
  if (job) {
    job.cancelled = true;
    if (job.stream) {
      job.stream.destroy();
    }
    activeJobs.delete(requestId);
    return true;
  }
  return false;
}

export async function computeFileHashes(
  filePath: string,
  algorithms: Array<'sha256' | 'sha1' | 'md5'>,
  requestId: string,
  onProgress?: (progress: number) => void
): Promise<HashProgressResult> {
  const job: ActiveJob = { cancelled: false };
  activeJobs.set(requestId, job);

  let stats: fs.Stats;
  try {
    stats = await fs.promises.stat(filePath);
  } catch (err) {
    activeJobs.delete(requestId);
    if (job.cancelled) {
      return { progress: 0, isCalculating: false, cancelled: true };
    }
    throw err;
  }

  if (job.cancelled) {
    activeJobs.delete(requestId);
    return { progress: 0, isCalculating: false, cancelled: true };
  }

  const totalSize = stats.size;

  // If file is 0 bytes
  if (totalSize === 0) {
    activeJobs.delete(requestId);
    const result: HashProgressResult = {
      progress: 100,
      isCalculating: false,
      cancelled: false,
    };
    if (algorithms.includes('sha256')) {
      result.sha256 = crypto.createHash('sha256').digest('hex');
    }
    if (algorithms.includes('sha1')) {
      result.sha1 = crypto.createHash('sha1').digest('hex');
    }
    if (algorithms.includes('md5')) {
      result.md5 = crypto.createHash('md5').digest('hex');
    }
    return result;
  }

  const hashes: Record<string, crypto.Hash> = {};
  for (const algo of algorithms) {
    hashes[algo] = crypto.createHash(algo);
  }

  return new Promise<HashProgressResult>((resolve, reject) => {
    if (job.cancelled) {
      activeJobs.delete(requestId);
      resolve({ progress: 0, isCalculating: false, cancelled: true });
      return;
    }

    const stream = fs.createReadStream(filePath, { highWaterMark: 512 * 1024 });
    job.stream = stream;

    let bytesRead = 0;
    let lastProgressReportTime = 0;

    stream.on('data', (chunk: string | Buffer) => {
      if (job.cancelled) {
        stream.destroy();
        return;
      }

      const bufferChunk = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      bytesRead += bufferChunk.length;

      for (const algo of algorithms) {
        hashes[algo].update(bufferChunk);
      }

      const now = Date.now();
      if (now - lastProgressReportTime > 80 || bytesRead >= totalSize) {
        lastProgressReportTime = now;
        const progress = Math.min(100, Math.floor((bytesRead / totalSize) * 100));
        if (onProgress) {
          onProgress(progress);
        }
      }
    });

    stream.on('end', () => {
      activeJobs.delete(requestId);
      if (job.cancelled) {
        resolve({
          progress: 0,
          isCalculating: false,
          cancelled: true,
        });
        return;
      }

      const finalResult: HashProgressResult = {
        progress: 100,
        isCalculating: false,
        cancelled: false,
      };

      if (hashes.sha256) {
        finalResult.sha256 = hashes.sha256.digest('hex');
      }
      if (hashes.sha1) {
        finalResult.sha1 = hashes.sha1.digest('hex');
      }
      if (hashes.md5) {
        finalResult.md5 = hashes.md5.digest('hex');
      }

      resolve(finalResult);
    });

    stream.on('error', (err) => {
      activeJobs.delete(requestId);
      if (job.cancelled) {
        resolve({
          progress: 0,
          isCalculating: false,
          cancelled: true,
        });
      } else {
        reject(err);
      }
    });

    stream.on('close', () => {
      activeJobs.delete(requestId);
      if (job.cancelled) {
        resolve({
          progress: 0,
          isCalculating: false,
          cancelled: true,
        });
      }
    });
  });
}
