import * as fs from 'fs';
import { ArchiveEntry, ArchiveMetadata } from '../shared/types';
import { formatBytes } from '../shared/formatters';

/**
 * High-performance ZIP Archive Inspector
 * Reads the End of Central Directory (EOCD) and Central Directory records
 * without extracting archive data or loading uncompressed files.
 * Protects against zip bombs and handles encrypted archives.
 */
export async function extractArchiveMetadata(
  filePath: string,
  fileSizeBytes: number,
  maxScanEntries: number = 5000
): Promise<ArchiveMetadata> {
  let fd: number | null = null;

  try {
    fd = fs.openSync(filePath, 'r');

    // Read the last 65,557 bytes (max comment length 65535 + 22 bytes EOCD)
    const eocdSearchSize = Math.min(fileSizeBytes, 65557);
    const searchBuf = Buffer.alloc(eocdSearchSize);
    const searchOffset = fileSizeBytes - eocdSearchSize;

    fs.readSync(fd, searchBuf, 0, eocdSearchSize, searchOffset);

    // Find EOCD signature 0x06054B50 ('PK\x05\x06') scanning backwards
    let eocdPos = -1;
    for (let i = searchBuf.length - 22; i >= 0; i--) {
      if (
        searchBuf[i] === 0x50 &&
        searchBuf[i + 1] === 0x4B &&
        searchBuf[i + 2] === 0x05 &&
        searchBuf[i + 3] === 0x06
      ) {
        eocdPos = i;
        break;
      }
    }

    if (eocdPos === -1) {
      return {
        archiveFormat: 'ZIP Archive (Malformed or Header Unreachable)',
        fileCount: 0,
        folderCount: 0,
        totalCompressedSize: fileSizeBytes,
        totalCompressedSizeFormatted: formatBytes(fileSizeBytes),
        totalUncompressedSize: 0,
        totalUncompressedSizeFormatted: '0 B',
        compressionRatio: 0,
        isEncrypted: false,
        entries: [],
        warning: 'Could not locate End of Central Directory. The archive may be corrupted or spanned.',
      };
    }

    const totalEntries = searchBuf.readUInt16LE(eocdPos + 10);
    const cdSize = searchBuf.readUInt32LE(eocdPos + 12);
    const cdOffset = searchBuf.readUInt32LE(eocdPos + 16);

    // Read Central Directory
    const cdBuffer = Buffer.alloc(cdSize);
    fs.readSync(fd, cdBuffer, 0, cdSize, cdOffset);

    const entries: ArchiveEntry[] = [];
    let fileCount = 0;
    let folderCount = 0;
    let totalUncompressed = 0;
    let totalCompressed = 0;
    let hasEncryptedFiles = false;
    let hasTruncated = false;

    let cursor = 0;
    const limit = Math.min(totalEntries, maxScanEntries);

    while (cursor + 46 <= cdBuffer.length && entries.length < limit) {
      if (
        cdBuffer[cursor] !== 0x50 ||
        cdBuffer[cursor + 1] !== 0x4B ||
        cdBuffer[cursor + 2] !== 0x01 ||
        cdBuffer[cursor + 3] !== 0x02
      ) {
        break; // Central directory header signature mismatch
      }

      const flags = cdBuffer.readUInt16LE(cursor + 8);
      const isEncrypted = (flags & 0x0001) !== 0;
      if (isEncrypted) hasEncryptedFiles = true;

      const modTime = cdBuffer.readUInt16LE(cursor + 12);
      const modDate = cdBuffer.readUInt16LE(cursor + 14);
      const crc32Val = cdBuffer.readUInt32LE(cursor + 16);
      const compSize = cdBuffer.readUInt32LE(cursor + 20);
      const uncompSize = cdBuffer.readUInt32LE(cursor + 24);
      const nameLen = cdBuffer.readUInt16LE(cursor + 28);
      const extraLen = cdBuffer.readUInt16LE(cursor + 30);
      const commentLen = cdBuffer.readUInt16LE(cursor + 32);

      let entryName = '';
      if (cursor + 46 + nameLen <= cdBuffer.length) {
        entryName = cdBuffer.toString('utf8', cursor + 46, cursor + 46 + nameLen);
      }

      const isDirectory = entryName.endsWith('/') || entryName.endsWith('\\');
      if (isDirectory) {
        folderCount++;
      } else {
        fileCount++;
        totalUncompressed += uncompSize;
        totalCompressed += compSize;
      }

      const formattedDate = parseDosDateTime(modDate, modTime);

      entries.push({
        path: entryName,
        name: entryName.split(/[\/\\]/).filter(Boolean).pop() || entryName,
        isDirectory,
        compressedSize: compSize,
        uncompressedSize: uncompSize,
        lastModified: formattedDate,
        isEncrypted,
        crc32: crc32Val ? `0x${crc32Val.toString(16).toUpperCase().padStart(8, '0')}` : undefined,
      });

      cursor += 46 + nameLen + extraLen + commentLen;
    }

    if (totalEntries > maxScanEntries) {
      hasTruncated = true;
    }

    const compressionRatio = totalUncompressed > 0
      ? parseFloat(((1 - totalCompressed / totalUncompressed) * 100).toFixed(1))
      : 0;

    return {
      archiveFormat: 'ZIP Archive',
      fileCount: totalEntries > maxScanEntries ? totalEntries : fileCount,
      folderCount,
      totalCompressedSize: totalCompressed,
      totalCompressedSizeFormatted: formatBytes(totalCompressed),
      totalUncompressedSize: totalUncompressed,
      totalUncompressedSizeFormatted: formatBytes(totalUncompressed),
      compressionRatio: Math.max(0, compressionRatio),
      isEncrypted: hasEncryptedFiles,
      entries,
      hasTruncatedEntries: hasTruncated,
      warning: hasTruncated
        ? `Archive contains ${totalEntries.toLocaleString()} items. Only first ${maxScanEntries.toLocaleString()} shown.`
        : undefined,
    };
  } catch (err: any) {
    return {
      archiveFormat: 'ZIP Archive',
      fileCount: 0,
      folderCount: 0,
      totalCompressedSize: fileSizeBytes,
      totalCompressedSizeFormatted: formatBytes(fileSizeBytes),
      totalUncompressedSize: 0,
      totalUncompressedSizeFormatted: '0 B',
      compressionRatio: 0,
      isEncrypted: false,
      entries: [],
      warning: `Unable to read archive directory: ${err.message || String(err)}`,
    };
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }
}

function parseDosDateTime(dosDate: number, dosTime: number): string {
  const year = ((dosDate >> 9) & 0x7F) + 1980;
  const month = ((dosDate >> 5) & 0x0F) - 1;
  const day = dosDate & 0x1F;

  const hour = (dosTime >> 11) & 0x1F;
  const minute = (dosTime >> 5) & 0x3F;
  const second = (dosTime & 0x1F) * 2;

  try {
    const d = new Date(year, month, day, hour, minute, second);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return 'Unknown';
}
