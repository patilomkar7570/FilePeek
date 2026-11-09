/**
 * FilePeek Shared Types and Interfaces
 */

export type FileCategory = 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'pdf' 
  | 'archive' 
  | 'document' 
  | 'code' 
  | 'executable' 
  | 'unknown';

export interface FileFormatDetection {
  extension: string;
  detectedFormat: string;
  detectedMime: string;
  category: FileCategory;
  isExtensionMismatch: boolean;
  mismatchWarning?: string;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  magicBytesHex?: string;
  magicBytesAscii?: string;
}

export interface GeneralFileInfo {
  fileName: string;
  filePath: string;
  fileExtension: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  creationTimeMs: number;
  creationTimeFormatted: string;
  lastModifiedTimeMs: number;
  lastModifiedTimeFormatted: string;
  lastAccessedTimeMs: number;
  lastAccessedTimeFormatted: string;
  isReadOnly: boolean;
  isHidden: boolean;
}

export interface EntropyAnalysis {
  score: number;
  rating: 'Very Low (Padded / Sparse)' | 'Low (Structured / Text)' | 'Normal (Executable / Code)' | 'High (Compressed / Encrypted)';
  assessment: string;
}

export interface ByteDistribution {
  nullByteCount: number;
  nullByteRatio: number;
  printableAsciiCount: number;
  printableAsciiRatio: number;
  controlCharCount: number;
  controlCharRatio: number;
  highBinaryCount: number;
  highBinaryRatio: number;
}

export interface TextEncodingAnalysis {
  detectedEncoding: string;
  hasBOM: boolean;
  bomName?: string;
  lineEndingType: 'CRLF (Windows)' | 'LF (Unix/macOS)' | 'CR (Classic Mac)' | 'Mixed' | 'None (Binary / Single Line)';
  crlfCount: number;
  lfCount: number;
}

export interface PeBinaryAnalysis {
  isPe: boolean;
  machineArchitecture?: string;
  subsystem?: string;
  entryPointRva?: string;
  sectionsCount?: number;
  linkerVersion?: string;
  characteristics?: string[];
  isDll?: boolean;
}

export interface HexDumpLine {
  offset: string;
  hex: string;
  ascii: string;
}

export interface ForensicDetails {
  entropy: EntropyAnalysis;
  byteDistribution: ByteDistribution;
  textEncoding: TextEncodingAnalysis;
  peBinary?: PeBinaryAnalysis;
  hexDump: HexDumpLine[];
  ntfsZoneIdentifier?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: string;
  format: string;
  colorSpace?: string;
  bitDepth?: number;
  hasAlpha?: boolean;
  orientation?: number;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  dateTimeOriginal?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  focalLength?: string;
  software?: string;
  previewUrl?: string;
  previewAvailable: boolean;
  previewNote?: string;
  colorProfileName?: string;
  gpsLatitude?: string;
  gpsLongitude?: string;
}

export interface VideoMetadata {
  durationSeconds: number;
  durationFormatted: string;
  width?: number;
  height?: number;
  resolution?: string;
  aspectRatio?: string;
  videoCodec?: string;
  audioCodec?: string;
  frameRate?: number;
  frameRateFormatted?: string;
  bitrateBps?: number;
  bitrateFormatted?: string;
  containerFormat: string;
  channels?: number;
  audioSampleRate?: number;
}

export interface AudioMetadata {
  durationSeconds: number;
  durationFormatted: string;
  bitrateBps?: number;
  bitrateFormatted?: string;
  sampleRateHz?: number;
  channels?: number;
  channelsFormatted?: string;
  codec: string;
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: string;
  genre?: string;
  trackNumber?: number;
  bitrateMode?: 'Constant Bitrate (CBR)' | 'Variable Bitrate (VBR)';
}

export interface PdfMetadata {
  pageCount: number;
  pdfVersion?: string;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  isEncrypted: boolean;
  previewAvailable?: boolean;
}

export interface ArchiveEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  compressedSize: number;
  uncompressedSize: number;
  lastModified?: string;
  isEncrypted: boolean;
  crc32?: string;
  compressionMethod?: string;
}

export interface ArchiveMetadata {
  archiveFormat: string;
  fileCount: number;
  folderCount: number;
  totalCompressedSize: number;
  totalCompressedSizeFormatted: string;
  totalUncompressedSize: number;
  totalUncompressedSizeFormatted: string;
  compressionRatio: number;
  isEncrypted: boolean;
  entries: ArchiveEntry[];
  hasTruncatedEntries?: boolean;
  warning?: string;
}

export interface TechnicalMetadata {
  category: FileCategory;
  image?: ImageMetadata;
  video?: VideoMetadata;
  audio?: AudioMetadata;
  pdf?: PdfMetadata;
  archive?: ArchiveMetadata;
  forensics?: ForensicDetails;
  rawDetails?: Record<string, string | number | boolean | undefined>;
  notes?: string;
}

export interface FileHashResult {
  algorithm: 'sha256' | 'sha1' | 'md5';
  hash: string;
  calculatedAtMs: number;
  durationMs: number;
  isLegacy: boolean;
  recommendationNote: string;
}

export interface HashProgressUpdate {
  algorithm: string;
  bytesProcessed: number;
  totalBytes: number;
  percentage: number;
}

export interface FileInspectionResult {
  id: string;
  general: GeneralFileInfo;
  format: FileFormatDetection;
  technical: TechnicalMetadata;
  hashes: Partial<Record<'sha256' | 'sha1' | 'md5', FileHashResult>>;
  forensics: ForensicDetails;
  inspectedAt: string;
  error?: string;
}

export interface RecentFileRecord {
  id: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  detectedFormat: string;
  category: FileCategory;
  inspectedAt: string;
  exists: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  openAtStartup: boolean;
  rememberWindowSize: boolean;
  rememberLastSection: boolean;
  enableRecentHistory: boolean;
  maxRecentEntries: number;
  defaultHashAlgorithms: Array<'sha256' | 'sha1' | 'md5'>;
  maxImagePreviewSizeBytes: number;
  maxArchiveScanEntries: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system', // Set to system theme by default as requested
  openAtStartup: false,
  rememberWindowSize: true,
  rememberLastSection: true,
  enableRecentHistory: true,
  maxRecentEntries: 20,
  defaultHashAlgorithms: ['sha256'],
  maxImagePreviewSizeBytes: 10 * 1024 * 1024,
  maxArchiveScanEntries: 5000,
};
