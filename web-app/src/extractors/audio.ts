import * as fs from 'fs';
import * as path from 'path';
import { AudioMetadata } from '../shared/types';
import { formatDuration, formatBitrate, formatSampleRate } from '../shared/formatters';

/**
 * Audio Metadata Extractor
 * Parses MP3, WAV, FLAC, OGG, M4A, AAC, Opus
 * Extracts embedded tags (Title, Artist, Album, Year, Genre) and technical specs.
 */
export async function extractAudioMetadata(
  filePath: string,
  fileSizeBytes: number
): Promise<AudioMetadata> {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();

  // Read header (up to 128 KB for tags and initial frames)
  const readSize = Math.min(fileSizeBytes, 128 * 1024);
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

  if (ext === 'mp3') {
    return parseMp3(buffer, fileSizeBytes);
  }
  if (ext === 'wav' || ext === 'wave') {
    return parseWav(buffer, fileSizeBytes);
  }
  if (ext === 'flac') {
    return parseFlac(buffer, fileSizeBytes);
  }
  if (ext === 'ogg' || ext === 'opus' || ext === 'oga') {
    return parseOgg(buffer, fileSizeBytes, ext);
  }
  if (ext === 'm4a' || ext === 'aac') {
    return parseM4a(buffer, fileSizeBytes, ext);
  }

  return {
    durationSeconds: 0,
    durationFormatted: '0:00',
    codec: ext.toUpperCase(),
  };
}

// --- MP3 Parser ---
function parseMp3(buf: Buffer, fileSizeBytes: number): AudioMetadata {
  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;
  let year: string | undefined;
  let genre: string | undefined;
  let trackNumber: number | undefined;

  let offset = 0;
  let id3Size = 0;

  // Check ID3v2 header
  if (buf.slice(0, 3).toString('ascii') === 'ID3' && buf.length >= 10) {
    const version = buf[3];
    const flags = buf[5];
    // Syncsafe integer for size
    id3Size = ((buf[6] & 0x7F) << 21) | ((buf[7] & 0x7F) << 14) | ((buf[8] & 0x7F) << 7) | (buf[9] & 0x7F);
    const tagLimit = Math.min(buf.length, 10 + id3Size);

    offset = 10;
    while (offset + 10 < tagLimit) {
      const frameId = buf.slice(offset, offset + 4).toString('ascii');
      if (frameId.charCodeAt(0) === 0) break; // padding reached

      let frameSize = 0;
      if (version === 4) {
        // ID3v2.4 syncsafe size
        frameSize = ((buf[offset + 4] & 0x7F) << 21) | ((buf[offset + 5] & 0x7F) << 14) | ((buf[offset + 6] & 0x7F) << 7) | (buf[offset + 7] & 0x7F);
      } else {
        // ID3v2.3 32-bit int
        frameSize = buf.readUInt32BE(offset + 4);
      }

      if (frameSize <= 0 || offset + 10 + frameSize > tagLimit) break;

      const frameData = buf.slice(offset + 10, offset + 10 + frameSize);
      const textVal = decodeId3Text(frameData);

      if (frameId === 'TIT2') title = textVal;
      else if (frameId === 'TPE1') artist = textVal;
      else if (frameId === 'TALB') album = textVal;
      else if (frameId === 'TYER' || frameId === 'TDRC') year = textVal;
      else if (frameId === 'TCON') genre = textVal;
      else if (frameId === 'TRCK') trackNumber = parseInt(textVal.split('/')[0], 10) || undefined;

      offset += 10 + frameSize;
    }

    offset = 10 + id3Size;
  }

  // Find first MPEG audio sync word (0xFFE0)
  let bitrateBps = 0;
  let sampleRateHz = 44100;
  let channels = 2;

  const bitratesV1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  const sampleRatesV1 = [44100, 48000, 32000, 0];

  for (let i = offset; i + 4 <= buf.length; i++) {
    if (buf[i] === 0xFF && (buf[i + 1] & 0xE0) === 0xE0) {
      const b1 = buf[i + 1];
      const b2 = buf[i + 2];
      const b3 = buf[i + 3];

      const versionId = (b1 >> 3) & 0x03; // 3 = MPEG-1
      const layerId = (b1 >> 1) & 0x03;   // 1 = Layer III
      const bitrateIdx = (b2 >> 4) & 0x0F;
      const srIdx = (b2 >> 2) & 0x03;
      const channelMode = (b3 >> 6) & 0x03;

      if (versionId === 3 && layerId === 1 && bitrateIdx > 0 && bitrateIdx < 15 && srIdx < 3) {
        bitrateBps = bitratesV1L3[bitrateIdx] * 1000;
        sampleRateHz = sampleRatesV1[srIdx];
        channels = channelMode === 3 ? 1 : 2;
        break;
      }
    }
  }

  const durationSec = (bitrateBps > 0 && fileSizeBytes > id3Size)
    ? parseFloat((((fileSizeBytes - id3Size) * 8) / bitrateBps).toFixed(1))
    : 0;

  return {
    durationSeconds: durationSec,
    durationFormatted: formatDuration(durationSec),
    bitrateBps: bitrateBps || undefined,
    bitrateFormatted: bitrateBps ? formatBitrate(bitrateBps) : undefined,
    sampleRateHz,
    channels,
    channelsFormatted: channels === 1 ? 'Mono (1 channel)' : 'Stereo (2 channels)',
    codec: 'MPEG-1 Layer 3 (MP3)',
    title,
    artist,
    album,
    year,
    genre,
    trackNumber,
  };
}

