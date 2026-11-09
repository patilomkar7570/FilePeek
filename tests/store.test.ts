import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { store } from '../src/main/store';

describe('Local Store & Settings Persistence', () => {
  const tempDir = path.join(os.tmpdir(), `filepeek_test_store_${Date.now()}`);

  beforeEach(() => {
    fs.mkdirSync(tempDir, { recursive: true });
    store.init(tempDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('saves and retrieves user settings', () => {
    const updated = store.saveSettings({ theme: 'light', historyEnabled: true });
    expect(updated.theme).toBe('light');

    const retrieved = store.getSettings();
    expect(retrieved.theme).toBe('light');
  });

  it('tracks recent files and verifies disk existence', () => {
    const testFile = path.join(tempDir, 'existing_file.txt');
    fs.writeFileSync(testFile, 'Hello');

    store.addRecentFile({
      filePath: testFile,
      fileName: 'existing_file.txt',
      fileExtension: '.txt',
      sizeBytes: 5,
      sizeFormatted: '5 B',
      detectedFormat: 'Plain Text',
      category: 'text',
    });

    const history = store.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].fileName).toBe('existing_file.txt');
    expect(history[0].existsOnDisk).toBe(true);

    // If file is deleted from disk
    fs.unlinkSync(testFile);
    const updatedHistory = store.getHistory();
    expect(updatedHistory[0].existsOnDisk).toBe(false);
  });

  it('removes individual recent items', () => {
    const file1 = path.join(tempDir, 'f1.txt');
    const file2 = path.join(tempDir, 'f2.txt');
    fs.writeFileSync(file1, '1');
    fs.writeFileSync(file2, '2');

    store.addRecentFile({
      filePath: file1,
      fileName: 'f1.txt',
      fileExtension: '.txt',
      sizeBytes: 1,
      sizeFormatted: '1 B',
      detectedFormat: 'Plain Text',
      category: 'text',
    });

    store.addRecentFile({
      filePath: file2,
      fileName: 'f2.txt',
      fileExtension: '.txt',
      sizeBytes: 1,
      sizeFormatted: '1 B',
      detectedFormat: 'Plain Text',
      category: 'text',
    });

    const initial = store.getHistory();
    expect(initial.length).toBe(2);

    const afterRemove = store.removeRecentFile(initial[0].id);
    expect(afterRemove.length).toBe(1);
  });

  it('clears all history on request', () => {
    const file = path.join(tempDir, 'f.txt');
    fs.writeFileSync(file, 'test');

    store.addRecentFile({
      filePath: file,
      fileName: 'f.txt',
      fileExtension: '.txt',
      sizeBytes: 4,
      sizeFormatted: '4 B',
      detectedFormat: 'Plain Text',
      category: 'text',
    });

    store.clearHistory();
    expect(store.getHistory().length).toBe(0);
  });

  it('resets all data to clean default state', () => {
    store.saveSettings({ theme: 'light' });
    const reset = store.resetAllData();
    expect(reset.settings.theme).toBe('system');
    expect(reset.history.length).toBe(0);
  });
});
