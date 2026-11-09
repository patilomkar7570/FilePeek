// Additional forensic utilities added to forensics engine

// 1. Overlay / Appended Payload Detection
export function detectFileOverlay(buffer: Buffer, format: string, totalSize: number): { hasOverlay: boolean; overlayBytes: number; overlayOffset: number } {
  let eofOffset = -1;
  if (format.includes('JPEG') || format.includes('JPG')) {
    // Look for last FF D9 marker
    for (let i = buffer.length - 2; i >= 0; i--) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xD9) {
        eofOffset = i + 2;
        break;
      }
    }
  } else if (format.includes('PNG')) {
    // Look for last IEND chunk (49 45 4E 44 + 4 bytes CRC)
    const iend = buffer.indexOf(Buffer.from('IEND', 'ascii'));
    if (iend !== -1) {
      eofOffset = iend + 8;
    }
  }

  if (eofOffset > 0 && totalSize > eofOffset) {
    return {
      hasOverlay: true,
      overlayBytes: totalSize - eofOffset,
      overlayOffset: eofOffset,
    };
  }

  return { hasOverlay: false, overlayBytes: 0, overlayOffset: totalSize };
}

// 2. Slack Space Calculator
export function calculateSlackSpace(fileSizeBytes: number, clusterSizeBytes: number = 4096): { allocatedBytes: number; slackBytes: number; slackRatio: number } {
  if (fileSizeBytes === 0) return { allocatedBytes: 0, slackBytes: 0, slackRatio: 0 };
  const clusters = Math.ceil(fileSizeBytes / clusterSizeBytes);
  const allocatedBytes = clusters * clusterSizeBytes;
  const slackBytes = allocatedBytes - fileSizeBytes;
  const slackRatio = parseFloat(((slackBytes / allocatedBytes) * 100).toFixed(1));
  return { allocatedBytes, slackBytes, slackRatio };
}
