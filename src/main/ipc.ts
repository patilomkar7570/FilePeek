import * as fs from 'fs';
import * as path from 'path';
import { ipcMain, dialog, BrowserWindow } from 'electron';
import {
  FileInspectionResult,
  GeneralFileInfo,
  ExportReportOptions,
  HashComputeRequest,
  AppSettings,
} from '../shared/types';
import { formatBytes } from '../shared/formatters';
import { detectFormatAndCategory } from './detector';
import { extractMetadataForCategory } from './extractors';
import { computeFileHashes, cancelHashJob } from './hasher';
import { store } from './store';
import { exportReportToFile, openFileWithDefaultApp, revealInExplorer } from './exporter';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // 1. Inspect File
  ipcMain.handle('file:inspect', async (_, filePathArg: unknown): Promise<FileInspectionResult> => {
    if (typeof filePathArg !== 'string' || !filePathArg.trim()) {
      throw new Error('Invalid file path argument provided.');
    }

    const resolvedPath = path.resolve(filePathArg.trim());

    // Security check: Verify file exists
    let stats: fs.Stats;
    try {
      stats = await fs.promises.stat(resolvedPath);
    } catch {
      throw new Error(`The file does not exist or cannot be accessed at: ${resolvedPath}`);
    }

    if (stats.isDirectory()) {
      throw new Error(`The selected item is a folder. FilePeek is optimized for inspecting individual files and archive containers.`);
    }

    const fileName = path.basename(resolvedPath);
    const fileExtension = path.extname(resolvedPath).toLowerCase();
    const directory = path.dirname(resolvedPath);

    // Format detection & magic bytes inspection
    const detection = await detectFormatAndCategory(resolvedPath);

    // Metadata extraction based on category
    const metadata = await extractMetadataForCategory(
      resolvedPath,
      detection.category,
      detection.detectedFormat,
      detection.mimeType,
      stats.size,
      detection.sampleBuffer
    );

    const generalInfo: GeneralFileInfo = {
      fileName,
      fileExtension,
      detectedFormat: detection.detectedFormat,
      mimeType: detection.mimeType,
      sizeBytes: stats.size,
      sizeFormatted: formatBytes(stats.size),
      filePath: resolvedPath,
      directory,
      createdTime: stats.birthtime ? stats.birthtime.toISOString() : null,
      modifiedTime: stats.mtime ? stats.mtime.toISOString() : null,
      accessedTime: stats.atime ? stats.atime.toISOString() : null,
      isReadOnly: (stats.mode & 0o200) === 0,
      isHidden: fileName.startsWith('.'),
    };

    const inspectionResult: FileInspectionResult = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      general: generalInfo,
      verification: detection.verification,
      category: detection.category,
      image: metadata.image,
      video: metadata.video,
      audio: metadata.audio,
      pdf: metadata.pdf,
      archive: metadata.archive,
      fallback: metadata.fallback,
    };

    // Save to recent files history if enabled
    try {
      store.addRecentFile({
        filePath: resolvedPath,
        fileName,
        fileExtension,
        sizeBytes: stats.size,
        sizeFormatted: generalInfo.sizeFormatted,
        detectedFormat: detection.detectedFormat,
        category: detection.category,
      });
    } catch (err) {
      console.error('Failed to append to recent files history:', err);
    }

    return inspectionResult;
  });

  // 2. Select file via native dialog
  ipcMain.handle('file:select-dialog', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select File to Inspect',
      properties: ['openFile'],
      buttonLabel: 'Inspect File',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // 3. Compute Hashes Streaming
  ipcMain.handle('file:compute-hash', async (_, request: HashComputeRequest) => {
    const { filePath, algorithms, requestId } = request;
    if (!filePath || !algorithms || !requestId) {
      throw new Error('Invalid hash computation request parameters.');
    }

    return computeFileHashes(filePath, algorithms, requestId, (progress) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`hash:progress:${requestId}`, progress);
      }
    });
  });

  // 4. Cancel Hash
  ipcMain.handle('file:cancel-hash', async (_, requestId: string) => {
    if (typeof requestId !== 'string') return false;
    return cancelHashJob(requestId);
  });

  // 5. Export Report
  ipcMain.handle('file:export-report', async (_, options: ExportReportOptions) => {
    if (!options || !options.format || !options.result) {
      throw new Error('Invalid export report options.');
    }
    return exportReportToFile(mainWindow, options.format, options.result);
  });

  // 6. Reveal in Explorer
  ipcMain.handle('file:reveal', async (_, filePath: string) => {
    if (typeof filePath !== 'string') return false;
    return revealInExplorer(filePath);
  });

  // 7. Open with Default App
  ipcMain.handle('file:open-with-default-app', async (_, filePath: string) => {
    if (typeof filePath !== 'string') throw new Error('Invalid file path.');
    return openFileWithDefaultApp(filePath);
  });

  // 8. Recent files store
  ipcMain.handle('store:get-recent-files', async () => {
    return store.getHistory();
  });

  ipcMain.handle('store:remove-recent-file', async (_, id: string) => {
    return store.removeRecentFile(id);
  });

  ipcMain.handle('store:clear-recent-files', async () => {
    return store.clearHistory();
  });

  // 9. Settings
  ipcMain.handle('store:get-settings', async () => {
    return store.getSettings();
  });

  ipcMain.handle('store:save-settings', async (_, newSettings: Partial<AppSettings>) => {
    return store.saveSettings(newSettings);
  });

  ipcMain.handle('store:reset-all', async () => {
    return store.resetAllData();
  });

  // 10. Window Controls
  ipcMain.on('window:minimize', () => {
    if (!mainWindow.isDestroyed()) mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (!mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window:close', () => {
    if (!mainWindow.isDestroyed()) mainWindow.close();
  });
}
