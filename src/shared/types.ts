export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'archive'
  | 'text'
  | 'executable'
  | 'document'
  | 'other';

export interface GeneralFileInfo {
  fileName: string;
  fileExtension: string;
  detectedFormat: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  filePath: string;
  directory: string;
  createdTime: string | null;
  modifiedTime: string | null;
  accessedTime: string | null;
  isReadOnly: boolean;
  isHidden: boolean;
}

export interface FormatVerification {
  extension: string;
  detectedFormat: string;
  detectedMime: string;
  isMismatch: boolean;
  warningMessage?: string;
  isUnknownFormat: boolean;
  magicSignatureHex?: string;
  magicSignatureAscii?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: string;
  format: string;
  colorSpace?: string;
  bitDepth?: number;
  orientation?: number | string;
  hasAlpha?: boolean;
  exif?: Record<string, string | number | boolean>;
  camera?: {
    make?: string;
    model?: string;
    lens?: string;
    focalLength?: string;
    iso?: number;
    fNumber?: string;
    exposureTime?: string;
    dateTimeOriginal?: string;
  };
  previewUrl?: string;
  previewError?: string;
}

export interface VideoMetadata {
  durationSeconds: number;
  durationFormatted: string;
  resolution: string;
  width?: number;
  height?: number;
  videoCodec: string;
  frameRate?: number;
  audioCodec?: string;
  bitrateKbps?: number;
  containerFormat: string;
  audioChannels?: number;
  audioSampleRate?: number;
}

export interface AudioMetadata {
  durationSeconds: number;
  durationFormatted: string;
  bitrateKbps?: number;
  sampleRateHz?: number;
  channels?: number;
  channelLayout?: string;
  codec: string;
  artist?: string;
  album?: string;
  title?: string;
  genre?: string;
  year?: number;
  trackNo?: number;
  coverArtUrl?: string;
}

export interface PdfMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pdfVersion?: string;
  isEncrypted?: boolean;
  previewThumbnailUrl?: string;
}

export interface ArchiveEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  compressedSize: number;
  uncompressedSize: number;
  modifiedTime?: string;
  isEncrypted?: boolean;
}

export interface ArchiveMetadata {
  format: string;
  totalFiles: number;
  totalDirs: number;
  totalCompressedSizeBytes: number;
  totalUncompressedSizeBytes: number;
  compressionRatioPercent: number;
  isEncrypted: boolean;
  comment?: string;
  entries: ArchiveEntry[];
  truncatedNotice?: string;
}

export interface HexByteGroup {
  offset: string;
  hex: string[];
  ascii: string;
}

export interface FallbackMetadata {
  headerHexPreview: HexByteGroup[];
  encodingGuess?: string;
  lineCount?: number;
  note: string;
}

export interface FileInspectionResult {
  id: string;
  timestamp: string;
  general: GeneralFileInfo;
  verification: FormatVerification;
  category: FileCategory;
  image?: ImageMetadata;
  video?: VideoMetadata;
  audio?: AudioMetadata;
  pdf?: PdfMetadata;
  archive?: ArchiveMetadata;
  fallback?: FallbackMetadata;
  hashes?: HashProgressResult;
  error?: string;
}

export interface HashProgressResult {
  sha256?: string;
  sha1?: string;
  md5?: string;
  progress: number; // 0 to 100
  isCalculating: boolean;
  cancelled: boolean;
  error?: string;
}

export interface RecentFile {
  id: string;
  filePath: string;
  fileName: string;
  fileExtension: string;
  sizeBytes: number;
  sizeFormatted: string;
  detectedFormat: string;
  category: FileCategory;
  inspectedAt: string;
  existsOnDisk: boolean;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  openAtStartup: boolean;
  rememberWindowSize: boolean;
  rememberLastSection: boolean;
  lastSelectedSection: string;
  historyEnabled: boolean;
  maxRecentFiles: number;
  calculateHashAuto: boolean;
  defaultHashAlgorithm: 'sha256' | 'sha1' | 'md5' | 'all';
}

export interface ExportReportOptions {
  format: 'json' | 'txt';
  result: FileInspectionResult;
}

export interface HashComputeRequest {
  filePath: string;
  algorithms: Array<'sha256' | 'sha1' | 'md5'>;
  requestId: string;
}
