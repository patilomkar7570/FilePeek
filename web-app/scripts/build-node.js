const fs = require('fs');
const path = require('path');
const babel = require('/usr/share/nodejs/@babel/core');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function compileDirectory(srcSubDir, distSubDir) {
  const fullSrc = path.join(SRC_DIR, srcSubDir);
  const fullDist = path.join(DIST_DIR, distSubDir);

  if (!fs.existsSync(fullSrc)) return;
  ensureDirSync(fullDist);

  const entries = fs.readdirSync(fullSrc, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(fullSrc, entry.name);
    if (entry.isDirectory()) {
      compileDirectory(path.join(srcSubDir, entry.name), path.join(distSubDir, entry.name));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      const outName = entry.name.replace(/\.ts$/, '.js');
      const distPath = path.join(fullDist, outName);
      const code = fs.readFileSync(srcPath, 'utf8');

      const result = babel.transformSync(code, {
        filename: srcPath,
        presets: ['/usr/share/nodejs/@babel/preset-typescript'],
        plugins: ['/usr/share/nodejs/@babel/plugin-transform-modules-commonjs'],
      });

      fs.writeFileSync(distPath, result.code, 'utf8');
      console.log(`Compiled: ${srcSubDir}/${entry.name} -> ${distSubDir}/${outName}`);
    }
  }
}

console.log('Building FilePeek Node & Electron Main Processes...');
compileDirectory('main', 'main');
compileDirectory('preload', 'preload');
compileDirectory('extractors', 'extractors');
compileDirectory('shared', 'shared');
console.log('Build completed successfully.');
