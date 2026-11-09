import { AppSettings, FileCategory } from './types';

export const APP_NAME = 'FilePeek';
export const APP_TAGLINE = 'Know Everything About Your Files.';
export const APP_VERSION = '1.0.0';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  openAtStartup: false,
  rememberWindowSize: true,
  rememberLastSection: true,
  lastSelectedSection: 'overview',
  historyEnabled: true,
  maxRecentFiles: 20,
  calculateHashAuto: false,
  defaultHashAlgorithm: 'sha256',
};

export interface FileCategoryInfo {
  category: FileCategory;
  name: string;
  description: string;
  extensions: string[];
  icon: string;
}

export const SUPPORTED_CATEGORIES: FileCategoryInfo[] = [
  {
    category: 'image',
    name: 'Images',
    description: 'Dimensions, aspect ratio, color depth, EXIF, camera optics',
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.avif', '.svg'],
    icon: 'Image',
  },
  {
    category: 'video',
    name: 'Videos',
    description: 'Codecs, frame rate, resolution, duration, bitrate, container',
    extensions: ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv', '.wmv', '.m4v'],
    icon: 'Video',
  },
  {
    category: 'audio',
    name: 'Audio',
    description: 'Duration, sample rate, channels, artist, album, ID3 & Vorbis tags',
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.opus', '.wma'],
    icon: 'Music',
  },
  {
    category: 'pdf',
    name: 'PDF Documents',
    description: 'Pages, PDF version, author, creator, producer, security & dates',
    extensions: ['.pdf'],
    icon: 'FileText',
  },
  {
    category: 'archive',
    name: 'Archives',
    description: 'ZIP central directory, uncompressed sizes, compression ratio & files',
    extensions: ['.zip', '.tar', '.gz', '.7z', '.rar'],
    icon: 'Archive',
  },
  {
    category: 'executable',
    name: 'Executables & Binaries',
    description: 'PE/MZ Windows executables, DLLs, ELF & Mach-O signatures',
    extensions: ['.exe', '.dll', '.msi', '.bin', '.sys'],
    icon: 'Cpu',
  },
  {
    category: 'text',
    name: 'Code & Data',
    description: 'Source code, JSON, XML, Markdown, configuration, CSV & text',
    extensions: ['.json', '.xml', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.md', '.txt', '.csv', '.yaml', '.yml'],
    icon: 'Code',
  },
  {
    category: 'other',
    name: 'Universal Binary',
    description: 'Magic bytes, header preview, file attributes & cryptographic hashes',
    extensions: ['*'],
    icon: 'FileQuestion',
  },
];

export interface MagicSignature {
  name: string;
  category: FileCategory;
  mime: string;
  extensions: string[];
  match: (buffer: Buffer) => boolean;
}

export const KNOWN_MAGIC_SIGNATURES: MagicSignature[] = [
  // Images
  {
    name: 'JPEG Image',
    category: 'image',
    mime: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    match: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    name: 'PNG Image',
    category: 'image',
    mime: 'image/png',
    extensions: ['.png'],
    match: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
  },
  {
    name: 'GIF Image',
    category: 'image',
    mime: 'image/gif',
    extensions: ['.gif'],
    match: (buf) =>
      buf.length >= 6 &&
      buf[0] === 0x47 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x38 &&
      (buf[4] === 0x37 || buf[4] === 0x39) &&
      buf[5] === 0x61,
  },
  {
    name: 'WebP Image',
    category: 'image',
    mime: 'image/webp',
    extensions: ['.webp'],
    match: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    name: 'BMP Image',
    category: 'image',
    mime: 'image/bmp',
    extensions: ['.bmp'],
    match: (buf) => buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d,
  },
  {
    name: 'TIFF Image',
    category: 'image',
    mime: 'image/tiff',
    extensions: ['.tiff', '.tif'],
    match: (buf) =>
      buf.length >= 4 &&
      ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a && buf[3] === 0x00) ||
        (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a)),
  },
  // Documents & PDF
  {
    name: 'PDF Document',
    category: 'pdf',
    mime: 'application/pdf',
    extensions: ['.pdf'],
    match: (buf) => buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-',
  },
  // Audio
  {
    name: 'FLAC Audio',
    category: 'audio',
    mime: 'audio/flac',
    extensions: ['.flac'],
    match: (buf) => buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'fLaC',
  },
  {
    name: 'WAV Audio',
    category: 'audio',
    mime: 'audio/wav',
    extensions: ['.wav'],
    match: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WAVE',
  },
  {
    name: 'MP3 Audio (ID3)',
    category: 'audio',
    mime: 'audio/mpeg',
    extensions: ['.mp3'],
    match: (buf) => buf.length >= 3 && buf.subarray(0, 3).toString('ascii') === 'ID3',
  },
  {
    name: 'Ogg Container (Audio/Opus/Vorbis)',
    category: 'audio',
    mime: 'audio/ogg',
    extensions: ['.ogg', '.opus', '.oga'],
    match: (buf) => buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'OggS',
  },
  // Video
  {
    name: 'Matroska / WebM Video Container',
    category: 'video',
    mime: 'video/x-matroska',
    extensions: ['.mkv', '.webm'],
    match: (buf) =>
      buf.length >= 4 &&
      buf[0] === 0x1a &&
      buf[1] === 0x45 &&
      buf[2] === 0xdf &&
      buf[3] === 0xa3,
  },
  {
    name: 'AVI Video Container',
    category: 'video',
    mime: 'video/x-msvideo',
    extensions: ['.avi'],
    match: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'AVI ',
  },
  {
    name: 'MP4 / QuickTime Video Container',
    category: 'video',
    mime: 'video/mp4',
    extensions: ['.mp4', '.m4v', '.mov'],
    match: (buf) =>
      buf.length >= 12 &&
      buf.subarray(4, 8).toString('ascii') === 'ftyp',
  },
  // Archives
  {
    name: 'ZIP Archive',
    category: 'archive',
    mime: 'application/zip',
    extensions: ['.zip'],
    match: (buf) =>
      buf.length >= 4 &&
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07) &&
      (buf[3] === 0x04 || buf[3] === 0x06 || buf[3] === 0x08),
  },
  {
    name: '7-Zip Archive',
    category: 'archive',
    mime: 'application/x-7z-compressed',
    extensions: ['.7z'],
    match: (buf) =>
      buf.length >= 6 &&
      buf[0] === 0x37 &&
      buf[1] === 0x7a &&
      buf[2] === 0xbc &&
      buf[3] === 0xaf &&
      buf[4] === 0x27 &&
      buf[5] === 0x1c,
  },
  {
    name: 'GZIP Compressed File',
    category: 'archive',
    mime: 'application/gzip',
    extensions: ['.gz', '.tgz'],
    match: (buf) => buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b,
  },
  {
    name: 'RAR Archive',
    category: 'archive',
    mime: 'application/vnd.rar',
    extensions: ['.rar'],
    match: (buf) =>
      buf.length >= 7 &&
      buf[0] === 0x52 &&
      buf[1] === 0x61 &&
      buf[2] === 0x72 &&
      buf[3] === 0x21 &&
      buf[4] === 0x1a &&
      buf[5] === 0x07,
  },
  // Executables
  {
    name: 'Windows Executable / DLL (PE)',
    category: 'executable',
    mime: 'application/vnd.microsoft.portable-executable',
    extensions: ['.exe', '.dll', '.sys', '.scr'],
    match: (buf) => buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a, // MZ
  },
  {
    name: 'ELF Executable / Shared Object',
    category: 'executable',
    mime: 'application/x-elf',
    extensions: ['.so', '.bin', ''],
    match: (buf) =>
      buf.length >= 4 &&
      buf[0] === 0x7f &&
      buf[1] === 0x45 &&
      buf[2] === 0x4c &&
      buf[3] === 0x46,
  },
  {
    name: 'Mach-O Executable / Binary',
    category: 'executable',
    mime: 'application/x-mach-binary',
    extensions: ['.dylib', ''],
    match: (buf) =>
      buf.length >= 4 &&
      ((buf[0] === 0xcf && buf[1] === 0xfa && buf[2] === 0xed && buf[3] === 0xfe) ||
        (buf[0] === 0xce && buf[1] === 0xfa && buf[2] === 0xed && buf[3] === 0xfe) ||
        (buf[0] === 0xca && buf[1] === 0xfe && buf[2] === 0xba && buf[3] === 0xbe)),
  },
  // SQLite
  {
    name: 'SQLite 3 Database',
    category: 'other',
    mime: 'application/vnd.sqlite3',
    extensions: ['.sqlite', '.db', '.sqlite3'],
    match: (buf) =>
      buf.length >= 16 &&
      buf.subarray(0, 16).toString('ascii') === 'SQLite format 3\0',
  },
];
