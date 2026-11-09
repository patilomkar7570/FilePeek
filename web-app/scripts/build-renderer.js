const fs = require('fs');
const path = require('path');

const DIST_RENDERER = path.join(__dirname, '../dist/renderer');
const SRC_RENDERER = path.join(__dirname, '../src/renderer');

if (!fs.existsSync(DIST_RENDERER)) {
  fs.mkdirSync(DIST_RENDERER, { recursive: true });
}

// Copy styles
const cssPath = path.join(SRC_RENDERER, 'src/styles/index.css');
if (fs.existsSync(cssPath)) {
  fs.copyFileSync(cssPath, path.join(DIST_RENDERER, 'index.css'));
}

// Prepare distribution index.html
const htmlTemplate = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;" />
    <title>FilePeek – Know Everything About Your Files</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>`;

fs.writeFileSync(path.join(DIST_RENDERER, 'index.html'), htmlTemplate, 'utf8');
console.log('Renderer distribution assets generated in dist/renderer.');
