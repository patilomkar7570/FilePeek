import AdmZip from 'adm-zip';
import { ArchiveMetadata, ArchiveEntry } from '../../shared/types';
import { formatDate } from '../../shared/formatters';

const MAX_DISPLAY_ENTRIES = 500;

export async function extractArchiveMetadata(
  filePath: string,
  totalCompressedSize: number
): Promise<ArchiveMetadata> {
  const result: ArchiveMetadata = {
    format: 'ZIP Archive',
    totalFiles: 0,
    totalDirs: 0,
    totalCompressedSizeBytes: totalCompressedSize,
    totalUncompressedSizeBytes: 0,
    compressionRatioPercent: 0,
    isEncrypted: false,
    entries: [],
  };

  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    let uncompressedSum = 0;
    let fileCount = 0;
    let dirCount = 0;
    let isEncrypted = false;
    const entriesList: ArchiveEntry[] = [];

    for (let i = 0; i < zipEntries.length; i++) {
      const entry = zipEntries[i];
      const isDir = entry.isDirectory;

      if (isDir) {
        dirCount++;
      } else {
        fileCount++;
        uncompressedSum += entry.header.size;
      }

      // Check encrypted bit in general purpose bit flag (bit 0)
      const entryEncrypted = (entry.header.flags & 1) !== 0;
      if (entryEncrypted) {
        isEncrypted = true;
      }

      if (entriesList.length < MAX_DISPLAY_ENTRIES) {
        entriesList.push({
          path: entry.entryName,
          name: entry.name || entry.entryName.split('/').filter(Boolean).pop() || '',
          isDirectory: isDir,
          compressedSize: entry.header.compressedSize,
          uncompressedSize: entry.header.size,
          modifiedTime: formatDate(entry.header.time),
          isEncrypted: entryEncrypted,
        });
      }
    }

    result.totalFiles = fileCount;
    result.totalDirs = dirCount;
    result.totalUncompressedSizeBytes = uncompressedSum;
    result.isEncrypted = isEncrypted;
    result.entries = entriesList;

    if (zipEntries.length > MAX_DISPLAY_ENTRIES) {
      result.truncatedNotice = `Displaying first ${MAX_DISPLAY_ENTRIES} entries of ${zipEntries.length} total items.`;
    }

    // Compression ratio: 1 - (compressed / uncompressed)
    if (uncompressedSum > 0) {
      const ratio = ((1 - (totalCompressedSize / uncompressedSum)) * 100);
      result.compressionRatioPercent = Math.max(0, Math.round(ratio * 10) / 10);
    }

    const comment = zip.getZipComment();
    if (comment) {
      result.comment = comment;
    }
  } catch (err: any) {
    if (err && err.message && err.message.toLowerCase().includes('encrypt')) {
      result.isEncrypted = true;
    }
  }

  return result;
}
