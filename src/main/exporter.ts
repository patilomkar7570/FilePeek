import * as fs from 'fs';
import * as path from 'path';
import { dialog, shell, BrowserWindow } from 'electron';
import { FileInspectionResult } from '../shared/types';
import { formatExactBytes } from '../shared/formatters';

export function generateTextReport(result: FileInspectionResult): string {
  const g = result.general;
  const v = result.verification;
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('                   FILEPEEK INSPECTION REPORT                   ');
  lines.push('================================================================');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Application: FilePeek v1.0.0 (Local Privacy-Focused Inspector)`);
  lines.push('');
  lines.push('--- [GENERAL FILE INFORMATION] ---------------------------------');
  lines.push(`File Name:       ${g.fileName}`);
  lines.push(`Extension:       ${g.fileExtension || '(none)'}`);
  lines.push(`Detected Format: ${g.detectedFormat}`);
  lines.push(`MIME Type:       ${g.mimeType}`);
  lines.push(`Category:        ${result.category.toUpperCase()}`);
  lines.push(`File Size:       ${g.sizeFormatted} (${formatExactBytes(g.sizeBytes)})`);
  lines.push(`Full Path:       ${g.filePath}`);
  lines.push(`Directory:       ${g.directory}`);
  lines.push(`Created:         ${g.createdTime || 'Unknown'}`);
  lines.push(`Modified:        ${g.modifiedTime || 'Unknown'}`);
  lines.push(`Last Accessed:   ${g.accessedTime || 'Unknown'}`);
  lines.push(`Read-Only:       ${g.isReadOnly ? 'Yes' : 'No'}`);
  lines.push('');

  lines.push('--- [FILE SIGNATURE & FORMAT VERIFICATION] ---------------------');
  lines.push(`Signature Status:   ${v.isUnknownFormat ? 'Unrecognized Signature' : 'Recognized'}`);
  lines.push(`Header Hex Bytes:   ${v.magicSignatureHex || 'N/A'}`);
  lines.push(`Header ASCII:       ${v.magicSignatureAscii || 'N/A'}`);
  lines.push(`Extension Match:    ${v.isMismatch ? 'MISMATCH DETECTED' : 'Verified Consistent'}`);
  if (v.isMismatch && v.warningMessage) {
    lines.push(`WARNING:            ${v.warningMessage}`);
  }
  lines.push('');

  if (result.image) {
    const img = result.image;
    lines.push('--- [IMAGE TECHNICAL METADATA] ---------------------------------');
    lines.push(`Dimensions:      ${img.width} x ${img.height} pixels`);
    lines.push(`Aspect Ratio:    ${img.aspectRatio}`);
    lines.push(`Format:          ${img.format}`);
    if (img.bitDepth) lines.push(`Bit Depth:       ${img.bitDepth}-bit`);
    if (img.colorSpace) lines.push(`Color Space:     ${img.colorSpace}`);
    if (img.orientation) lines.push(`Orientation:     ${img.orientation}`);

    if (img.camera) {
      lines.push('--- Camera Optics & EXIF Details:');
      if (img.camera.make || img.camera.model) lines.push(`Camera:          ${[img.camera.make, img.camera.model].filter(Boolean).join(' ')}`);
      if (img.camera.lens) lines.push(`Lens:            ${img.camera.lens}`);
      if (img.camera.focalLength) lines.push(`Focal Length:    ${img.camera.focalLength}`);
      if (img.camera.fNumber) lines.push(`Aperture:        ${img.camera.fNumber}`);
      if (img.camera.exposureTime) lines.push(`Exposure Time:   ${img.camera.exposureTime}`);
      if (img.camera.iso) lines.push(`ISO Sensitivity: ${img.camera.iso}`);
      if (img.camera.dateTimeOriginal) lines.push(`Original Date:   ${img.camera.dateTimeOriginal}`);
    }
    lines.push('');
  }

  if (result.video) {
    const vid = result.video;
    lines.push('--- [VIDEO TECHNICAL METADATA] ---------------------------------');
    lines.push(`Duration:        ${vid.durationFormatted} (${vid.durationSeconds} s)`);
    lines.push(`Resolution:      ${vid.resolution}`);
    lines.push(`Video Codec:     ${vid.videoCodec}`);
    lines.push(`Container:       ${vid.containerFormat}`);
    if (vid.bitrateKbps) lines.push(`Bitrate:         ${vid.bitrateKbps} kbps`);
    if (vid.audioChannels) lines.push(`Audio Channels:  ${vid.audioChannels}`);
    if (vid.audioSampleRate) lines.push(`Sample Rate:     ${vid.audioSampleRate} Hz`);
    lines.push('');
  }

  if (result.audio) {
    const aud = result.audio;
    lines.push('--- [AUDIO TECHNICAL METADATA] ---------------------------------');
    lines.push(`Duration:        ${aud.durationFormatted} (${aud.durationSeconds} s)`);
    lines.push(`Codec:           ${aud.codec}`);
    if (aud.bitrateKbps) lines.push(`Bitrate:         ${aud.bitrateKbps} kbps`);
    if (aud.sampleRateHz) lines.push(`Sample Rate:     ${aud.sampleRateHz} Hz`);
    if (aud.channelLayout) lines.push(`Channel Layout:  ${aud.channelLayout}`);
    if (aud.artist) lines.push(`Artist:          ${aud.artist}`);
    if (aud.title) lines.push(`Title:           ${aud.title}`);
    if (aud.album) lines.push(`Album:           ${aud.album}`);
    if (aud.genre) lines.push(`Genre:           ${aud.genre}`);
    if (aud.year) lines.push(`Year:            ${aud.year}`);
    lines.push('');
  }

  if (result.pdf) {
    const pdf = result.pdf;
    lines.push('--- [PDF DOCUMENT METADATA] ------------------------------------');
    lines.push(`Total Pages:     ${pdf.pageCount}`);
    if (pdf.pdfVersion) lines.push(`PDF Version:     ${pdf.pdfVersion}`);
    if (pdf.title) lines.push(`Document Title:  ${pdf.title}`);
    if (pdf.author) lines.push(`Author:          ${pdf.author}`);
    if (pdf.subject) lines.push(`Subject:         ${pdf.subject}`);
    if (pdf.creator) lines.push(`Creator Tool:    ${pdf.creator}`);
    if (pdf.producer) lines.push(`Producer:        ${pdf.producer}`);
    if (pdf.creationDate) lines.push(`Creation Date:   ${pdf.creationDate}`);
    if (pdf.modificationDate) lines.push(`Modified Date:   ${pdf.modificationDate}`);
    lines.push('');
  }

  if (result.archive) {
    const arc = result.archive;
    lines.push('--- [ARCHIVE STRUCTURE & COMPRESSION] --------------------------');
    lines.push(`Archive Type:    ${arc.format}`);
    lines.push(`Total Files:     ${arc.totalFiles}`);
    lines.push(`Total Folders:   ${arc.totalDirs}`);
    lines.push(`Compressed Size: ${formatExactBytes(arc.totalCompressedSizeBytes)}`);
    lines.push(`Uncompressed:    ${formatExactBytes(arc.totalUncompressedSizeBytes)}`);
    lines.push(`Ratio:           ${arc.compressionRatioPercent}% compression`);
    lines.push(`Encrypted:       ${arc.isEncrypted ? 'Yes (Password Protected)' : 'No'}`);
    if (arc.comment) lines.push(`Zip Comment:     ${arc.comment}`);
    lines.push(`Listing (${arc.entries.length} items):`);
    for (const item of arc.entries.slice(0, 30)) {
      lines.push(`  ${item.isDirectory ? '[DIR] ' : '      '}${item.path} (${item.uncompressedSize} bytes)`);
    }
    if (arc.truncatedNotice) {
      lines.push(`  ... ${arc.truncatedNotice}`);
    }
    lines.push('');
  }

  if (result.hashes) {
    const h = result.hashes;
    lines.push('--- [CRYPTOGRAPHIC HASH VERIFICATION] --------------------------');
    if (h.sha256) lines.push(`SHA-256 (Standard): ${h.sha256}`);
    if (h.sha1) lines.push(`SHA-1   (Legacy):   ${h.sha1}`);
    if (h.md5) lines.push(`MD5     (Legacy):   ${h.md5}`);
    lines.push('');
  }

  lines.push('================================================================');
  lines.push('                  END OF FILEPEEK REPORT                        ');
  lines.push('================================================================');

  return lines.join('\r\n');
}

export function generateJsonReport(result: FileInspectionResult): string {
  // Create sanitized clone without huge base64 previews
  const sanitized = JSON.parse(JSON.stringify(result));
  if (sanitized.image?.previewUrl) {
    sanitized.image.previewUrl = '[Preview omitted from report]';
  }
  if (sanitized.audio?.coverArtUrl) {
    sanitized.audio.coverArtUrl = '[Cover art omitted from report]';
  }
  return JSON.stringify(sanitized, null, 2);
}

export async function exportReportToFile(
  window: BrowserWindow | null,
  format: 'txt' | 'json',
  result: FileInspectionResult
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const baseName = path.parse(result.general.fileName).name || 'file';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `${baseName}_filepeek_report_${timestamp}.${format}`;

    const { canceled, filePath } = await dialog.showSaveDialog(window || undefined as any, {
      title: `Export Inspection Report (${format.toUpperCase()})`,
      defaultPath: defaultFilename,
      filters: [
        format === 'json'
          ? { name: 'JSON Document (*.json)', extensions: ['json'] }
          : { name: 'Text Report (*.txt)', extensions: ['txt'] },
      ],
    });

    if (canceled || !filePath) {
      return { success: false };
    }

    const content = format === 'json' ? generateJsonReport(result) : generateTextReport(result);
    await fs.promises.writeFile(filePath, content, 'utf8');

    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to export report' };
  }
}

export async function openFileWithDefaultApp(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist on disk.');
  }
  // shell.openPath opens using the default registered Windows application
  const result = await shell.openPath(filePath);
  return result; // Empty string on success, or error message
}

export function revealInExplorer(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  shell.showItemInFolder(filePath);
  return true;
}