function decodeId3Text(buf: Buffer): string {
  if (buf.length <= 1) return '';
  const encoding = buf[0];
  const payload = buf.slice(1);
  try {
    if (encoding === 0) return payload.toString('latin1').replace(/\0/g, '').trim();
    if (encoding === 1) return payload.toString('utf16le').replace(/\0/g, '').trim();
    if (encoding === 3) return payload.toString('utf8').replace(/\0/g, '').trim();
  } catch {
    // fallback
  }
  return payload.toString('utf8').replace(/\0/g, '').trim();
}

// --- WAV Parser ---
function parseWav(buf: Buffer, fileSizeBytes: number): AudioMetadata {
  let sampleRateHz = 44100;
  let channels = 2;
  let bitsPerSample = 16;
  let durationSec = 0;
  let bitrateBps = 0;
  let codec = 'PCM Audio (WAV)';

  // Find 'fmt ' chunk
  const fmtIdx = buf.indexOf(Buffer.from('fmt ', 'ascii'));
  if (fmtIdx !== -1 && fmtIdx + 24 <= buf.length) {
    const audioFormat = buf.readUInt16LE(fmtIdx + 8);
    channels = buf.readUInt16LE(fmtIdx + 10);
    sampleRateHz = buf.readUInt32LE(fmtIdx + 12);
    const byteRate = buf.readUInt32LE(fmtIdx + 16);
    bitsPerSample = buf.readUInt16LE(fmtIdx + 22);

    bitrateBps = byteRate * 8;
    if (audioFormat === 3) codec = 'IEEE Float (WAV)';
  }

  // Find 'data' chunk
  const dataIdx = buf.indexOf(Buffer.from('data', 'ascii'));
  if (dataIdx !== -1 && dataIdx + 8 <= buf.length) {
    const dataSize = buf.readUInt32LE(dataIdx + 4);
    if (bitrateBps > 0 && dataSize > 0) {
      durationSec = parseFloat(((dataSize * 8) / bitrateBps).toFixed(2));
    }
  } else if (bitrateBps > 0 && fileSizeBytes > 44) {
    durationSec = parseFloat((((fileSizeBytes - 44) * 8) / bitrateBps).toFixed(2));
  }

  return {
    durationSeconds: durationSec,
    durationFormatted: formatDuration(durationSec),
    bitrateBps: bitrateBps || undefined,
    bitrateFormatted: bitrateBps ? formatBitrate(bitrateBps) : undefined,
    sampleRateHz,
    channels,
    channelsFormatted: channels === 1 ? 'Mono' : channels === 2 ? 'Stereo' : `${channels} Channels`,
    codec: `${codec} ${bitsPerSample}-bit`,
  };
}

// --- FLAC Parser ---
function parseFlac(buf: Buffer, fileSizeBytes: number): AudioMetadata {
  let sampleRateHz = 44100;
  let channels = 2;
  let bitsPerSample = 16;
  let durationSec = 0;
  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;

  // STREAMINFO is always the first metadata block after 'fLaC' (offset 4)
  if (buf.length >= 42 && buf.slice(0, 4).toString('ascii') === 'fLaC') {
    // Offset 18 to 26 contains sample rate, channels, bits per sample, and total samples
    // 20 bits sample rate, 3 bits (channels - 1), 5 bits (bits_per_sample - 1), 36 bits total samples
    const b0 = buf[18];
    const b1 = buf[19];
    const b2 = buf[20];
    sampleRateHz = (b0 << 12) | (b1 << 4) | (b2 >> 4);
    channels = ((b2 >> 1) & 0x07) + 1;
    bitsPerSample = (((b2 & 0x01) << 4) | (buf[21] >> 4)) + 1;

    // Total samples: 4 bits in buf[21] + 32 bits in buf[22..25]
    const totalSamplesHi = buf[21] & 0x0F;
    const totalSamplesLo = buf.readUInt32BE(22);
    const totalSamples = totalSamplesHi * 0x100000000 + totalSamplesLo;

    if (sampleRateHz > 0 && totalSamples > 0) {
      durationSec = parseFloat((totalSamples / sampleRateHz).toFixed(2));
    }
  }

  // Parse VORBIS_COMMENT block if in buffer
  const comments = parseVorbisComments(buf);
  if (comments.TITLE) title = comments.TITLE;
  if (comments.ARTIST) artist = comments.ARTIST;
  if (comments.ALBUM) album = comments.ALBUM;

  const bitrateBps = (durationSec > 0 && fileSizeBytes > 0)
    ? Math.round((fileSizeBytes * 8) / durationSec)
    : undefined;

  return {
    durationSeconds: durationSec,
    durationFormatted: formatDuration(durationSec),
    bitrateBps,
    bitrateFormatted: bitrateBps ? formatBitrate(bitrateBps) : undefined,
    sampleRateHz,
    channels,
    channelsFormatted: channels === 1 ? 'Mono' : channels === 2 ? 'Stereo' : `${channels} Channels`,
    codec: `FLAC (Free Lossless Audio) ${bitsPerSample}-bit`,
    title,
    artist,
    album,
  };
}

