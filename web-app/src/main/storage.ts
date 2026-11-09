import * as fs from 'fs';
import * as path from 'path';
import { AppSettings, DEFAULT_APP_SETTINGS, RecentFileRecord, FileCategory } from '../shared/types';
import { formatBytes } from '../shared/formatters';

export class StorageManager {
  private configDir: string;
  private settingsFile: string;
  private recentsFile: string;
  private settings: AppSettings;
  private recents: RecentFileRecord[] = [];

  constructor(customDir?: string) {
    if (customDir) {
      this.configDir = customDir;
    } else {
      const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library/Application Support') : path.join(process.env.HOME || '', '.config'));
      this.configDir = path.join(appData, 'FilePeek');
    }

    this.settingsFile = path.join(this.configDir, 'settings.json');
    this.recentsFile = path.join(this.configDir, 'recents.json');
    this.settings = { ...DEFAULT_APP_SETTINGS };

    this.init();
  }

  private init(): void {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf8');
        this.settings = { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
      } else {
        this.saveSettings(this.settings);
      }

      if (fs.existsSync(this.recentsFile)) {
        const raw = fs.readFileSync(this.recentsFile, 'utf8');
        this.recents = JSON.parse(raw);
      }
    } catch (err) {
      // Fallback gracefully to default in-memory state
      this.settings = { ...DEFAULT_APP_SETTINGS };
      this.recents = [];
    }
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (err) {
      // ignore write failure
    }
    return this.getSettings();
  }

  public getRecentFiles(): RecentFileRecord[] {
    if (!this.settings.enableRecentHistory) {
      return [];
    }

    // Verify file existence gracefully
    return this.recents.map((entry) => {
      let exists = false;
      try {
        exists = fs.existsSync(entry.filePath);
      } catch {
        exists = false;
      }
      return { ...entry, exists };
    });
  }

  public addRecentFile(file: {
    fileName: string;
    filePath: string;
    fileSizeBytes: number;
    detectedFormat: string;
    category: FileCategory;
  }): void {
    if (!this.settings.enableRecentHistory) {
      return;
    }

    // Remove if already present
    this.recents = this.recents.filter((r) => r.filePath.toLowerCase() !== file.filePath.toLowerCase());

    const newRecord: RecentFileRecord = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSizeBytes: file.fileSizeBytes,
      fileSizeFormatted: formatBytes(file.fileSizeBytes),
      detectedFormat: file.detectedFormat,
      category: file.category,
      inspectedAt: new Date().toISOString(),
      exists: true,
    };

    this.recents.unshift(newRecord);

    // Limit to maxRecentEntries
    if (this.recents.length > this.settings.maxRecentEntries) {
      this.recents = this.recents.slice(0, this.settings.maxRecentEntries);
    }

    this.persistRecents();
  }

  public removeRecentFile(idOrPath: string): void {
    this.recents = this.recents.filter(
      (r) => r.id !== idOrPath && r.filePath.toLowerCase() !== idOrPath.toLowerCase()
    );
    this.persistRecents();
  }

  public clearRecentFiles(): void {
    this.recents = [];
    this.persistRecents();
  }

  private persistRecents(): void {
    try {
      fs.writeFileSync(this.recentsFile, JSON.stringify(this.recents, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }
}
