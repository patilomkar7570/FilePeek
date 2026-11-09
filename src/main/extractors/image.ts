import * as fs from 'fs';
import * as path from 'path';
import sizeOf from 'image-size';
import exifr from 'exifr';
import { ImageMetadata } from '../../shared/types';
import { calculateAspectRatio } from '../../shared/formatters';

const MAX_PREVIEW_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB max for preview

export async function extractImageMetadata(
  filePath: string,
  detectedFormat: string,
  mimeType: string,
  fileSize: number
): Promise<ImageMetadata> {
  const result: ImageMetadata = {
    width: 0,
    height: 0,
    aspectRatio: 'Unknown',
    format: detectedFormat,
  };

  const ext = path.extname(filePath).toLowerCase();

  // Handle SVG specially
  if (ext === '.svg' || mimeType.includes('svg')) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const widthMatch = content.match(/width=["']([\d.]+)(px)?["']/i);
      const heightMatch = content.match(/height=["']([\d.]+)(px)?["']/i);
      const viewBoxMatch = content.match(/viewBox=["'][\d.]+[,\s]+[\d.]+[,\s]+([\d.]+)[,\s]+([\d.]+)["']/i);

      let width = widthMatch ? parseFloat(widthMatch[1]) : 0;
      let height = heightMatch ? parseFloat(heightMatch[1]) : 0;

      if ((!width || !height) && viewBoxMatch) {
        width = parseFloat(viewBoxMatch[1]);
        height = parseFloat(viewBoxMatch[2]);
      }

      result.width = Math.round(width);
      result.height = Math.round(height);
      result.aspectRatio = calculateAspectRatio(result.width, result.height);
      result.format = 'SVG Vector';
      result.colorSpace = 'sRGB (Vector)';

      if (fileSize <= MAX_PREVIEW_SIZE_BYTES) {
        // Safe base64 encode SVG
        const base64 = Buffer.from(content).toString('base64');
        result.previewUrl = `data:image/svg+xml;base64,${base64}`;
      }
      return result;
    } catch {
      // Continue to standard handling
    }
  }

  // 1. Extract dimensions using image-size
  try {
    const dimensions = sizeOf(filePath);
    if (dimensions.width && dimensions.height) {
      result.width = dimensions.width;
      result.height = dimensions.height;
      result.aspectRatio = calculateAspectRatio(result.width, result.height);
      result.orientation = dimensions.orientation;
    }
  } catch {
    // Some formats or corrupt files may not be readable by image-size
  }

  // 2. Extract EXIF / Camera metadata using exifr
  try {
    const exifData = await exifr.parse(filePath, {
      tiff: true,
      xmp: true,
      icc: true,
      jfif: true,
      ihdr: true,
      exif: true,
      gps: false, // Privacy: omit coordinates by default or keep only camera metadata
    });

    if (exifData) {
      if (!result.width && exifData.ImageWidth) {
        result.width = exifData.ImageWidth;
      }
      if (!result.height && exifData.ImageHeight) {
        result.height = exifData.ImageHeight;
      }
      if (result.width && result.height && result.aspectRatio === 'Unknown') {
        result.aspectRatio = calculateAspectRatio(result.width, result.height);
      }

      if (exifData.BitsPerSample) {
        result.bitDepth = Array.isArray(exifData.BitsPerSample)
          ? exifData.BitsPerSample.reduce((a: number, b: number) => a + b, 0)
          : Number(exifData.BitsPerSample);
      }

      if (exifData.ColorSpaceData || exifData.ColorSpace) {
        result.colorSpace = String(exifData.ColorSpaceData || (exifData.ColorSpace === 1 ? 'sRGB' : 'Uncalibrated'));
      }

      if (exifData.Orientation) {
        result.orientation = exifData.Orientation;
      }

      const cameraInfo = {
        make: exifData.Make ? String(exifData.Make).trim() : undefined,
        model: exifData.Model ? String(exifData.Model).trim() : undefined,
        lens: exifData.LensModel ? String(exifData.LensModel).trim() : undefined,
        focalLength: exifData.FocalLength ? `${exifData.FocalLength} mm` : undefined,
        iso: exifData.ISO ? Number(exifData.ISO) : undefined,
        fNumber: exifData.FNumber ? `f/${exifData.FNumber}` : undefined,
        exposureTime: exifData.ExposureTime ? (exifData.ExposureTime < 1 ? `1/${Math.round(1 / exifData.ExposureTime)}s` : `${exifData.ExposureTime}s`) : undefined,
        dateTimeOriginal: exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toLocaleString() : undefined,
      };

      if (Object.values(cameraInfo).some((v) => v !== undefined)) {
        result.camera = cameraInfo;
      }

      // Filter and save other useful EXIF fields
      const filteredExif: Record<string, string | number | boolean> = {};
      const interestingKeys = [
        'Software',
        'Flash',
        'WhiteBalance',
        'MeteringMode',
        'ExposureProgram',
        'ExposureCompensation',
        'ProfileDescription',
      ];
      for (const k of interestingKeys) {
        if (exifData[k] !== undefined) {
          filteredExif[k] = String(exifData[k]);
        }
      }
      if (Object.keys(filteredExif).length > 0) {
        result.exif = filteredExif;
      }
    }
  } catch {
    // EXIF parsing is optional and best-effort
  }

  // 3. Generate safe preview for supported formats within size limits
  const previewFormats = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']);
  if (previewFormats.has(ext) && fileSize <= MAX_PREVIEW_SIZE_BYTES) {
    try {
      const data = await fs.promises.readFile(filePath);
      const mime = mimeType || `image/${ext.replace('.', '')}`;
      result.previewUrl = `data:${mime};base64,${data.toString('base64')}`;
    } catch {
      result.previewError = 'Could not generate image preview.';
    }
  } else if (fileSize > MAX_PREVIEW_SIZE_BYTES) {
    result.previewError = `Preview skipped for large file (> 12 MB).`;
  }

  return result;
}
