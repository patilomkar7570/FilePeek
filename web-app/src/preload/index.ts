import { contextBridge, ipcRenderer } from 'electron';
import {
  FileInspectionResult,
  AppSettings,
  RecentFileRecord,
  FileHashResult,
  HashProgressUpdate,
} from '../shared/types';

/**
 * FilePeek Secure Preload Script
 * Exposes strictly validated, scoped methods to the renderer process.
 */

export interface FilePeekApi {
  // File Inspection
  inspectFile: (filePath: string) => Promise<FileInspectionResult>;
  openFileDialog: () => Promise<string | null>;

  // Hashing
  calculateHashes: (
    filePath: string,
    algorithms: Array<'sha256' | 'sha1' | 'md5'>,
    onProgress?: (progress: HashProgressUpdate) => void
  ) => Promise<Partial<Record<'sha256' | 'sha1' | 'md5', FileHashResult>>>;
  cancelHashCalculation: () => Promise<void>;

  // Utilities
  revealInExplorer: (filePath: string) => Promise<boolean>;
  openFileWithDefaultApp: (filePath: string) => Promise<boolean>;
  exportReport: (
    format: 'txt' | 'json',
    defaultFileName: string,
    content: string
  ) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean }>;
  copyToClipboard: (text: string) => Promise<void>;

  // Settings & Recents
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  getRecentFiles: () => Promise<RecentFileRecord[]>;
  removeRecentFile: (idOrPath: string) => Promise<void>;
  clearRecentFiles: () => Promise<void>;

  // App Metadata
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
}

const api: FilePeekApi = {
  inspectFile: (filePath: string) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return Promise.reject(new Error('Invalid file path.'));
    }
    return ipcRenderer.invoke('file:inspect', filePath);
  },

  openFileDialog: () => ipcRenderer.invoke('dialog:open-file'),

  calculateHashes: (filePath, algorithms, onProgress) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return Promise.reject(new Error('Invalid file path.'));
    }

    if (onProgress) {
      const progressListener = (_event: any, update: HashProgressUpdate) => {
        onProgress(update);
      };
      ipcRenderer.on('hash:progress', progressListener);
      return ipcRenderer
        .invoke('file:calculate-hashes', filePath, algorithms)
        .finally(() => {
          ipcRenderer.removeListener('hash:progress', progressListener);
        });
    }

    return ipcRenderer.invoke('file:calculate-hashes', filePath, algorithms);
  },

  cancelHashCalculation: () => ipcRenderer.invoke('file:cancel-hashes'),

  revealInExplorer: (filePath: string) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return Promise.reject(new Error('Invalid file path.'));
    }
    return ipcRenderer.invoke('file:reveal-in-explorer', filePath);
  },

  openFileWithDefaultApp: (filePath: string) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return Promise.reject(new Error('Invalid file path.'));
    }
    return ipcRenderer.invoke('file:open-default', filePath);
  },

  exportReport: (format, defaultFileName, content) => {
    return ipcRenderer.invoke('file:export-report', { format, defaultFileName, content });
  },

  copyToClipboard: (text: string) => {
    return ipcRenderer.invoke('clipboard:write-text', text);
  },

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  getRecentFiles: () => ipcRenderer.invoke('recents:get'),
  removeRecentFile: (idOrPath) => ipcRenderer.invoke('recents:remove', idOrPath),
  clearRecentFiles: () => ipcRenderer.invoke('recents:clear'),

  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
};

contextBridge.exposeInMainWorld('filePeekApi', api);
