import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { VideoMetadata } from '../shared/types';
import { formatDuration, formatBitrate, calculateAspectRatio } from '../shared/formatters';

/**
 * Video Metadata Extractor
 * Hybrid extractor:
 * 1. Attempts FFprobe execution (bundled in resources or in PATH)
 * 2. High-performance native fallback for MP4, MOV, MKV, WebM, and AVI container parsing
 */
export async function extractVideoMetadata(
  filePath: string,
  fileSizeBytes: number
): Promise<VideoMetadata> {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();

  // Try FFprobe first if available
  const ffprobeResult = await tryExtractWithFfprobe(filePath);
  if (ffprobeResult) {
    return ffprobeResult;
  }

  // Fallback to pure Node container parser
  return extractVideoNative(filePath, fileSizeBytes, ext);
}

/**
 * Attempt to invoke FFprobe
 */
function tryExtractWithFfprobe(filePath: string): Promise<VideoMetadata | null> {
  return new Promise((resolve) => {
    // Check possible locations: process.resourcesPath/bin/ffprobe.exe, ./bin/ffprobe.exe, or system PATH
    const possiblePaths = [
      path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'),
      process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe',
    ];

    const probeBin = possiblePaths[0];
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    execFile(probeBin, args, { timeout: 10000 }, (err, stdout) => {
      if (err || !stdout) {
        // Try system ffprobe as fallback
        execFile('ffprobe', args, { timeout: 10000 }, (err2, stdout2) => {
          if (err2 || !stdout2) {
            return resolve(null);
          }
          try {
            const data = JSON.parse(stdout2);
            resolve(mapFfprobeOutput(data));
          } catch {
            resolve(null);
          }
        });
        return;
      }

      try {
        const data = JSON.parse(stdout);
        resolve(mapFfprobeOutput(data));
      } catch {
        resolve(null);
      }
    });
  });
}

function mapFfprobeOutput(data: any): VideoMetadata | null {
  if (!data || !data.format) return null;

  const durationSec = parseFloat(data.format.duration || '0');
  const bitrate = parseInt(data.format.bit_rate || '0', 10);

  const streams = data.streams || [];
  const videoStream = streams.find((s: any) => s.codec_type === 'video');
  const audioStream = streams.find((s: any) => s.codec_type === 'audio');

  let width = videoStream?.width;
  let height = videoStream?.height;
  let fps: number | undefined;

  if (videoStream?.r_frame_rate) {
    const parts = videoStream.r_frame_rate.split('/');
    if (parts.length === 2 && parseFloat(parts[1]) > 0) {
      fps = parseFloat((parseFloat(parts[0]) / parseFloat(parts[1])).toFixed(2));
    }
  }

  return {
    durationSeconds: durationSec,
    durationFormatted: formatDuration(durationSec),
    width,
    height,
    resolution: width && height ? `${width} × ${height}` : undefined,
    aspectRatio: width && height ? calculateAspectRatio(width, height) : undefined,
    videoCodec: videoStream?.codec_name ? videoStream.codec_name.toUpperCase() : undefined,
    audioCodec: audioStream?.codec_name ? audioStream.codec_name.toUpperCase() : undefined,
    frameRate: fps,
    frameRateFormatted: fps ? `${fps} fps` : undefined,
    bitrateBps: bitrate || undefined,
    bitrateFormatted: bitrate ? formatBitrate(bitrate) : undefined,
    containerFormat: data.format.format_long_name || data.format.format_name || 'Video',
    channels: audioStream?.channels,
    audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate, 10) : undefined,
  };
}

/**
 * Pure Node Container Extractor for MP4, MOV, MKV, WebM, AVI
 */
async function extractVideoNative(
  filePath: string,
  fileSizeBytes: number,
  ext: string
): Promise<VideoMetadata> {
  const readSize = Math.min(fileSizeBytes, 256 * 1024); // read first 256 KB
  const buffer = Buffer.alloc(readSize);

  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, readSize, 0);
  } catch {
    // ignore
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }

  if (ext === 'mp4' || ext === 'mov' || ext === 'm4v') {
    return parseMp4Atoms(buffer, fileSizeBytes, ext);
  }

  if (ext === 'mkv' || ext === 'webm') {
    return parseEbmlHeader(buffer, fileSizeBytes, ext);
  }

  if (ext === 'avi') {
    return parseAviRiff(buffer, fileSizeBytes);
  }

  return {
    durationSeconds: 0,
    durationFormatted: '0:00',
    containerFormat: ext.toUpperCase(),
  };
}