// --- OGG / Opus Parser ---
function parseOgg(buf: Buffer, fileSizeBytes: number, ext: string): AudioMetadata {
  let codec = ext === 'opus' ? 'Opus Audio' : 'Ogg Vorbis';
  let channels = 2;
  let sampleRateHz = 48000;

  // Search for OpusHead
  const opusIdx = buf.indexOf(Buffer.from('OpusHead', 'ascii'));
  if (opusIdx !== -1 && opusIdx + 19 <= buf.length) {
    codec = 'Opus Audio';
    channels = buf[opusIdx + 9];
    sampleRateHz = buf.readUInt32LE(opusIdx + 12);
  }

  const comments = parseVorbisComments(buf);

  return {
    durationSeconds: 0,
    durationFormatted: 'Streaming Format',
    sampleRateHz,
    channels,
    channelsFormatted: channels === 1 ? 'Mono' : 'Stereo',
    codec,
    title: comments.TITLE,
    artist: comments.ARTIST,
    album: comments.ALBUM,
    year: comments.DATE,
  };
}

function parseVorbisComments(buf: Buffer): Record<string, string> {
  const result: Record<string, string> = {};
  const vorbisIdx = buf.indexOf(Buffer.from('vorbis', 'ascii'));
  const startIdx = vorbisIdx !== -1 ? vorbisIdx + 6 : buf.indexOf(Buffer.from('OpusTags', 'ascii'));

  if (startIdx !== -1 && startIdx + 8 < buf.length) {
    try {
      const vendorLen = buf.readUInt32LE(startIdx + (buf.indexOf(Buffer.from('OpusTags', 'ascii')) !== -1 ? 8 : 0));
      let off = startIdx + 8 + vendorLen;
      if (off + 4 <= buf.length) {
        const userCommentCount = buf.readUInt32LE(off);
        off += 4;
        for (let i = 0; i < Math.min(userCommentCount, 50); i++) {
          if (off + 4 > buf.length) break;
          const len = buf.readUInt32LE(off);
          off += 4;
          if (off + len > buf.length) break;
          const comment = buf.slice(off, off + len).toString('utf8');
          const eqIdx = comment.indexOf('=');
          if (eqIdx !== -1) {
            const key = comment.slice(0, eqIdx).toUpperCase();
            const val = comment.slice(eqIdx + 1);
            result[key] = val;
          }
          off += len;
        }
      }
    } catch {
      // ignore
    }
  }
  return result;
}

// --- M4A / AAC Parser ---
function parseM4a(buf: Buffer, fileSizeBytes: number, ext: string): AudioMetadata {
  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;
  let year: string | undefined;
  let durationSec = 0;

  // Search for 'mvhd' for duration
  const mvhdIdx = buf.indexOf(Buffer.from('mvhd', 'ascii'));
  if (mvhdIdx >= 4 && mvhdIdx + 24 <= buf.length) {
    const version = buf[mvhdIdx + 4];
    if (version === 0) {
      const timeScale = buf.readUInt32BE(mvhdIdx + 16);
      const duration = buf.readUInt32BE(mvhdIdx + 20);
      if (timeScale > 0) durationSec = parseFloat((duration / timeScale).toFixed(1));
    }
  }

  // Parse iTunes metadata atoms ('©nam', '©ART', '©alb', '©day')
  const readTag = (tagStr: string): string | undefined => {
    const idx = buf.indexOf(Buffer.from(tagStr, 'utf8'));
    if (idx !== -1 && idx + 24 <= buf.length) {
      const atomLen = buf.readUInt32BE(idx - 4);
      const dataIdx = buf.indexOf(Buffer.from('data', 'ascii'), idx);
      if (dataIdx !== -1 && dataIdx + 16 <= buf.length) {
        const dataLen = buf.readUInt32BE(dataIdx - 4);
        if (dataLen > 16) {
          return buf.slice(dataIdx + 12, dataIdx - 4 + dataLen).toString('utf8').trim();
        }
      }
    }
    return undefined;
  };

  title = readTag('©nam');
  artist = readTag('©ART');
  album = readTag('©alb');
  year = readTag('©day');

  const bitrateBps = (durationSec > 0 && fileSizeBytes > 0)
    ? Math.round((fileSizeBytes * 8) / durationSec)
    : undefined;

  return {
    durationSeconds: durationSec,
    durationFormatted: formatDuration(durationSec),
    bitrateBps,
    bitrateFormatted: bitrateBps ? formatBitrate(bitrateBps) : undefined,
    sampleRateHz: 44100,
    channels: 2,
    channelsFormatted: 'Stereo',
    codec: 'Advanced Audio Coding (AAC / ALAC)',
    title,
    artist,
    album,
    year,
  };
}
