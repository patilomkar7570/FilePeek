# FilePeek 🔍

> **Know Everything About Your Files.**  
> A premium, privacy-focused Windows desktop file inspection and technical metadata utility.

![FilePeek Banner](https://raw.githubusercontent.com/filepeek/filepeek/main/resources/banner.png)

---

## 🌟 Overview

**FilePeek** is a fast, lightweight, and offline-first Windows utility designed for software engineers, digital forensic examiners, systems administrators, content creators, and power users. 

Drag and drop any file into FilePeek to instantly reveal its genuine file signature, technical metadata, dimensions, container codecs, archive tree, and cryptographic hashes.

### 🛡️ Why FilePeek?
Most operating systems identify files solely by their three-letter extension (`.jpg`, `.pdf`, `.mp4`). Malicious actors or corrupted systems can easily disguise executable payloads (`.exe`) as harmless documents (`invoice.pdf`). **FilePeek never trusts extensions alone.** It reads the file's raw magic bytes and binary signatures, alerting you immediately if an extension mismatch is detected.

---

## ✨ Key Features

### 1. File Format Detection & Mismatch Warning
* **True Magic-Byte Inspection:** Analyzes binary headers (first 512–4096 bytes) using high-precision signature matching across 25+ file standards.
* **Extension Mismatch Alerts:** Instantly highlights disguised files with a prominent warning: `File extension does not match detected format.`
* **Format Confidence Indicator:** Distinguishes between verified binary signatures, ASCII/UTF-8 structured text, and unverified extensions.

### 2. Advanced Technical Metadata Extractors
* 🖼️ **Images (JPEG, PNG, WebP, GIF, BMP, TIFF, SVG, AVIF):**
  * Width, height, aspect ratio (16:9, 4:3, 3:2, 1:1, etc.).
  * Color space (sRGB, RGBA, Grayscale, CMYK) and bit depth.
  * Deep EXIF parsing: Camera make, camera model, lens, aperture ($f$-number), exposure time, ISO speed, focal length, date taken, and editing software.
  * High-performance, memory-safe image preview.
* 🎥 **Videos (MP4, MKV, MOV, AVI, WebM):**
  * Exact duration, display resolution, and aspect ratio.
  * Video codec (`H.264/AVC`, `H.265/HEVC`, `VP9`, `AV1`), audio codec (`AAC`, `AC-3`, `Opus`), frame rate ($fps$), container format, and bitrate ($kbps$ / $Mbps$).
  * Built-in native container parser plus seamless FFprobe integration.
* 🎵 **Audio (MP3, WAV, FLAC, AAC, OGG, M4A, Opus):**
  * Exact duration, bitrate, sample rate ($Hz$), and channels (Mono/Stereo/Multi-channel).
  * Complete embedded ID3v2 & Vorbis tags: Track Title, Artist, Album, Release Year, Genre, and Track Number.
* 📄 **PDF Documents:**
  * PDF specification version (e.g., PDF 1.7, 2.0).
  * Exact page count.
  * Document Info Dictionary: Title, Author, Subject, Creator, Producer, Creation Date, Modification Date, and Encryption/Password protection status.
* 📦 **ZIP Archives:**
  * Archive directory exploration without unzipping.
  * Contained file count, directory count, compressed size, uncompressed size, and compression ratio.
  * Searchable table of internal filenames, sizes, modification timestamps, CRC-32 checksums, and encryption status.
  * Built-in Zip Bomb protection with entry thresholds and ratio limits.
* 📁 **Other Formats:**
  * Graceful fallback with reliable file size, timestamps, permissions, and magic-byte previews.

### 3. High-Speed Streaming Hashes
* **Supported Algorithms:** **SHA-256** (Modern secure standard), **SHA-1** (Legacy), and **MD5** (Legacy).
* **Chunked Streaming:** Reads files in 256 KB memory-efficient buffers—capable of hashing multi-gigabyte files without freezing the user interface.
* **Real-Time Progress & Cancellation:** Interactive progress bar with percentage and instant abort capability.
* **Copy Actions:** One-click copy buttons with toast confirmations.

### 4. Desktop File Utilities
* **Copy Properties:** Copy individual values or a clean, formatted plain-text file summary.
* **Export Reports:** Export complete technical reports as structured `.json` or human-readable `.txt`.
* **Reveal in Explorer:** Highlights the file in Windows File Explorer via native shell APIs.
* **Open File:** Safely launch the file in its default Windows application (only upon explicit user action).

### 5. Premium Windows UI / UX
* Designed with subtle glassmorphism, rounded cards, clean typography (Segoe UI Variable & Cascadia Code), and restrained shadows.
* Full theme support: **Dark Mode** (`#0B0D12`), **Light Mode** (`#F5F6FA`), and **System Appearance Sync**.
* Local recent-file history with existence verification for deleted or moved files.

---

## 🔒 Privacy & Security Model

FilePeek is built from the ground up for strict privacy and security:

* 🚫 **Zero Telemetry & Analytics:** No tracking scripts, pingbacks, or analytics SDKs.
* 🚫 **Zero Cloud Dependencies:** Operates 100% offline. No files are uploaded to any server.
* 🚫 **No Automatic Code Execution:** Never executes or executes scripts from inspected files.
* 🛡️ **Electron Hardening:**
  * `contextIsolation: true`
  * `nodeIntegration: false`
  * Strict typed preload bridge exposing only approved IPC methods.
  * File path and argument validation on every IPC message.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | [Electron](https://www.electronjs.org/) (Chromium + Node.js) |
| **Frontend** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite](https://vitejs.dev/) |
| **Styling** | Custom CSS (Glassmorphism, Windows Fluent Design tokens) |
| **Icons** | Custom Lucide-compatible pure SVG iconography |
| **Packaging** | [Electron Builder](https://www.electron.build/) (NSIS Installer & Portable Windows Executable) |
| **Hashing & I/O** | Node.js `crypto` & `fs` streaming APIs |

---

## 📂 Project Architecture

```
filepeek/
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── index.ts          # Window lifecycle & secure IPC handlers
│   │   └── storage.ts        # Local configuration & recents persistence
│   ├── preload/              # Isolated Preload Script
│   │   └── index.ts          # Typed contextBridge API
│   ├── extractors/           # Core File Intelligence Engines
│   │   ├── detector.ts       # Magic-byte detection & mismatch logic
│   │   ├── image.ts          # Image header & EXIF parser
│   │   ├── video.ts          # MP4/MOV/MKV/AVI parser & FFprobe bridge
│   │   ├── audio.ts          # MP3 ID3, WAV, FLAC, OGG parser
│   │   ├── pdf.ts            # PDF page counter & Info dictionary parser
│   │   ├── archive.ts        # ZIP central directory inspector
│   │   ├── hasher.ts         # Multi-hash streaming pipeline
│   │   ├── inspector.ts      # Unified inspection orchestrator
│   │   └── reporter.ts       # TXT & JSON report exporter
│   ├── shared/               # Shared TypeScript Interfaces & Formatters
│   │   ├── types.ts          # Shared data contracts
│   │   └── formatters.ts     # Size, duration, and aspect ratio utilities
│   └── renderer/             # React UI Layer
│       ├── index.html        # HTML entry point with CSP
│       └── src/
│           ├── App.tsx       # Root view router & toast manager
│           ├── main.tsx      # React DOM bootstrap
│           ├── components/
│           │   ├── Sidebar.tsx        # Navigation & theme controls
│           │   ├── HomeView.tsx       # Drag-and-drop zone & recents
│           │   ├── DashboardView.tsx  # Inspection dashboard cards
│           │   ├── SettingsView.tsx   # Preferences & privacy view
│           │   └── Icons.tsx          # Lucide SVG icon set
│           └── styles/
│               └── index.css          # Custom Fluent design system
├── tests/                    # Comprehensive Test Suite
│   ├── fixtures/             # Automated test fixture generator
│   └── run-all-tests.js      # 16-domain test runner (91 automated tests)
├── package.json              # Package metadata & build scripts
├── tsconfig.json             # Root TypeScript config
├── tsconfig.node.json        # Main process TS config
├── tsconfig.web.json         # Renderer TS config
├── vite.config.ts            # Vite bundler config
└── LICENSE                   # MIT License
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v18.0.0 or higher
* npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/filepeek/filepeek.git
cd filepeek

# Install dependencies
npm install
```

### Running in Development
```bash
# Start Vite development server & Electron
npm run dev
```

### Running Tests
Execute the comprehensive automated test suite covering all 16 domains:
```bash
npm test
```

### Building for Windows
```bash
# 1. Compile TypeScript and bundle frontend
npm run build

# 2. Package Windows NSIS Installer (.exe)
npm run package:win

# 3. Package Windows Portable Executable (.exe)
npm run package:win-portable
```
Artifacts are generated in the `release/` directory:
* `FilePeek Setup 1.0.0.exe` (NSIS Installer)
* `FilePeek-Portable-1.0.0.exe` (Standalone Portable Executable)

---

## 📄 License

FilePeek is open-source software licensed under the **[MIT License](LICENSE)**.
Distributed freely for personal, academic, and commercial use.
