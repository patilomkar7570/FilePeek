import * as esbuild from 'esbuild';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const isWatch = process.argv.includes('--watch');

async function buildMainAndPreload() {
  console.log('Building Electron main process and preload...');

  // Main process
  const mainCtx = await esbuild.context({
    entryPoints: [path.join(root, 'src/main/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outfile: path.join(root, 'dist/main/main.js'),
    external: ['electron'],
    sourcemap: true,
  });

  // Preload script
  const preloadCtx = await esbuild.context({
    entryPoints: [path.join(root, 'src/preload/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outfile: path.join(root, 'dist/preload/index.js'),
    external: ['electron'],
    sourcemap: true,
  });

  if (isWatch) {
    await mainCtx.watch();
    await preloadCtx.watch();
    console.log('Watching for changes in main and preload...');
  } else {
    await mainCtx.rebuild();
    await preloadCtx.rebuild();
    await mainCtx.dispose();
    await preloadCtx.dispose();
    console.log('Main and preload built successfully.');
  }
}

buildMainAndPreload().catch((err) => {
  console.error(err);
  process.exit(1);
});
