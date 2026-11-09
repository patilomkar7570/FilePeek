import { FallbackMetadata, HexByteGroup } from '../../shared/types';

export function createFallbackMetadata(sampleBuffer: Buffer): FallbackMetadata {
  const previewGroups: HexByteGroup[] = [];
  const previewLength = Math.min(128, sampleBuffer.length);

  for (let offset = 0; offset < previewLength; offset += 16) {
    const chunk = sampleBuffer.subarray(offset, Math.min(offset + 16, previewLength));
    const hex: string[] = [];
    let ascii = '';

    for (let i = 0; i < 16; i++) {
      if (i < chunk.length) {
        const byte = chunk[i];
        hex.push(byte.toString(16).padStart(2, '0').toUpperCase());
        ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
      } else {
        hex.push('  ');
        ascii += ' ';
      }
    }

    previewGroups.push({
      offset: offset.toString(16).padStart(8, '0').toUpperCase(),
      hex,
      ascii,
    });
  }

  return {
    headerHexPreview: previewGroups,
    note: 'Detailed specialized metadata is unavailable for this file type. Showing raw binary header signature inspection.',
  };
}
