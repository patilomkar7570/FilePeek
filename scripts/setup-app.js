const fs = require('fs');
const path = require('path');

const srcHtml = path.join(__dirname, '..', 'web-app', 'index.html');
const destHtml = path.join(__dirname, '..', 'app', 'index.html');

let html = fs.readFileSync(srcHtml, 'utf8');

// Ensure global drag-and-drop works anywhere on the window and prevents Chromium default file navigation
if (!html.includes("window.addEventListener('dragover'")) {
  html = html.replace(
    "setTheme('system');",
    `// Global drag-and-drop across entire window
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        inspectFileObject(e.dataTransfer.files[0]);
      }
    });

    setTheme('system');`
  );
}

// Ensure hashing very large files does not crash renderer if ArrayBuffer exceeds memory limit
const origHash = `      const fullBuffer = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest('SHA-256', fullBuffer);
      const sha256Hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

      // MD5 calculation
      const md5Hex = computeMd5(new Uint8Array(fullBuffer.slice(0, 1048576)));`;

const safeHash = `      let sha256Hex = '';
      let md5Hex = '';
      try {
        const fullBuffer = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', fullBuffer);
        sha256Hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
        md5Hex = computeMd5(new Uint8Array(fullBuffer.slice(0, 1048576)));
      } catch (err) {
        sha256Hex = 'Calculation skipped (file exceeds memory limits)';
        md5Hex = 'Calculation skipped';
      }`;

if (html.includes(origHash)) {
  html = html.replace(origHash, safeHash);
}

fs.writeFileSync(destHtml, html, 'utf8');
console.log('Successfully updated app/index.html with byte length:', html.length);
