# FilePeek 🔍

> **Know Everything About Your Files.**  
> A privacy-focused, offline file inspector and technical metadata utility available as both a native Windows desktop application and a standalone web application.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Release](https://img.shields.io/badge/Release-v1.0-8B7CFF.svg)](https://github.com/patilomkar7570/filepeek/releases/tag/v1.0)
[![Platform](https://img.shields.io/badge/Platform-Windows%20x64%20%7C%20Web%20SPA-informational.svg)](#)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline-success.svg)](#)

---

## 📥 Downloads

Choose between the native **Windows Desktop Application** or the **Standalone Web Application**:

| Edition | File | Type | Description |
|---|---|---|---|
| 🪟 **Desktop Application** | [**`FilePeek.exe`**](https://github.com/patilomkar7570/filepeek/releases/download/v1.0/FilePeek.exe) | `.exe` (~105 MB) | Standalone portable Windows executable. No installation required—double-click to run immediately. |
| 🌐 **Web Application** | [**`FilePeek-Web.zip`**](https://github.com/patilomkar7570/filepeek/releases/download/v1.0/FilePeek-Web.zip) | `.zip` (~14 KB) | Standalone offline web application. Unzip and run `run.bat` or open `index.html` in any browser. |

> 🔒 **All releases are available on GitHub Releases:** [**View Release v1.0**](https://github.com/patilomkar7570/filepeek/releases/tag/v1.0)

---

## ✨ Features & Capabilities

Most operating systems identify files solely by their three-letter extension (`.pdf`, `.jpg`, `.mp4`). Malicious files can disguise executable payloads (`.exe`) with fake extensions. **FilePeek never trusts extensions alone.** It reads raw magic bytes and binary signatures to verify format authenticity.

### 🔬 10 Hidden Properties (Not Shown in Windows File Explorer)

1. **True Magic-Byte Signature (Hex):** Reads raw binary file headers (e.g. `89 50 4E 47` for PNG, `FF D8 FF` for JPEG, `4D 5A` for PE Executable).
2. **Extension Match Verification:** Detects disguise attempts immediately (e.g., alert if an `.exe` is masquerading as `.pdf`).
3. **Shannon Entropy (Randomness Score):** Measures byte distribution on an information scale (0.00 – 8.00 bits) to classify files as Plaintext/Code, Structured, or Compressed/Encrypted.
4. **Character Encoding & Byte Order Mark (BOM):** Identifies UTF-8 with BOM, UTF-16 LE/BE, and ASCII structures.
5. **Line Ending Convention & Line Counts:** Distinguishes Windows CRLF (`\r\n`) vs Unix LF (`\n`) and counts file lines.
6. **Null-Byte Density:** Calculates `0x00` padding density to reveal sparse structures or embedded binaries.
7. **Printable Text vs Binary Ratio:** Exact percentage split between ASCII printable characters and binary bytes.
8. **Drive Cluster Slack Space:** Computes the unused bytes allocated on standard 4096-byte NTFS filesystem clusters.
9. **SHA-256 Cryptographic Checksum:** Modern cryptographic verification hash with one-click copy.
10. **MD5 Checksum:** Classic cryptographic fingerprint for legacy verification.

### 💻 Raw Binary Hex Header Inspection
Inspect the first 32 bytes of any file in a monospace hex view showing memory offsets, hex pairs, and ASCII representation.

### 🎨 Clean Desktop Interface
* **Fluent Design Aesthetic:** Subtle glassmorphism, rounded cards, clean typography (Segoe UI Variable & Cascadia Code).
* **Theme Modes:** Light (`#FFFFFF`), Dark (`#0B0D12`), and automatic Windows System Theme sync.
* **Instant Window Launch:** Zero startup delay with immediate visual feedback.
* **Global Drag and Drop:** Drag any file anywhere into FilePeek to inspect it instantly.

### 🔒 Privacy & Offline Guarantee
* **100% Offline:** Runs entirely on your local machine with zero network requests.
* **Zero Cloud Uploads:** Your files never leave your device.
* **No Telemetry / No Tracking:** Zero analytics, metrics, or background pings.
* **Read-Only Inspection:** Never executes, runs, or alters inspected files.

---

## 📁 Repository Structure

```
filepeek/
├── app/                      # Electron Desktop Application
│   ├── main.js               # Main process, window lifecycle & single-instance lock
│   ├── index.html            # Renderer interface with embedded styles and logic
│   ├── icon.ico              # Multi-resolution Windows executable icon
│   └── icon.png              # High-resolution branding icon
├── web-app/                  # Standalone Web Application Edition
│   ├── index.html            # Single-file browser version (zero dependencies)
│   ├── filepeek-preview.html # Web preview source
│   ├── run.bat               # One-click browser launcher
│   └── src/                  # Web components, extractors & styles
├── resources/                # Branding assets & icons
│   ├── icon.ico              # Windows icon
│   └── filepeek-logo.png     # 1024x1024 vector-rendered logo
├── package.json              # Project configuration and build targets
├── LICENSE                   # Apache License 2.0
└── README.md                 # Project documentation
```

---

## 🛠️ Building From Source

### Prerequisites
* [Node.js](https://nodejs.org/) v18.0.0 or higher
* npm

### Setup
```bash
# Clone the repository
git clone https://github.com/patilomkar7570/filepeek.git
cd filepeek

# Install dependencies
npm install
```

### Running Locally
```bash
# Run the Electron desktop app
npm start

# Or launch the web app directly in your browser
start web-app/index.html
```

### Building Windows Executables
```bash
# Build standalone portable executable (.exe)
npm run package:portable

# Build NSIS setup installer (.exe)
npm run package
```
Compiled binaries are output to the `release/` directory.

---

## 📄 License

FilePeek is open-source software licensed under the **[Apache License 2.0](LICENSE)**.

```
Copyright 2026 Omkar Patil (patilomkar7570)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
