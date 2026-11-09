# FilePeek

<div align="center">

**Know Everything About Your Files.**

*A lightweight, privacy-focused, premium Windows file inspection utility.*

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&logoColor=white)](#)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline%20%26%20Local-28C76F?logo=shield&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-8B7CFF.svg)](#license)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue?logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron&logoColor=white)](#)

</div>

---

## 🔍 Overview

**FilePeek** is a fast, offline Windows desktop utility engineered for software architects, developers, security researchers, and everyday power users. Drag and drop any file into FilePeek to instantly reveal its true technical identity, internal metadata, cryptographic digests, and signature verification.

FilePeek treats files with zero trust: it inspects binary magic bytes to determine the actual format rather than blindly relying on the file extension. If an executable is disguised as an image or a script is saved with a deceptive suffix, FilePeek immediately flags the discrepancy.

---

## ✨ Key Features

### 🛡️ 1. Format Detection & Extension Mismatch Alerts
* **Binary Magic Signature Inspection:** Reads initial header bytes to identify the true container format.
* **Format Mismatch Engine:** Instantly alerts you when a file's extension disagrees with its underlying signature (e.g. an executable `.exe` renamed to `.png`).
* **Non-Judgmental Verification:** Highlights discrepancies objectively without making false claims about safety or malware status.
* **Unrecognized Format Graceful Fallback:** Provides clear indicators when signatures are proprietary or non-standard.

### 🔬 2. Deep Category-Specific Metadata Extraction
* **🖼️ Images (`JPEG`, `PNG`, `WebP`, `GIF`, `BMP`, `TIFF`, `AVIF`, `SVG`):**
  * Exact dimensions (width × height) and calculated aspect ratio (`16:9`, `4:3`, `1:1`, etc.)
  * Color space and bit depth
  * EXIF camera optics: Camera make & model, lens, focal length, aperture ($f$-number), exposure time, ISO speed, capture timestamp
  * Safe embedded thumbnail preview with strict memory ceilings (avoids loading massive files into RAM)
* **🎬 Videos (`MP4`, `MKV`, `MOV`, `AVI`, `WebM`):**
  * Container format, total duration, frame rate, and bitrate
  * Video stream dimensions and video codec identification
  * Audio stream codecs, channel count, and sample rate
* **🎵 Audio (`MP3`, `WAV`, `FLAC`, `AAC`, `OGG`, `M4A`, `Opus`):**
  * Duration, bitrate, sample rate, and audio channel layout (Mono, Stereo, 5.1)
  * ID3v1, ID3v2, Vorbis tags: Track title, artist, album, genre, year, track number
  * Embedded cover artwork preview extracted directly from metadata frames
* **📄 PDF Documents (`.pdf`):**
  * Page count and PDF specification version (e.g., `PDF 1.7`)
  * Document title, author, subject, creator software, producer library
  * Creation date, modification date, and encryption/password-protection flag
* **📦 Archives (`ZIP`):**
  * Central directory inspection without extracting contents to disk
  * Total files count, folder count, uncompressed size, compressed size, and compression ratio %
  * Interactive file structure table with instant search and filtering
  * Encrypted entry detection
* **🔢 Raw Binary Header (Hex Inspector):**
  * 16-byte aligned hexadecimal and decoded ASCII inspector for any file, ideal for reverse engineering and inspecting unfamiliar file formats.

### 🔐 3. Memory-Streaming Cryptographic Hashing
* **Supported Algorithms:**
  * **SHA-256:** Recommended modern standard
  * **SHA-1:** Clearly labeled legacy algorithm (collision-prone)
  * **MD5:** Clearly labeled legacy checksum algorithm
* **Chunked File Streaming:** Hashes multi-gigabyte files smoothly with minimal memory footprint.
* **Real-time Progress & Cancellation:** Interactive progress bar with immediate cancellation support.
* **1-Click Copy:** Fast clipboard copying for individual digests or complete summaries.

### 🛠️ 4. File Utilities & Report Exporting
* **Export Reports:** Save full technical inspection reports in human-readable Plaintext (`.txt`) or structured JSON (`.json`).
* **Copy Summary:** Copy markdown-formatted summary with one click.
* **Reveal in Explorer:** Opens the file's directory and highlights it directly in Windows File Explorer.
* **Open in Default App:** Launches the file using Windows' registered default application upon explicit user action (never automatically).

### 🎨 5. Premium Minimalist UI/UX
* **Subtle Glassmorphism & Modern Desktop Aesthetics:** Inspired by Linear, macOS utilities, and modern Windows 11 Fluent surfaces.
* **Dark, Light & System Themes:** Complete color-token system with smooth theme transitions.
* **Offline History Management:** Remembers recently inspected files locally with disk existence checks (gracefully marks deleted or moved files).

---

## 🔒 Security & Privacy by Design

FilePeek is built for zero data leakage:

* **100% Offline:** No network sockets, cloud backends, tracking, or telemetry.
* **Electron Context Isolation:** `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
* **Safe Preload:** Exposes only typed, strictly validated IPC methods via `window.filePeekApi`.
* **Zero Execution:** Files being inspected are never executed, and file contents are never loaded as application code.
* **Local Persistence:** Settings and recent history are saved strictly to the local Windows user profile (`%APPDATA%\FilePeek`).

---

## 🏗️ Architecture

```
FilePeek/
├── src/
│   ├── shared/
│   │   ├── types.ts          # Shared TypeScript interfaces & types
│   │   ├── formatters.ts     # Size, date, duration, and aspect ratio utilities
│   │   └── constants.ts      # Magic signatures database & category definitions
│   ├── main/
│   │   ├── main.ts           # Electron main process & window management
│   │   ├── ipc.ts            # Secure IPC channel dispatchers
│   │   ├── detector.ts       # Binary magic bytes & extension mismatch engine
│   │   ├── hasher.ts         # Memory-streaming cryptographic hash engine
│   │   ├── store.ts          # Offline user data & history store
│   │   ├── exporter.ts       # Plaintext and JSON report generators
│   │   └── extractors/       # Category extractors (image, video, audio, pdf, archive, fallback)
│   ├── preload/
│   │   └── index.ts          # ContextBridge bridge exposing window.filePeekApi
│   └── renderer/
│       ├── App.tsx           # Main application state & theme orchestrator
│       ├── styles/           # CSS design system (themes.css, globals.css)
│       └── components/       # UI cards, dropzone, inspectors, modals
├── tests/                    # Vitest unit & integration test suites
└── scripts/                  # Build & development scripts
```

---

## 🚀 Getting Started

### Prerequisites
* Windows 10 or Windows 11
* Node.js v18+ (tested on Node v22 / v24)
* npm v9+

### Installation
```bash
git clone https://github.com/your-username/FilePeek.git
cd FilePeek
npm install
```

### Running in Development
```bash
npm run dev
```

### Running the Test Suite
```bash
npm test
```
The test suite covers:
* Magic byte detection & format matching
* Extension mismatch warnings
* Byte formatting & aspect ratio calculations
* Streaming cryptographic hashing & job cancellation
* ZIP central directory structure inspection
* PDF page count & metadata parsing
* Local settings & recent history persistence
* Report generation (TXT & JSON)

### Building the Production Desktop Application
```bash
# Build desktop executable and NSIS installer
npm run package

# Build standalone portable Windows executable
npm run package:portable
```
The resulting installers and binaries will be generated in the `release/` directory:
* `FilePeek-1.0.0-nsis-x64.exe` (Windows Installer with desktop shortcuts)
* `FilePeek-1.0.0-portable-x64.exe` (Standalone portable single-file binary)

---

## 📊 Supported Formats

| Category | Typical Formats | Inspected Properties |
|---|---|---|
| **Images** | JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG | Dimensions, aspect ratio, bit depth, color space, EXIF camera optics, safe preview |
| **Videos** | MP4, MKV, MOV, AVI, WebM | Duration, resolution, video codec, frame rate, audio codec, container format, bitrate |
| **Audio** | MP3, WAV, FLAC, AAC, OGG, M4A, Opus | Duration, bitrate, sample rate, channels, artist, album, title, embedded cover art |
| **Documents** | PDF | Page count, PDF version, title, author, subject, creator software, dates, encryption |
| **Archives** | ZIP | Contained files, directories, compressed/uncompressed sizes, ratio %, entry browser |
| **Executables** | EXE, DLL, SYS, ELF, Mach-O | PE/MZ header signatures, architecture classification, format verification |
| **Code & Data** | JSON, XML, HTML, CSS, JS, TS, CSV, TXT | Line count estimation, encoding, format identification |
| **Any Binary** | Any file format | Magic bytes, header hex/ASCII inspector, cryptographic hashes (SHA-256, SHA-1, MD5) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
