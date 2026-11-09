import { contextBridge, ipcRenderer } from 'electron';
import {
  FileInspectionResult,
  HashComputeRequest,
  HashProgressResult,
  ExportReportOptions,
  RecentFile,
  AppSettings,
} from '../shared/types';

export interface FilePeekApi {
  inspectFile: (filePath: string) => Promise<FileInspectionResult>;
  selectFileWithDialog: () => Promise<string | null>;
  computeHash: (request: HashComputeRequest) => Promise<HashProgressResult>;
  cancelHash: (requestId: string) => Promise<boolean>;
  onHashProgress: (requestId: string, callback: (progress: number) => void) => () => void;
  exportReport: (options: ExportReportOptions) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  revealInExplorer: (filePath: string) => Promise<boolean>;
  openWithDefaultApp: (filePath: string) => Promise<string>;
  getRecentFiles: () => Promise<RecentFile[]>;
  removeRecentFile: (id: string) => Promise<RecentFile[]>;
  clearRecentFiles: () => Promise<RecentFile[]>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (newSettings: Partial<AppSettings>) => Promise<AppSettings>;
  resetAllData: () => Promise<{ settings: AppSettings; history: RecentFile[] }>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

const api: FilePeekApi = {
  inspectFile: (filePath: string) => ipcRenderer.invoke('file:inspect', filePath),
  selectFileWithDialog: () => ipcRenderer.invoke('file:select-dialog'),
  computeHash: (request: HashComputeRequest) => ipcRenderer.invoke('file:compute-hash', request),
  cancelHash: (requestId: string) => ipcRenderer.invoke('file:cancel-hash', requestId),
  onHashProgress: (requestId: string, callback: (progress: number) => void) => {
    const channel = `hash:progress:${requestId}`;
    const listener = (_: any, progress: number) => callback(progress);
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
  exportReport: (options: ExportReportOptions) => ipcRenderer.invoke('file:export-report', options),
  revealInExplorer: (filePath: string) => ipcRenderer.invoke('file:reveal', filePath),
  openWithDefaultApp: (filePath: string) => ipcRenderer.invoke('file:open-with-default-app', filePath),
  getRecentFiles: () => ipcRenderer.invoke('store:get-recent-files'),
  removeRecentFile: (id: string) => ipcRenderer.invoke('store:remove-recent-file', id),
  clearRecentFiles: () => ipcRenderer.invoke('store:clear-recent-files'),
  getSettings: () => ipcRenderer.invoke('store:get-settings'),
  saveSettings: (newSettings: Partial<AppSettings>) => ipcRenderer.invoke('store:save-settings', newSettings),
  resetAllData: () => ipcRenderer.invoke('store:reset-all'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('filePeekApi', api);
