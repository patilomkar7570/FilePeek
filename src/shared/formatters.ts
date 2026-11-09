/**
 * Formats a byte number into a clean, human-readable string (IEC / binary 1024-based).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0 || isNaN(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  const value = parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm));

  return `${value} ${sizes[safeIndex]}`;
}

/**
 * Formats raw number of bytes with comma thousand-separators.
 */
export function formatExactBytes(bytes: number): string {
  if (isNaN(bytes)) return '0 bytes';
  return `${bytes.toLocaleString('en-US')} bytes`;
}

/**
 * Formats an ISO or timestamp date into a friendly localized string.
 */
export function formatDate(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return 'Not available';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats duration in seconds to standard HH:MM:SS or MM:SS format.
 */
export function formatDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats bitrate in kbps or bps.
 */
export function formatBitrate(kbps: number | undefined): string {
  if (!kbps || isNaN(kbps)) return 'Unknown';
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(2)} Mbps`;
  }
  return `${Math.round(kbps)} kbps`;
}

/**
 * Formats sample rate in Hz to kHz.
 */
export function formatSampleRate(hz: number | undefined): string {
  if (!hz || isNaN(hz)) return 'Unknown';
  if (hz >= 1000) {
    const khz = hz / 1000;
    return `${khz % 1 === 0 ? khz : khz.toFixed(1)} kHz`;
  }
  return `${hz} Hz`;
}

/**
 * Computes closest standard or exact aspect ratio string.
 */
export function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height || width <= 0 || height <= 0) return 'Unknown';

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width), Math.round(height));
  const wRatio = Math.round(width) / divisor;
  const hRatio = Math.round(height) / divisor;

  // Check common approximations
  const decimalRatio = width / height;
  if (Math.abs(decimalRatio - 16 / 9) < 0.02) return '16:9';
  if (Math.abs(decimalRatio - 4 / 3) < 0.02) return '4:3';
  if (Math.abs(decimalRatio - 1) < 0.01) return '1:1';
  if (Math.abs(decimalRatio - 21 / 9) < 0.02) return '21:9';
  if (Math.abs(decimalRatio - 3 / 2) < 0.02) return '3:2';
  if (Math.abs(decimalRatio - 9 / 16) < 0.02) return '9:16';

  if (wRatio < 50 && hRatio < 50) {
    return `${wRatio}:${hRatio}`;
  }

  return `${decimalRatio.toFixed(2)}:1`;
}

/**
 * Truncates long file paths nicely in middle.
 */
export function truncateMiddle(text: string, maxLength: number = 48): string {
  if (!text || text.length <= maxLength) return text;
  const charsToShow = maxLength - 3;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return text.substr(0, frontChars) + '...' + text.substr(text.length - backChars);
}
