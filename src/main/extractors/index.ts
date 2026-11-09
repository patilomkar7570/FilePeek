import {
  FileCategory,
  ImageMetadata,
  VideoMetadata,
  AudioMetadata,
  PdfMetadata,
  ArchiveMetadata,
  FallbackMetadata,
} from '../../shared/types';
import { extractImageMetadata } from './image';
import { extractAudioMetadata } from './audio';
import { extractVideoMetadata } from './video';
import { extractPdfMetadata } from './pdf';
import { extractArchiveMetadata } from './archive';
import { createFallbackMetadata } from './fallback';

export interface ExtractedMetadataResult {
  image?: ImageMetadata;
  video?: VideoMetadata;
  audio?: AudioMetadata;
  pdf?: PdfMetadata;
  archive?: ArchiveMetadata;
  fallback?: FallbackMetadata;
}

export async function extractMetadataForCategory(
  filePath: string,
  category: FileCategory,
  detectedFormat: string,
  mimeType: string,
  fileSize: number,
  sampleBuffer: Buffer
): Promise<ExtractedMetadataResult> {
  const result: ExtractedMetadataResult = {};

  // Always compute fallback hex preview for transparency & hex inspector
  result.fallback = createFallbackMetadata(sampleBuffer);

  try {
    switch (category) {
      case 'image':
        result.image = await extractImageMetadata(filePath, detectedFormat, mimeType, fileSize);
        break;

      case 'audio':
        result.audio = await extractAudioMetadata(filePath);
        break;

      case 'video':
        result.video = await extractVideoMetadata(filePath, detectedFormat);
        break;

      case 'pdf':
        result.pdf = await extractPdfMetadata(filePath);
        break;

      case 'archive':
        result.archive = await extractArchiveMetadata(filePath, fileSize);
        break;

      default:
        // No specific extractor needed; fallback is already populated
        break;
    }
  } catch (err: any) {
    console.error(`Metadata extraction failed for ${filePath}:`, err);
    // Graceful degradation: fallback is already populated
  }

  return result;
}
