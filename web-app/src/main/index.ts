import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { StorageManager } from './storage';
import { inspectFile } from '../extractors/inspector';
import { calculateFileHashes } from '../extractors/hasher';
import { HashProgressUpdate } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
const storage = new StorageManager();
let currentHashCancellation = { isCancelled: false };

function createWindow(): void {
  const settings = storage.getSettings();

  mainWindow = new BrowserWindow({
    width: 1120,
    height: 800,
    minWidth: 880,
    minHeight: 620,
    backgroundColor: settings.theme === 'light' ? '#F5F6FA' : '#0B0D12',
    title: 'FilePeek – Know Everything About Your Files',
    autoHideMenuBar: true,
    show: false, // show when ready-to-show to prevent flash
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load Vite dev server in development or dist/index.html in production
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Register Secure IPC Handlers
 */
function setupIpcHandlers(): void {
  // 1. Inspect File
  ipcMain.handle('file:inspect', async (_event, targetPath: string) => {
    if (typeof targetPath !== 'string' || !targetPath.trim()) {
      throw new Error('Invalid file path provided.');
    }

    const resolved = path.resolve(targetPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File does not exist at "${targetPath}".`);
    }

    const settings = storage.getSettings();
    const result = await inspectFile(resolved, {
      calculateInitialHash: true,
      maxPreviewSizeBytes: settings.maxImagePreviewSizeBytes,
      maxArchiveScanEntries: settings.maxArchiveScanEntries,
    });

    // Add to recents
    storage.addRecentFile({
      fileName: result.general.fileName,
      filePath: result.general.filePath,
      fileSizeBytes: result.general.fileSizeBytes,
      detectedFormat: result.format.detectedFormat,
      category: result.format.category,
    });

    return result;
  });

  // 2. Open File Dialog
  ipcMain.handle('dialog:open-file', async () => {
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select a File to Inspect with FilePeek',
      properties: ['openFile'],
      buttonLabel: 'Inspect File',
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }
    return filePaths[0];
  });

  // 3. Streaming Hashes
  ipcMain.handle('file:calculate-hashes', async (event, targetPath: string, algorithms: Array<'sha256' | 'sha1' | 'md5'>) => {
    if (typeof targetPath !== 'string' || !fs.existsSync(targetPath)) {
      throw new Error('File not found for hash calculation.');
    }

    currentHashCancellation = { isCancelled: false };

    return calculateFileHashes({
      filePath: targetPath,
      algorithms: algorithms && algorithms.length > 0 ? algorithms : ['sha256', 'sha1', 'md5'],
      signal: currentHashCancellation,
      onProgress: (progress: HashProgressUpdate) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('hash:progress', progress);
        }
      },
    });
  });

  // 4. Cancel Hashes
  ipcMain.handle('file:cancel-hashes', async () => {
    currentHashCancellation.isCancelled = true;
    return true;
  });

  // 5. Reveal in Explorer
  ipcMain.handle('file:reveal-in-explorer', async (_event, targetPath: string) => {
    if (typeof targetPath === 'string' && fs.existsSync(targetPath)) {
      shell.showItemInFolder(targetPath);
      return true;
    }
    return false;
  });

  // 6. Open File with Default App (User-initiated only)
  ipcMain.handle('file:open-default', async (_event, targetPath: string) => {
    if (typeof targetPath === 'string' && fs.existsSync(targetPath)) {
      const err = await shell.openPath(targetPath);
      return err === '';
    }
    return false;
  });

  // 7. Export Report
  ipcMain.handle('file:export-report', async (_event, payload: { format: 'txt' | 'json'; defaultFileName: string; content: string }) => {
    if (!mainWindow) return { success: false };
    const { format, defaultFileName, content } = payload;

    const ext = format === 'json' ? 'json' : 'txt';
    const filterName = format === 'json' ? 'JSON Data (*.json)' : 'Text Report (*.txt)';

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export FilePeek Report',
      defaultPath: defaultFileName.endsWith(`.${ext}`) ? defaultFileName : `${defaultFileName}.${ext}`,
      filters: [{ name: filterName, extensions: [ext] }],
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    await fs.promises.writeFile(filePath, content, 'utf8');
    return { success: true, filePath };
  });

  // 8. Clipboard
  ipcMain.handle('clipboard:write-text', async (_event, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  // 9. Settings
  ipcMain.handle('settings:get', async () => storage.getSettings());
  ipcMain.handle('settings:save', async (_event, newSettings) => storage.saveSettings(newSettings));

  // 10. Recents
  ipcMain.handle('recents:get', async () => storage.getRecentFiles());
  ipcMain.handle('recents:remove', async (_event, idOrPath: string) => storage.removeRecentFile(idOrPath));
  ipcMain.handle('recents:clear', async () => storage.clearRecentFiles());

  // 11. App Metadata
  ipcMain.handle('app:version', async () => app.getVersion() || '1.0.0');
  ipcMain.handle('app:platform', async () => process.platform);
}