/**
 * MP4 / QuickTime ISO BMFF Box Parser
 */
function parseMp4Atoms(buf: Buffer, fileSizeBytes: number, ext: string): VideoMetadata {
  let durationSec = 0;
  let width = 0;
  let height = 0;
  let videoCodec: string | undefined = undefined;
  let audioCodec: string | undefined = undefined;

  // Search for 'mvhd' (Movie Header Box)
  const mvhdIdx = buf.indexOf(Buffer.from('mvhd', 'ascii'));
  if (mvhdIdx >= 4 && mvhdIdx + 24 <= buf.length) {
    const version = buf[mvhdIdx + 4];
    if (version === 0) {
      const timeScale = buf.readUInt32BE(mvhdIdx + 16);
      const duration = buf.readUInt32BE(mvhdIdx + 20);
      if (timeScale > 0) {
        durationSec = parseFloat((duration / timeScale).toFixed(2));
      }
    } else if (version === 1 && mvhdIdx + 36 <= buf.length) {
      const timeScale = buf.readUInt32BE(mvhdIdx + 24);
      // 64-bit duration
      const durationHi = buf.readUInt32BE(mvhdIdx + 28);
      const durationLo = buf.readUInt32BE(mvhdIdx + 32);
      const duration = durationHi * 0x100000000 + durationLo;
      if (timeScale > 0) {
        durationSec = parseFloat((duration / timeScale).toFixed(2));
      }
    }
  }

  // Search for 'tkhd' (Track Header Box) to extract display dimensions
  let tkhdIdx = 0;
  while ((tkhdIdx = buf.indexOf(Buffer.from('tkhd', 'ascii'), tkhdIdx + 1)) !== -1) {
    if (tkhdIdx + 84 <= buf.length) {
      // Dimensions are stored as 16.16 fixed-point numbers at the end of tkhd
      const w = buf.readUInt32BE(tkhdIdx + 76) >> 16;
      const h = buf.readUInt32BE(tkhdIdx + 80) >> 16;
      if (w > 0 && h > 0 && (w > width || h > height)) {
        width = w;
        height = h;
      }
    }
  }

  // Detect codecs
  if (buf.indexOf(Buffer.from('avc1', 'ascii')) !== -1) videoCodec = 'H.264 / AVC';
  else if (buf.indexOf(Buffer.from('hvc1', 'ascii')) !== -1 || buf.indexOf(Buffer.from('hev1', 'ascii')) !== -1) videoCodec = 'H.265 / HEVC';
  else if (buf.indexOf(Buffer.from('vp09', 'ascii')) !== -1) videoCodec = 'VP9';
  else if (buf.indexOf(Buffer.from('av01', 'ascii')) !== -1) videoCodec = 'AV1';

  if (buf.indexOf(Buffer.from('mp4a', 'ascii')) !== -1) audioCodec = 'AAC';
  else if (buf.indexOf(Buffer.from('ac-3', 'ascii')) !== -1) audioCodec = 'Dolby Digital AC-3';
  else if (buf.indexOf(Buffer.from('Opus', 'ascii')) !== -1) audioCodec = 'Opus';

  const bitrate = (durationSec > 0 && fileSizeBytes > 0)
    ? Math.round((fileSizeBytes * 8) / durationSec)
    : undefined;

  return {
    durationSeconds: durationSec,
    durationFormatted: formatDuration(durationSec),
    width: width || undefined,
    height: height || undefined,
    resolution: width && height ? `${width} × ${height}` : undefined,
    aspectRatio: width && height ? calculateAspectRatio(width, height) : undefined,
    videoCodec: videoCodec || 'MPEG-4 Video',
    audioCodec,
    bitrateBps: bitrate,
    bitrateFormatted: bitrate ? formatBitrate(bitrate) : undefined,
    containerFormat: ext === 'mov' ? 'QuickTime Movie (MOV)' : 'MPEG-4 Part 14 (MP4)',
  };
}

/**
 * Matroska / WebM EBML Parser
 */
