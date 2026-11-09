import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { RecentFiles } from './components/RecentFiles';
import { SupportedFormats } from './components/SupportedFormats';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SettingsModal } from './components/SettingsModal';
import { FileInspectionResult, RecentFile, AppSettings, ThemeMode } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeResult, setActiveResult] = useState<FileInspectionResult | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Load initial settings and history
  useEffect(() => {
    async function loadInitialData() {
      if (window.filePeekApi) {
        try {
          const loadedSettings = await window.filePeekApi.getSettings();
          if (loadedSettings) {
            setSettings(loadedSettings);
          }
          const loadedHistory = await window.filePeekApi.getRecentFiles();
          if (loadedHistory) {
            setRecentFiles(loadedHistory);
          }
        } catch (err) {
          console.error('Failed to load initial settings/history:', err);
        }
      }
    }
    loadInitialData();
  }, []);

  // Theme synchronization
  useEffect(() => {
    const applyTheme = (themeMode: ThemeMode) => {
      let resolvedTheme: 'dark' | 'light' = 'dark';
      if (themeMode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = prefersDark ? 'dark' : 'light';
      } else {
        resolvedTheme = themeMode;
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme(settings.theme);

    // Watch system theme change if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [settings.theme]);

  // Handle file inspection
  const inspectFilePath = useCallback(async (filePath: string) => {
    if (!filePath) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (window.filePeekApi?.inspectFile) {
        const result = await window.filePeekApi.inspectFile(filePath);
        setActiveResult(result);

        // Refresh recent files list
        const updatedHistory = await window.filePeekApi.getRecentFiles();
        if (updatedHistory) {
          setRecentFiles(updatedHistory);
        }
      }
    } catch (err: any) {
      console.error('Inspection failed:', err);
      setErrorMessage(err.message || 'Failed to inspect file.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Window drag-and-drop listener to support dropping anywhere
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const filePath = (file as any).path;
        if (filePath) {
          inspectFilePath(filePath);
        }
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [inspectFilePath]);

  const handleThemeCycle = async () => {
    const modes: ThemeMode[] = ['dark', 'light', 'system'];
    const nextIndex = (modes.indexOf(settings.theme) + 1) % modes.length;
    const nextTheme = modes[nextIndex];

    const updated = await window.filePeekApi?.saveSettings({ theme: nextTheme });
    if (updated) {
      setSettings(updated);
    } else {
      setSettings((prev) => ({ ...prev, theme: nextTheme }));
    }
  };

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    const updated = await window.filePeekApi?.saveSettings(partial);
    if (updated) {
      setSettings(updated);
    } else {
      setSettings((prev) => ({ ...prev, ...partial }));
    }
  };

  const handleClearHistory = async () => {
    await window.filePeekApi?.clearRecentFiles();
    setRecentFiles([]);
  };

  const handleRemoveRecentItem = async (id: string) => {
    const updated = await window.filePeekApi?.removeRecentFile(id);
    if (updated) {
      setRecentFiles(updated);
    }
  };

  const handleResetAllData = async () => {
    const res = await window.filePeekApi?.resetAllData();
    if (res) {
      setSettings(res.settings);
      setRecentFiles([]);
      setActiveResult(null);
    }
    setIsSettingsOpen(false);
  };

  return (
    <div className="app-container">
      <TitleBar currentFileName={activeResult?.general.fileName} />

      <Header
        theme={settings.theme}
        onThemeCycle={handleThemeCycle}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isInspectingFile={activeResult !== null}
        onNewInspection={() => {
          setActiveResult(null);
          setErrorMessage(null);
        }}
      />

      <main className="main-wrapper">
        {activeResult ? (
          <Dashboard
            result={activeResult}
            onBackToHome={() => {
              setActiveResult(null);
              setErrorMessage(null);
            }}
          />
        ) : (
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 24px', width: '100%' }}>
            {errorMessage && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-subtle)',
                  border: '1px solid rgba(255, 92, 92, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--danger)',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <DropZone onFileSelected={inspectFilePath} isLoading={isLoading} />

            <RecentFiles
              recentFiles={recentFiles}
              onSelectRecent={inspectFilePath}
              onRemoveRecent={handleRemoveRecentItem}
              onClearHistory={handleClearHistory}
            />

            <SupportedFormats />

            {/* Privacy Note */}
            <div
              style={{
                marginTop: '32px',
                padding: '16px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
              <span>
                100% Offline & Private. Files are inspected locally on your Windows device. No files or telemetry are ever uploaded.
              </span>
            </div>
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearHistory={handleClearHistory}
        onResetAll={handleResetAllData}
      />
    </div>
  );
};
