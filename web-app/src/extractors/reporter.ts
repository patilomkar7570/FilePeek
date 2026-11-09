import { FileInspectionResult } from '../shared/types';

/**
 * Report Generation Utilities for FilePeek
 * Produces clean TXT and structured JSON reports including forensic intelligence.
 */

export function generateTextReport(result: FileInspectionResult): string {
  const { general, format, technical, hashes, forensics, inspectedAt } = result;

  const lines: string[] = [];
  const divider = '='.repeat(75);
  const subDivider = '-'.repeat(75);

  lines.push(divider);
  lines.push(' FILEPEEK FORENSIC & TECHNICAL INSPECTION REPORT');
  lines.push(` Generated: ${inspectedAt}`);
  lines.push(divider);
  lines.push('');

  // 1. General Information
  lines.push('--- GENERAL FILE INFORMATION ---');
  lines.push(`File Name:         ${general.fileName}`);
  lines.push(`File Location:     ${general.filePath}`);
  lines.push(`File Size:         ${general.fileSizeFormatted} (${general.fileSizeBytes.toLocaleString()} bytes)`);
  lines.push(`Extension:         ${general.fileExtension || '(none)'}`);
  lines.push(`Detected Format:   ${format.detectedFormat}`);
  lines.push(`MIME Type:         ${format.detectedMime}`);
  lines.push(`Detection Conf.:   ${format.confidence.toUpperCase()}`);
  if (format.magicBytesHex) {
    lines.push(`Magic Bytes (Hex): ${format.magicBytesHex}`);
    lines.push(`Magic Bytes (Txt): ${format.magicBytesAscii}`);
  }
  if (format.isExtensionMismatch) {
    lines.push(`WARNING:           ${format.mismatchWarning || 'Extension does not match detected magic bytes!'}`);
  }
  lines.push(`Created:           ${general.creationTimeFormatted}`);
  lines.push(`Last Modified:     ${general.lastModifiedTimeFormatted}`);
  lines.push(`Last Accessed:     ${general.lastAccessedTimeFormatted}`);
  lines.push(`Attributes:        ${general.isReadOnly ? 'Read-Only' : 'Read/Write'}${general.isHidden ? ', Hidden' : ''}`);
  lines.push('');

  // 2. Forensic Intelligence (Hidden from Windows Explorer)
  if (forensics) {
    lines.push('--- FORENSIC & STRUCTURAL INTELLIGENCE (HIDDEN FROM EXPLORER) ---');
    lines.push(`Shannon Entropy:   ${forensics.entropy.score} / 8.000 bits/byte`);
    lines.push(`Entropy Rating:    ${forensics.entropy.rating}`);
    lines.push(`Entropy Analysis:  ${forensics.entropy.assessment}`);
    lines.push(`Byte Density:      Null: ${forensics.byteDistribution.nullByteRatio}% | ASCII: ${forensics.byteDistribution.printableAsciiRatio}% | Binary: ${forensics.byteDistribution.highBinaryRatio}%`);
    lines.push(`Text Encoding:     ${forensics.textEncoding.detectedEncoding}`);
    lines.push(`BOM Header:        ${forensics.textEncoding.hasBOM ? forensics.textEncoding.bomName : 'No BOM'}`);
    lines.push(`Line Endings:      ${forensics.textEncoding.lineEndingType} (CRLF: ${forensics.textEncoding.crlfCount}, LF: ${forensics.textEncoding.lfCount})`);

    if (forensics.peBinary && forensics.peBinary.isPe) {
      lines.push('');
      lines.push('Windows PE Executable Architecture & Security Flags:');
      lines.push(`  Machine Target:  ${forensics.peBinary.machineArchitecture || 'N/A'}`);
      lines.push(`  Subsystem:       ${forensics.peBinary.subsystem || 'N/A'}`);
      lines.push(`  Sections Count:  ${forensics.peBinary.sectionsCount || 'N/A'}`);
      lines.push(`  Entry Point:     ${forensics.peBinary.entryPointRva || 'N/A'}`);
      lines.push(`  Linker:          ${forensics.peBinary.linkerVersion || 'N/A'}`);
      lines.push(`  Security Flags:  ${forensics.peBinary.characteristics?.join(', ') || 'None detected'}`);
    }

    if (forensics.hexDump && forensics.forensics?.hexDump.length > 0 || forensics.hexDump.length > 0) {
      lines.push('');
      lines.push('Raw Binary Header Hex Dump (First 64 Bytes):');
      for (const row of forensics.hexDump) {
        lines.push(`  ${row.offset}:  ${row.hex}  |${row.ascii}|`);
      }
    }
    lines.push('');
  }

  // 3. Technical Category Details
  lines.push('--- TECHNICAL METADATA ---');
  lines.push(`Category:          ${format.category.toUpperCase()}`);

  if (technical.image) {
    const img = technical.image;
    lines.push(`Dimensions:        ${img.width} × ${img.height} pixels`);
    lines.push(`Aspect Ratio:      ${img.aspectRatio}`);
    if (img.colorSpace) lines.push(`Color Space:       ${img.colorSpace}`);
    if (img.bitDepth) lines.push(`Bit Depth:         ${img.bitDepth}-bit`);
    if (img.hasAlpha !== undefined) lines.push(`Alpha Channel:     ${img.hasAlpha ? 'Present' : 'None'}`);
    if (img.cameraMake || img.cameraModel) {
      lines.push(`Camera:            ${[img.cameraMake, img.cameraModel].filter(Boolean).join(' ')}`);
    }
    if (img.lensModel) lines.push(`Lens:              ${img.lensModel}`);
    if (img.dateTimeOriginal) lines.push(`Date Taken:        ${img.dateTimeOriginal}`);
    if (img.iso) lines.push(`ISO Speed:         ${img.iso}`);
    if (img.fNumber) lines.push(`Aperture:          f/${img.fNumber}`);
    if (img.exposureTime) lines.push(`Exposure:          ${img.exposureTime}`);
    if (img.focalLength) lines.push(`Focal Length:      ${img.focalLength}`);
    if (img.software) lines.push(`Software:          ${img.software}`);
  } else if (technical.video) {
    const vid = technical.video;
    lines.push(`Duration:          ${vid.durationFormatted} (${vid.durationSeconds}s)`);
    if (vid.resolution) lines.push(`Resolution:        ${vid.resolution}`);
    if (vid.aspectRatio) lines.push(`Aspect Ratio:      ${vid.aspectRatio}`);
    if (vid.videoCodec) lines.push(`Video Codec:       ${vid.videoCodec}`);
    if (vid.audioCodec) lines.push(`Audio Codec:       ${vid.audioCodec}`);
    if (vid.frameRateFormatted) lines.push(`Frame Rate:        ${vid.frameRateFormatted}`);
    if (vid.bitrateFormatted) lines.push(`Bitrate:           ${vid.bitrateFormatted}`);
    lines.push(`Container:         ${vid.containerFormat}`);
  } else if (technical.audio) {
    const aud = technical.audio;
    lines.push(`Duration:          ${aud.durationFormatted}`);
    lines.push(`Codec:             ${aud.codec}`);
    if (aud.title) lines.push(`Title:             ${aud.title}`);
    if (aud.artist) lines.push(`Artist:            ${aud.artist}`);
    if (aud.album) lines.push(`Album:             ${aud.album}`);
    if (aud.year) lines.push(`Year:              ${aud.year}`);
    if (aud.genre) lines.push(`Genre:             ${aud.genre}`);
    if (aud.trackNumber) lines.push(`Track Number:      ${aud.trackNumber}`);
    if (aud.bitrateFormatted) lines.push(`Bitrate:           ${aud.bitrateFormatted}`);
    if (aud.sampleRateHz) lines.push(`Sample Rate:       ${aud.sampleRateHz} Hz`);
    if (aud.channelsFormatted) lines.push(`Channels:          ${aud.channelsFormatted}`);
  } else if (technical.pdf) {
    const pdf = technical.pdf;
    lines.push(`PDF Version:       ${pdf.pdfVersion || 'Unknown'}`);
    lines.push(`Page Count:        ${pdf.pageCount}`);
    if (pdf.title) lines.push(`Title:             ${pdf.title}`);
    if (pdf.author) lines.push(`Author:            ${pdf.author}`);
    if (pdf.subject) lines.push(`Subject:           ${pdf.subject}`);
    if (pdf.creator) lines.push(`Creator:           ${pdf.creator}`);
    if (pdf.producer) lines.push(`Producer:          ${pdf.producer}`);
    if (pdf.creationDate) lines.push(`Creation Date:     ${pdf.creationDate}`);
    if (pdf.modificationDate) lines.push(`Modification Date: ${pdf.modificationDate}`);
    lines.push(`Encrypted:         ${pdf.isEncrypted ? 'Yes (Password Protected)' : 'No'}`);
  } else if (technical.archive) {
    const arc = technical.archive;
    lines.push(`Format:            ${arc.archiveFormat}`);
    lines.push(`Contained Files:   ${arc.fileCount.toLocaleString()}`);
    lines.push(`Contained Folders: ${arc.folderCount.toLocaleString()}`);
    lines.push(`Compressed Size:   ${arc.totalCompressedSizeFormatted}`);
    lines.push(`Uncompressed Size: ${arc.totalUncompressedSizeFormatted}`);
    lines.push(`Compression Ratio: ${arc.compressionRatio}%`);
    lines.push(`Encrypted Entries: ${arc.isEncrypted ? 'Yes' : 'None detected'}`);
    if (arc.warning) lines.push(`Archive Notice:    ${arc.warning}`);
  } else {
    lines.push(technical.notes || 'Detailed metadata is unavailable for this file type.');
  }
  lines.push('');

  // 4. Cryptographic Hashes
  lines.push('--- FILE VERIFICATION & HASHES ---');
  if (hashes.sha256) {
    lines.push(`SHA-256 (Recommended): ${hashes.sha256.hash}`);
  }
  if (hashes.sha1) {
    lines.push(`SHA-1 (Legacy):        ${hashes.sha1.hash}`);
  }
  if (hashes.md5) {
    lines.push(`MD5 (Legacy):          ${hashes.md5.hash}`);
  }
  lines.push('');
  lines.push(subDivider);
  lines.push('FilePeek - Know Everything About Your Files. Inspected locally & offline.');
  lines.push(divider);

  return lines.join('\n');
}

export function generateJsonReport(result: FileInspectionResult): string {
  const sanitizedResult = { ...result };
  if (sanitizedResult.technical?.image?.previewUrl) {
    sanitizedResult.technical = {
      ...sanitizedResult.technical,
      image: {
        ...sanitizedResult.technical.image,
        previewUrl: undefined,
      },
    };
  }

  return JSON.stringify(sanitizedResult, null, 2);
}

export function generateSummaryClipboardText(result: FileInspectionResult): string {
  const { general, format, hashes, forensics } = result;
  return [
    `File: ${general.fileName}`,
    `Size: ${general.fileSizeFormatted} (${general.fileSizeBytes} bytes)`,
    `Format: ${format.detectedFormat} (${format.detectedMime})`,
    forensics ? `Entropy: ${forensics.entropy.score}/8.0 (${forensics.entropy.rating})` : '',
    forensics ? `Encoding: ${forensics.textEncoding.detectedEncoding}` : '',
    `Location: ${general.filePath}`,
    hashes.sha256 ? `SHA-256: ${hashes.sha256.hash}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