function parseEbmlHeader(buf: Buffer, fileSizeBytes: number, ext: string): VideoMetadata {
  let videoCodec: string | undefined = undefined;
  let audioCodec: string | undefined = undefined;
  let width: number | undefined = undefined;
  let height: number | undefined = undefined;

  // Search for PixelWidth (0xB0) and PixelHeight (0xBA)
  const pwIdx = buf.indexOf(Buffer.from([0xB0]));
  if (pwIdx !== -1 && pwIdx + 3 <= buf.length) {
    const len = buf[pwIdx + 1];
    if (len === 1) width = buf[pwIdx + 2];
    else if (len === 2) width = buf.readUInt16BE(pwIdx + 2);
  }

  const phIdx = buf.indexOf(Buffer.from([0xBA]));
  if (phIdx !== -1 && phIdx + 3 <= buf.length) {
    const len = buf[phIdx + 1];
    if (len === 1) height = buf[phIdx + 2];
    else if (len === 2) height = buf.readUInt16BE(phIdx + 2);
  }

  if (buf.indexOf(Buffer.from('V_MPEG4/ISO/AVC', 'ascii')) !== -1) videoCodec = 'H.264 / AVC';
  else if (buf.indexOf(Buffer.from('V_MPEGH/ISO/HEVC', 'ascii')) !== -1) videoCodec = 'H.265 / HEVC';
  else if (buf.indexOf(Buffer.from('V_VP8', 'ascii')) !== -1) videoCodec = 'VP8';
  else if (buf.indexOf(Buffer.from('V_VP9', 'ascii')) !== -1) videoCodec = 'VP9';
  else if (buf.indexOf(Buffer.from('V_AV1', 'ascii')) !== -1) videoCodec = 'AV1';

  if (buf.indexOf(Buffer.from('A_AAC', 'ascii')) !== -1) audioCodec = 'AAC';
  else if (buf.indexOf(Buffer.from('A_OPUS', 'ascii')) !== -1) audioCodec = 'Opus';
  else if (buf.indexOf(Buffer.from('A_VORBIS', 'ascii')) !== -1) audioCodec = 'Vorbis';
  else if (buf.indexOf(Buffer.from('A_FLAC', 'ascii')) !== -1) audioCodec = 'FLAC';

  return {
    durationSeconds: 0,
    durationFormatted: 'Available via stream',
    width,
    height,
    resolution: width && height ? `${width} × ${height}` : undefined,
    aspectRatio: width && height ? calculateAspectRatio(width, height) : undefined,
    videoCodec: videoCodec || (ext === 'webm' ? 'VP8 / VP9' : 'Matroska Video'),
    audioCodec: audioCodec || (ext === 'webm' ? 'Opus / Vorbis' : undefined),
    containerFormat: ext === 'webm' ? 'WebM Container' : 'Matroska Video (MKV)',
  };
}

/**
 * AVI RIFF Parser
 */
function parseAviRiff(buf: Buffer, fileSizeBytes: number): VideoMetadata {
  let durationSec = 0;
  let width = 0;
  let height = 0;
  let fps = 0;

  // Search for 'avih' chunk (Main AVI Header)
  const avihIdx = buf.indexOf(Buffer.from('avih', 'ascii'));
  if (avihIdx !== -1 && avihIdx + 48 <= buf.length) {
    const microSecPerFrame = buf.readUInt32LE(avihIdx + 8);
    const totalFrames = buf.readUInt32LE(avihIdx + 24);
    width = buf.readUInt32LE(avihIdx + 36);
    height = buf.readUInt32LE(avihIdx + 40);

    if (microSecPerFrame > 0) {
      fps = parseFloat((1_000_000 / microSecPerFrame).toFixed(2));
      durationSec = parseFloat(((totalFrames * microSecPerFrame) / 1_000_000).toFixed(2));
    }
  }

  const bitrate = (durationSec > 0 && fileSizeBytes > 0)
    ? Math.round((fileSizeBytes * 8) / durationSec)
    : undefined;

  return {
    durationSeconds: durationSec,
    durationFormatted: formatDuration(durationSec),
    width: width || undefined,
    height: height || undefined,
    resolution: width && height ? `${width} × ${height}` : undefined,
    aspectRatio: width && height ? calculateAspectRatio(width, height) : undefined,
    frameRate: fps || undefined,
    frameRateFormatted: fps ? `${fps} fps` : undefined,
    bitrateBps: bitrate,
    bitrateFormatted: bitrate ? formatBitrate(bitrate) : undefined,
    containerFormat: 'Audio Video Interleave (AVI)',
  };
}
