import * as fs from 'fs';
import * as mm from 'music-metadata';
import { VideoMetadata } from '../../shared/types';
import { formatDuration } from '../../shared/formatters';

export async function extractVideoMetadata(filePath: string, detectedFormat: string): Promise<VideoMetadata> {
  const result: VideoMetadata = {
    durationSeconds: 0,
    durationFormatted: '00:00',
    resolution: 'Unknown',
    videoCodec: 'Video Stream',
    containerFormat: detectedFormat,
  };

  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    const fmt = metadata.format;

    if (fmt.duration) {
      result.durationSeconds = Math.round(fmt.duration * 10) / 10;
      result.durationFormatted = formatDuration(result.durationSeconds);
    }

    if (fmt.bitrate) {
      result.bitrateKbps = Math.round(fmt.bitrate / 1000);
    }

    if (fmt.container) {
      result.containerFormat = fmt.container;
    }

    if (fmt.codec) {
      result.videoCodec = fmt.codec;
    }

    if (fmt.numberOfChannels) {
      result.audioChannels = fmt.numberOfChannels;
    }

    if (fmt.sampleRate) {
      result.audioSampleRate = fmt.sampleRate;
    }

    // Attempt to inspect resolution from MP4 or MKV if not populated
    const dimensions = await inspectVideoDimensions(filePath);
    if (dimensions.width && dimensions.height) {
      result.width = dimensions.width;
      result.height = dimensions.height;
      result.resolution = `${dimensions.width} x ${dimensions.height}`;
    }
  } catch {
    // If music-metadata fails or video has non-standard headers
    const dimensions = await inspectVideoDimensions(filePath);
    if (dimensions.width && dimensions.height) {
      result.width = dimensions.width;
      result.height = dimensions.height;
      result.resolution = `${dimensions.width} x ${dimensions.height}`;
    }
  }

  return result;
}

/**
 * Fast header scanner for MP4 tkhd or general video atoms without external binary
 */
async function inspectVideoDimensions(filePath: string): Promise<{ width?: number; height?: number }> {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    fileHandle = await fs.promises.open(filePath, 'r');
    const buf = Buffer.alloc(131072); // Read first 128KB
    const { bytesRead } = await fileHandle.read(buf, 0, 131072, 0);

    // Look for 'tkhd' in MP4
    const tkhdIndex = buf.indexOf(Buffer.from('tkhd'));
    if (tkhdIndex !== -1 && tkhdIndex + 84 <= bytesRead) {
      const version = buf[tkhdIndex + 4];
      const offset = version === 1 ? tkhdIndex + 88 : tkhdIndex + 76;
      if (offset + 8 <= bytesRead) {
        const width = buf.readUInt32BE(offset) >> 16;
        const height = buf.readUInt32BE(offset + 4) >> 16;
        if (width > 0 && width < 16384 && height > 0 && height < 16384) {
          return { width, height };
        }
      }
    }

    // Look for MKV / WebM PixelWidth (0xb0) and PixelHeight (0xba)
    const pixelWidthIndex = buf.indexOf(Buffer.from([0xb0]));
    if (pixelWidthIndex !== -1 && pixelWidthIndex + 4 < bytesRead) {
      const wLen = buf[pixelWidthIndex + 1];
      if (wLen === 1 || wLen === 2) {
        const width = wLen === 1 ? buf[pixelWidthIndex + 2] : buf.readUInt16BE(pixelWidthIndex + 2);
        const pixelHeightIndex = buf.indexOf(Buffer.from([0xba]), pixelWidthIndex);
        if (pixelHeightIndex !== -1 && pixelHeightIndex + 4 < bytesRead) {
          const hLen = buf[pixelHeightIndex + 1];
          const height = hLen === 1 ? buf[pixelHeightIndex + 2] : buf.readUInt16BE(pixelHeightIndex + 2);
          if (width > 0 && height > 0) {
            return { width, height };
          }
        }
      }
    }
  } catch {
    // Non-fatal
  } finally {
    if (fileHandle) {
      await fileHandle.close().catch(() => {});
    }
  }
  return {};
}
