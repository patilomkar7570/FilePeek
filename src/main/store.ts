import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AppSettings, RecentFile } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

class LocalStore {
  private userDataPath: string = '';
  private settingsFilePath: string = '';
  private historyFilePath: string = '';
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private history: RecentFile[] = [];

  public init(customPath?: string) {
    this.settings = { ...DEFAULT_SETTINGS };
    this.history = [];

    try {
      this.userDataPath = customPath || (app ? app.getPath('userData') : process.cwd());
    } catch {
      this.userDataPath = process.cwd();
    }

    if (!fs.existsSync(this.userDataPath)) {
      try {
        fs.mkdirSync(this.userDataPath, { recursive: true });
      } catch {
        // ignore
      }
    }

    this.settingsFilePath = path.join(this.userDataPath, 'filepeek-settings.json');
    this.historyFilePath = path.join(this.userDataPath, 'filepeek-history.json');

    this.loadSettings();
    this.loadHistory();
  }

  private loadSettings() {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    return this.settings;
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  private loadHistory() {
    try {
      if (fs.existsSync(this.historyFilePath)) {
        const raw = fs.readFileSync(this.historyFilePath, 'utf8');
        const parsed: RecentFile[] = JSON.parse(raw);
        // Verify disk existence for each
        this.history = parsed.map((item) => ({
          ...item,
          existsOnDisk: fs.existsSync(item.filePath),
        }));
      }
    } catch {
      this.history = [];
    }
  }

  public getHistory(): RecentFile[] {
    // Update existsOnDisk status dynamically
    return this.history.map((item) => ({
      ...item,
      existsOnDisk: fs.existsSync(item.filePath),
    }));
  }

  public addRecentFile(entry: Omit<RecentFile, 'id' | 'inspectedAt' | 'existsOnDisk'>): RecentFile[] {
    if (!this.settings.historyEnabled) {
      return [];
    }

    // Remove duplicates of same file
    this.history = this.history.filter((item) => item.filePath !== entry.filePath);

    const newRecord: RecentFile = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      inspectedAt: new Date().toISOString(),
      existsOnDisk: true,
    };

    this.history.unshift(newRecord);

    const limit = this.settings.maxRecentFiles || 20;
    if (this.history.length > limit) {
      this.history = this.history.slice(0, limit);
    }

    try {
      fs.writeFileSync(this.historyFilePath, JSON.stringify(this.history, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to update history:', err);
    }

    return this.getHistory();
  }

  public removeRecentFile(id: string): RecentFile[] {
    this.history = this.history.filter((item) => item.id !== id);
    try {
      fs.writeFileSync(this.historyFilePath, JSON.stringify(this.history, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to update history:', err);
    }
    return this.getHistory();
  }

  public clearHistory(): RecentFile[] {
    this.history = [];
    try {
      if (fs.existsSync(this.historyFilePath)) {
        fs.unlinkSync(this.historyFilePath);
      }
    } catch {
      // ignore
    }
    return [];
  }

  public resetAllData(): { settings: AppSettings; history: RecentFile[] } {
    this.clearHistory();
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        fs.unlinkSync(this.settingsFilePath);
      }
    } catch {
      // ignore
    }
    return {
      settings: this.settings,
      history: [],
    };
  }
}

export const store = new LocalStore();
