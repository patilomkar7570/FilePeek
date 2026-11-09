const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FIXTURES_DIR = path.join(__dirname);

function createFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // 1. Valid 1x1 PNG image
  // 89 50 4E 47 0D 0A 1A 0A
  // IHDR chunk: length 13, 'IHDR', width=100, height=50, bitDepth=8, colorType=6 (RGBA), comp=0, filt=0, inter=0, CRC
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // signature
    0x00, 0x00, 0x00, 0x0D,                         // IHDR length 13
    0x49, 0x48, 0x44, 0x52,                         // 'IHDR'
    0x00, 0x00, 0x00, 0x64,                         // width = 100
    0x00, 0x00, 0x00, 0x32,                         // height = 50
    0x08,                                           // bit depth = 8
    0x06,                                           // color type = RGBA
    0x00, 0x00, 0x00,                               // comp, filter, interlace
    0x7A, 0x4A, 0xF8, 0x61,                         // CRC
    0x00, 0x00, 0x00, 0x00,                         // IEND length 0
    0x49, 0x45, 0x4E, 0x44,                         // 'IEND'
    0xAE, 0x42, 0x60, 0x82                          // CRC
  ]);
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample.png'), pngHeader);

  // 2. Valid minimal JPEG image with SOF0 marker
  // FF D8 FF E0 ... FF C0 (SOF0) length 11, bits 8, height 200, width 300, components 3
  const jpegHeader = Buffer.from([
    0xFF, 0xD8,                                     // SOI
    0xFF, 0xE0, 0x00, 0x10,                         // APP0 length 16
    0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
    0xFF, 0xC0, 0x00, 0x11,                         // SOF0 length 17
    0x08,                                           // bit depth 8
    0x00, 0xC8,                                     // height = 200
    0x01, 0x2C,                                     // width = 300
    0x03,                                           // 3 components (sRGB)
    0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xD9                                      // EOI
  ]);
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample.jpg'), jpegHeader);

  // 3. Extension Mismatch File: named invoice.pdf, but actually a Windows PE Executable ('MZ')!
  const peExecFakePdf = Buffer.from([
    0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
    0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  fs.writeFileSync(path.join(FIXTURES_DIR, 'mismatched_invoice.pdf'), peExecFakePdf);

  // 4. Valid minimal PDF with Info Dictionary
  const pdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R >>
endobj
4 0 obj
<< /Title (Annual Financial Summary) /Author (Accounting Team) /Subject (Quarterly Audit) /Creator (FilePeek Generator) /Producer (PDF Engine v2) /CreationDate (D:20261109120000Z) >>
endobj
trailer
<< /Root 1 0 R /Info 4 0 R >>
%%EOF`;
  fs.writeFileSync(path.join(FIXTURES_DIR, 'document.pdf'), pdfContent);

  // 5. Valid minimal WAV Audio file (PCM 44.1kHz 16-bit Stereo 1 second)
  const sampleRate = 44100;
  const numChannels = 2;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = byteRate; // 1 second of audio data
  const fileSize = 36 + dataSize;

  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(fileSize, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);          // Subchunk1Size
  wavHeader.writeUInt16LE(1, 20);           // AudioFormat 1 = PCM
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  const silentData = Buffer.alloc(dataSize);
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample.wav'), Buffer.concat([wavHeader, silentData]));

  // 6. Valid minimal MP3 file with ID3v2.3 tag
  // ID3 header: 'ID3', ver 3, flags 0, syncsafe size
  const titleFrame = Buffer.concat([
    Buffer.from('TIT2'),
    Buffer.from([0x00, 0x00, 0x00, 0x0E]), // size 14
    Buffer.from([0x00, 0x00]),             // flags
    Buffer.from([0x00]),                   // encoding 0 = latin1
    Buffer.from('Acoustic Song')
  ]);
  const artistFrame = Buffer.concat([
    Buffer.from('TPE1'),
    Buffer.from([0x00, 0x00, 0x00, 0x0C]),
    Buffer.from([0x00, 0x00]),
    Buffer.from([0x00]),
    Buffer.from('The Artists')
  ]);
  const tagPayload = Buffer.concat([titleFrame, artistFrame]);
  const tagLen = tagPayload.length;
  const id3Header = Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00,
    (tagLen >> 21) & 0x7F, (tagLen >> 14) & 0x7F, (tagLen >> 7) & 0x7F, tagLen & 0x7F
  ]);
  // MPEG Audio Frame Sync: FF FB 90 64 (MPEG-1 Layer 3, 128kbps, 44.1kHz, Stereo)
  const mpegFrame = Buffer.alloc(417);
  mpegFrame[0] = 0xFF;
  mpegFrame[1] = 0xFB;
  mpegFrame[2] = 0x90; // 128 kbps, 44.1kHz
  mpegFrame[3] = 0x64;

  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample.mp3'), Buffer.concat([id3Header, tagPayload, mpegFrame]));

  // 7. Valid ZIP Archive containing files
  // Local File Header 1: 'notes.txt'
  const f1Name = 'notes.txt';
  const f1Content = Buffer.from('Confidential meeting notes regarding Q4 roadmap.');
  const f1Crc = 0x12345678;

  const lfh1 = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // signature
    Buffer.from([0x14, 0x00]),             // version 2.0
    Buffer.from([0x00, 0x00]),             // flags
    Buffer.from([0x00, 0x00]),             // stored (no compression)
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // time, date
    Buffer.alloc(4),                       // crc32
    Buffer.from([f1Content.length, 0, 0, 0]), // comp size
    Buffer.from([f1Content.length, 0, 0, 0]), // uncomp size
    Buffer.from([f1Name.length, 0]),       // name len
    Buffer.from([0x00, 0x00]),             // extra len
    Buffer.from(f1Name),
    f1Content
  ]);

  // Central Directory Record 1
  const cdh1 = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x01, 0x02]), // signature
    Buffer.from([0x14, 0x00, 0x14, 0x00]), // ver made by, ver needed
    Buffer.from([0x00, 0x00]),             // flags
    Buffer.from([0x00, 0x00]),             // compression (stored)
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // time, date
    Buffer.alloc(4),                       // crc32
    Buffer.from([f1Content.length, 0, 0, 0]),
    Buffer.from([f1Content.length, 0, 0, 0]),
    Buffer.from([f1Name.length, 0]),
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // extra, comment len
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // disk start, internal attr
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // external attr
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // relative offset of local header
    Buffer.from(f1Name)
  ]);

  const cdOffset = lfh1.length;
  const cdSize = cdh1.length;

  // End of Central Directory (EOCD)
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x05, 0x06]), // signature
    Buffer.from([0x00, 0x00]),             // disk number 0
    Buffer.from([0x00, 0x00]),             // disk where CD starts 0
    Buffer.from([0x01, 0x00]),             // number of CD records on disk = 1
    Buffer.from([0x01, 0x00]),             // total CD records = 1
    Buffer.from([cdSize & 0xFF, (cdSize >> 8) & 0xFF, 0, 0]),
    Buffer.from([cdOffset & 0xFF, (cdOffset >> 8) & 0xFF, 0, 0]),
    Buffer.from([0x00, 0x00])              // comment length 0
  ]);

  fs.writeFileSync(path.join(FIXTURES_DIR, 'archive.zip'), Buffer.concat([lfh1, cdh1, eocd]));

  // 8. Large test file (1.5 MB) for streaming hashing and cancellation tests
  const largeBuf = Buffer.alloc(1536 * 1024, 0x41); // 1.5MB of 'A'
  fs.writeFileSync(path.join(FIXTURES_DIR, 'large_sample.dat'), largeBuf);

  console.log('Test fixtures created successfully in:', FIXTURES_DIR);
}

if (require.main === module) {
  createFixtures();
}

module.exports = { createFixtures, FIXTURES_DIR };
