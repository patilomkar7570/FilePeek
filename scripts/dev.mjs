import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function startDev() {
  console.log('Starting FilePeek development environment...');

  // 1. Build main and preload
  await esbuild.build({
    entryPoints: [path.join(root, 'src/main/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outfile: path.join(root, 'dist/main/main.js'),
    external: ['electron'],
    sourcemap: true,
  });

  await esbuild.build({
    entryPoints: [path.join(root, 'src/preload/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outfile: path.join(root, 'dist/preload/index.js'),
    external: ['electron'],
    sourcemap: true,
  });

  // 2. Start Vite server
  const viteServer = await createServer({
    configFile: path.join(root, 'vite.config.ts'),
  });
  await viteServer.listen();
  const address = viteServer.httpServer?.address();
  const port = typeof address === 'object' && address ? address.port : 5173;
  const devUrl = `http://localhost:${port}`;
  console.log(`Vite development server running at: ${devUrl}`);

  // 3. Launch Electron
  const electronBinary = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
  const electronProcess = spawn(electronBinary, ['.'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: devUrl,
    },
  });

  electronProcess.on('close', async (code) => {
    console.log(`Electron closed with code ${code}`);
    await viteServer.close();
    process.exit(code ?? 0);
  });
}

startDev().catch((err) => {
  console.error('Failed to start dev environment:', err);
  process.exit(1);
});
