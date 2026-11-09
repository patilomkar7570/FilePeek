/**
 * Comprehensive FilePeek Test Suite
 * Validates all core functionality and forensic inspection domains.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let babel;
try {
  babel = require('/usr/share/nodejs/@babel/core');
  require.extensions['.ts'] = function (module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const compiled = babel.transformSync(content, {
      filename,
      presets: ['/usr/share/nodejs/@babel/preset-typescript'],
      plugins: ['/usr/share/nodejs/@babel/plugin-transform-modules-commonjs'],
    });
    module._compile(compiled.code, filename);
  };
} catch (e) {}

const { createFixtures, FIXTURES_DIR } = require('./fixtures/generate-fixtures');

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failedCount++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   FILEPEEK COMPREHENSIVE TEST SUITE EXECUTION');
  console.log('======================================================\n');

  createFixtures();

  // --- 1. Test Formatters ---
  console.log('[1/17] Testing File Size & Value Formatting...');
  const { formatBytes, formatDuration, calculateAspectRatio, formatBitrate } = require('../src/shared/formatters.ts');
  assert(formatBytes(0) === '0 B', 'formatBytes(0) returns "0 B"');
  assert(formatBytes(1024) === '1 KB', 'formatBytes(1024) returns "1 KB"');
  assert(formatBytes(1572864) === '1.5 MB', 'formatBytes(1.5MB) returns "1.5 MB"');
  assert(formatBytes(1073741824) === '1 GB', 'formatBytes(1GB) returns "1 GB"');
  assert(formatDuration(0) === '0:00', 'formatDuration(0) returns "0:00"');
  assert(formatDuration(65) === '1:05', 'formatDuration(65) returns "1:05"');
  assert(formatDuration(3665) === '1:01:05', 'formatDuration(3665) returns "1:01:05"');
  assert(calculateAspectRatio(1920, 1080) === '16:9', 'calculateAspectRatio(1920, 1080) returns "16:9"');
  assert(calculateAspectRatio(1000, 1000) === '1:1', 'calculateAspectRatio(1000, 1000) returns "1:1"');
  assert(calculateAspectRatio(800, 600) === '4:3', 'calculateAspectRatio(800, 600) returns "4:3"');
  assert(formatBitrate(128000) === '128 kbps', 'formatBitrate(128000) returns "128 kbps"');
  assert(formatBitrate(2500000) === '2.50 Mbps', 'formatBitrate(2500000) returns "2.50 Mbps"');

  // --- 2. Test File-Type Detection & Magic Bytes ---
  console.log('\n[2/17] Testing File-Type Detection & Magic Bytes...');
  const { detectFormatFromBuffer, detectFileFormat } = require('../src/extractors/detector.ts');
  const pngBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'sample.png'));
  const pngDetection = detectFormatFromBuffer(pngBuf, '.png');
  assert(pngDetection.detectedFormat === 'PNG', 'PNG format detected via magic bytes');
  assert(pngDetection.category === 'image', 'PNG category is "image"');
  assert(pngDetection.isExtensionMismatch === false, 'PNG extension matches signature');

  const jpgBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'sample.jpg'));
  const jpgDetection = detectFormatFromBuffer(jpgBuf, '.jpg');
  assert(jpgDetection.detectedFormat === 'JPEG', 'JPEG format detected via magic bytes');
  assert(jpgDetection.category === 'image', 'JPEG category is "image"');

  const pdfBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'document.pdf'));
  const pdfDetection = detectFormatFromBuffer(pdfBuf, '.pdf');
  assert(pdfDetection.detectedFormat === 'PDF Document', 'PDF format detected via magic bytes');
  assert(pdfDetection.category === 'pdf', 'PDF category is "pdf"');

  const wavBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'sample.wav'));
  const wavDetection = detectFormatFromBuffer(wavBuf, '.wav');
  assert(wavDetection.detectedFormat === 'WAV', 'WAV format detected via magic bytes');
  assert(wavDetection.category === 'audio', 'WAV category is "audio"');

  const zipBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'archive.zip'));
  const zipDetection = detectFormatFromBuffer(zipBuf, '.zip');
  assert(zipDetection.detectedFormat === 'ZIP Archive', 'ZIP format detected via magic bytes');
  assert(zipDetection.category === 'archive', 'ZIP category is "archive"');

  // --- 3. Test Extension Mismatch Detection ---
  console.log('\n[3/17] Testing Extension Mismatch Detection...');
  const mismatchPath = path.join(FIXTURES_DIR, 'mismatched_invoice.pdf');
  const mismatchDetection = await detectFileFormat(mismatchPath);
  assert(mismatchDetection.isExtensionMismatch === true, 'Extension mismatch correctly detected');
  assert(mismatchDetection.detectedFormat.includes('Windows Executable') || mismatchDetection.detectedFormat.includes('PE'), 'Actual format detected as Windows Executable');
  assert(mismatchDetection.mismatchWarning && mismatchDetection.mismatchWarning.includes('does not match'), 'Mismatch warning message generated accurately');

  // --- 4. Test Forensic Entropy & Structural Analysis (NEW) ---
  console.log('\n[4/17] Testing Forensic Entropy, Byte Distribution & Encodings...');
  const { calculateEntropy, analyzeByteDistribution, detectTextEncoding, parsePeBinaryHeader, generateHexDump } = require('../src/extractors/forensics.ts');

  // Empty buffer
  const emptyEntropy = calculateEntropy(Buffer.alloc(0));
  assert(emptyEntropy.score === 0.0, 'Empty buffer has 0.0 entropy');

  // Text buffer
  const textSample = Buffer.from('Testing Shannon entropy calculation on ASCII plaintext.\r\n');
  const textEntropy = calculateEntropy(textSample);
  assert(textEntropy.score > 3.0 && textEntropy.score < 5.0, `Plaintext entropy score is typical (got ${textEntropy.score})`);

  // Random buffer (high entropy)
  const randSample = crypto.randomBytes(1024);
  const randEntropy = calculateEntropy(randSample);
  assert(randEntropy.score >= 7.0, `Random binary entropy score is high (got ${randEntropy.score})`);
  assert(randEntropy.rating === 'High (Compressed / Encrypted)', 'High entropy flagged as compressed or encrypted');

  // Byte distribution
  const byteDist = analyzeByteDistribution(textSample);
  assert(byteDist.printableAsciiRatio > 90, `Printable ASCII ratio high for text (got ${byteDist.printableAsciiRatio}%)`);

  // Text encoding & line endings
  const encAnalysis = detectTextEncoding(textSample);
  assert(encAnalysis.lineEndingType === 'CRLF (Windows)', `Line ending correctly identified as Windows CRLF (got "${encAnalysis.lineEndingType}")`);

  const hexLines = generateHexDump(pngBuf, 32);
  assert(hexLines.length === 2, 'Hex dump produced 2 rows for 32 bytes');
  assert(hexLines[0].hex.includes('89 50 4E 47'), 'Hex dump displays raw PNG magic bytes');

  // --- 5. Test Image Metadata Extraction ---
  console.log('\n[5/17] Testing Image Metadata Extraction...');
  const { extractImageMetadata } = require('../src/extractors/image.ts');
  const pngMeta = await extractImageMetadata(path.join(FIXTURES_DIR, 'sample.png'), pngBuf.length);
  assert(pngMeta.width === 100, `PNG width extracted as 100 (got ${pngMeta.width})`);
  assert(pngMeta.height === 50, `PNG height extracted as 50 (got ${pngMeta.height})`);
  assert(pngMeta.hasAlpha === true, 'PNG hasAlpha detected for RGBA');
  assert(pngMeta.aspectRatio === '2:1', `PNG aspect ratio 2:1 (got ${pngMeta.aspectRatio})`);

  const jpgMeta = await extractImageMetadata(path.join(FIXTURES_DIR, 'sample.jpg'), jpgBuf.length);
  assert(jpgMeta.width === 300, `JPEG width extracted as 300 (got ${jpgMeta.width})`);
  assert(jpgMeta.height === 200, `JPEG height extracted as 200 (got ${jpgMeta.height})`);
  assert(jpgMeta.aspectRatio === '3:2', `JPEG aspect ratio 3:2 (got ${jpgMeta.aspectRatio})`);

  // --- 6. Test Audio Metadata Extraction ---
  console.log('\n[6/17] Testing Audio Metadata Extraction...');
  const { extractAudioMetadata } = require('../src/extractors/audio.ts');
  const wavMeta = await extractAudioMetadata(path.join(FIXTURES_DIR, 'sample.wav'), wavBuf.length);
  assert(wavMeta.sampleRateHz === 44100, `WAV sample rate 44100 Hz (got ${wavMeta.sampleRateHz})`);
  assert(wavMeta.channels === 2, `WAV channels 2 (got ${wavMeta.channels})`);

  const mp3Buf = fs.readFileSync(path.join(FIXTURES_DIR, 'sample.mp3'));
  const mp3Meta = await extractAudioMetadata(path.join(FIXTURES_DIR, 'sample.mp3'), mp3Buf.length);
  assert(mp3Meta.title === 'Acoustic Song', `MP3 ID3 title extracted (got "${mp3Meta.title}")`);
  assert(mp3Meta.artist === 'The Artists', `MP3 ID3 artist extracted (got "${mp3Meta.artist}")`);

  // --- 7. Test Video Metadata Container Parser ---
  console.log('\n[7/17] Testing Video Metadata Extraction...');
  const { extractVideoMetadata } = require('../src/extractors/video.ts');
  const mp4Path = path.join(FIXTURES_DIR, 'sample.mp4');
  const mp4Buf = fs.readFileSync(mp4Path);
  const videoMeta = await extractVideoMetadata(mp4Path, mp4Buf.length);
  assert(videoMeta.durationSeconds === 10, `MP4 duration extracted as 10s (got ${videoMeta.durationSeconds})`);

  // --- 8. Test PDF Metadata Extraction ---
  console.log('\n[8/17] Testing PDF Metadata Extraction...');
  const { extractPdfMetadata } = require('../src/extractors/pdf.ts');
  const pdfMeta = await extractPdfMetadata(path.join(FIXTURES_DIR, 'document.pdf'), pdfBuf.length);
  assert(pdfMeta.pdfVersion === 'PDF 1.7', `PDF version extracted (got "${pdfMeta.pdfVersion}")`);
  assert(pdfMeta.pageCount === 1, `PDF page count extracted (got ${pdfMeta.pageCount})`);
  assert(pdfMeta.title === 'Annual Financial Summary', `PDF Title extracted (got "${pdfMeta.title}")`);

  // --- 9. Test ZIP Archive Inspection ---
  console.log('\n[9/17] Testing ZIP Archive Inspection...');
  const { extractArchiveMetadata } = require('../src/extractors/archive.ts');
  const arcMeta = await extractArchiveMetadata(path.join(FIXTURES_DIR, 'archive.zip'), zipBuf.length);
  assert(arcMeta.archiveFormat.includes('ZIP'), 'Archive format identified as ZIP');
  assert(arcMeta.fileCount === 1, `ZIP contains 1 file (got ${arcMeta.fileCount})`);
  assert(arcMeta.entries[0].name === 'notes.txt', `ZIP entry name "notes.txt" (got "${arcMeta.entries[0]?.name}")`);

  // --- 10. Test Cryptographic Hashes ---
  console.log('\n[10/17] Testing Cryptographic Hashes (SHA-256, SHA-1, MD5)...');
  const { calculateFileHashes } = require('../src/extractors/hasher.ts');
  const expectedSha256 = crypto.createHash('sha256').update(pngBuf).digest('hex');
  const hashResults = await calculateFileHashes({
    filePath: path.join(FIXTURES_DIR, 'sample.png'),
    algorithms: ['sha256', 'sha1', 'md5'],
  });
  assert(hashResults.sha256.hash === expectedSha256, `SHA-256 matches exact digest (${expectedSha256})`);
  assert(hashResults.sha256.isLegacy === false, 'SHA-256 marked as secure modern standard');
  assert(hashResults.sha1.isLegacy === true, 'SHA-1 marked as legacy');

  // --- 11. Test Streaming Hashing with Progress ---
  console.log('\n[11/17] Testing Streaming Hashing on Large File with Progress...');
  const largePath = path.join(FIXTURES_DIR, 'large_sample.dat');
  let progressCount = 0;
  const largeHash = await calculateFileHashes({
    filePath: largePath,
    algorithms: ['sha256'],
    onProgress: () => { progressCount++; },
  });
  assert(largeHash.sha256.hash.length === 64, 'Large file SHA-256 computed');
  assert(progressCount > 0, 'Received streaming progress updates');

  // --- 12. Test Hash Cancellation ---
  console.log('\n[12/17] Testing Hash Cancellation...');
  const cancelSig = { isCancelled: false };
  let caughtCancel = false;
  await calculateFileHashes({
    filePath: largePath,
    algorithms: ['sha256'],
    signal: cancelSig,
    onProgress: () => { cancelSig.isCancelled = true; },
  }).catch(() => { caughtCancel = true; });
  assert(caughtCancel === true, 'Hash calculation aborted on cancellation signal');

  // --- 13. Test Corrupted / Invalid Files ---
  console.log('\n[13/17] Testing Invalid & Corrupted File Resilience...');
  const corruptPath = path.join(FIXTURES_DIR, 'corrupt.dat');
  const { inspectFile } = require('../src/extractors/inspector.ts');
  const corruptInspection = await inspectFile(corruptPath);
  assert(corruptInspection !== null, 'Corrupt file inspected without unhandled crash');
  assert(corruptInspection.forensics !== undefined, 'Forensics populated even on corrupt file');

  // --- 14. Test Missing Files ---
  console.log('\n[14/17] Testing Missing Files Error Handling...');
  let missingCaught = false;
  try {
    await inspectFile(path.join(FIXTURES_DIR, 'non_existent_file.xyz'));
  } catch (err) {
    missingCaught = true;
    assert(err.message.includes('Cannot access file'), 'Missing file throws human-readable error');
  }
  assert(missingCaught === true, 'Missing file properly rejected');

  // --- 15. Test StorageManager ---
  console.log('\n[15/17] Testing StorageManager & Local Persistence...');
  const { StorageManager } = require('../src/main/storage.ts');
  const testStorageDir = path.join(FIXTURES_DIR, 'test_config_2');
  const storage = new StorageManager(testStorageDir);
  storage.saveSettings({ theme: 'light' });
  assert(storage.getSettings().theme === 'light', 'Theme updated to light');
  try { fs.rmSync(testStorageDir, { recursive: true, force: true }); } catch {}

  // --- 16. Test Report Generation (TXT and JSON) ---
  console.log('\n[16/17] Testing Report Generation (TXT and JSON)...');
  const { generateTextReport, generateJsonReport } = require('../src/extractors/reporter.ts');
  const fullInspection = await inspectFile(path.join(FIXTURES_DIR, 'sample.png'));
  const txtReport = generateTextReport(fullInspection);
  assert(txtReport.includes('Shannon Entropy'), 'TXT report contains Shannon Entropy');
  assert(txtReport.includes('Byte Density'), 'TXT report contains Byte Density');

  const jsonReport = generateJsonReport(fullInspection);
  const parsedJson = JSON.parse(jsonReport);
  assert(parsedJson.forensics.entropy.score !== undefined, 'JSON report contains entropy score');
  assert(parsedJson.forensics.hexDump.length > 0, 'JSON report contains hex dump rows');

  // --- 17. Test Theme CSS Palette Values ---
  console.log('\n[17/17] Testing Theme Palette & Color Values...');
  const cssContent = fs.readFileSync(path.join(__dirname, '../src/renderer/src/styles/index.css'), 'utf8');
  assert(cssContent.includes('#0B0D12'), 'Dark theme background #0B0D12 verified');
  assert(cssContent.includes('#F5F6FA'), 'Light theme background #F5F6FA verified');

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
