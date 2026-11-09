import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatExactBytes,
  formatDate,
  formatDuration,
  formatBitrate,
  formatSampleRate,
  calculateAspectRatio,
  truncateMiddle,
} from '../src/shared/formatters';

describe('Formatters', () => {
  describe('formatBytes', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('formats small byte sizes', () => {
      expect(formatBytes(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('formats gigabytes with decimals', () => {
      expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    });

    it('handles negative or invalid values gracefully', () => {
      expect(formatBytes(-100)).toBe('0 B');
      expect(formatBytes(NaN)).toBe('0 B');
    });
  });

  describe('formatExactBytes', () => {
    it('formats numbers with comma separators', () => {
      expect(formatExactBytes(1048576)).toBe('1,048,576 bytes');
      expect(formatExactBytes(0)).toBe('0 bytes');
    });
  });

  describe('formatDuration', () => {
    it('formats zero or invalid seconds', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(-10)).toBe('00:00');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(45)).toBe('00:45');
      expect(formatDuration(125)).toBe('02:05');
    });

    it('formats hours, minutes and seconds', () => {
      expect(formatDuration(3665)).toBe('01:01:05');
    });
  });

  describe('formatBitrate', () => {
    it('formats kbps and Mbps', () => {
      expect(formatBitrate(320)).toBe('320 kbps');
      expect(formatBitrate(1500)).toBe('1.50 Mbps');
      expect(formatBitrate(undefined)).toBe('Unknown');
    });
  });

  describe('formatSampleRate', () => {
    it('formats Hz and kHz', () => {
      expect(formatSampleRate(44100)).toBe('44.1 kHz');
      expect(formatSampleRate(48000)).toBe('48 kHz');
      expect(formatSampleRate(undefined)).toBe('Unknown');
    });
  });

  describe('calculateAspectRatio', () => {
    it('detects standard aspect ratios', () => {
      expect(calculateAspectRatio(1920, 1080)).toBe('16:9');
      expect(calculateAspectRatio(1280, 720)).toBe('16:9');
      expect(calculateAspectRatio(1024, 768)).toBe('4:3');
      expect(calculateAspectRatio(800, 800)).toBe('1:1');
      expect(calculateAspectRatio(1080, 1920)).toBe('9:16');
    });

    it('handles edge cases gracefully', () => {
      expect(calculateAspectRatio(0, 0)).toBe('Unknown');
      expect(calculateAspectRatio(-10, 100)).toBe('Unknown');
    });
  });

  describe('truncateMiddle', () => {
    it('truncates text with ellipsis in center', () => {
      const longText = 'C:\\Users\\JohnDoe\\Documents\\Projects\\FilePeek\\src\\shared\\formatters.ts';
      const truncated = truncateMiddle(longText, 30);
      expect(truncated.length).toBeLessThanOrEqual(30);
      expect(truncated).toContain('...');
    });

    it('leaves short strings intact', () => {
      expect(truncateMiddle('short.txt', 20)).toBe('short.txt');
    });
  });
});
