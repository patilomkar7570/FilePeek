import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import {
  FileInspectionResult,
  AppSettings,
  DEFAULT_APP_SETTINGS,
  RecentFileRecord,
} from '../../shared/types';
import './styles/index.css';

interface ToastItem {
  id: string;
  message: string;
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'settings'>('home');
  const [activeInspection, setActiveInspection] = useState<FileInspectionResult | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFileRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Show Toast Helper
  const showToast = (message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Load Initial Settings & Recents
  useEffect(() => {
    const loadAppData = async () => {
      if ((window as any).filePeekApi) {
        try {
          const loadedSettings = await (window as any).filePeekApi.getSettings();
          if (loadedSettings) setSettings(loadedSettings);

          const recents = await (window as any).filePeekApi.getRecentFiles();
          if (recents) setRecentFiles(recents);

          const ver = await (window as any).filePeekApi.getAppVersion();
          if (ver) setAppVersion(ver);
        } catch {
          // fallback to defaults
        }
      }
    };
    loadAppData();
  }, []);

  // Theme Sync Effect
  useEffect(() => {
    const applyTheme = (theme: 'dark' | 'light' | 'system') => {
      let resolvedTheme = theme;
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = prefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme(settings.theme);

    // Listen to system changes if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.theme]);

  // Global Drag and Drop Handler
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const filePath = (file as any).path || file.name;
        handleFileSelected(filePath);
      }
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // File Inspection Handler
  const handleFileSelected = async (filePath: string) => {
    if (!filePath || typeof filePath !== 'string') return;
    setIsLoading(true);

    try {
      if ((window as any).filePeekApi?.inspectFile) {
        const result = await (window as any).filePeekApi.inspectFile(filePath);
        setActiveInspection(result);
        setCurrentView('dashboard');
        showToast(`Inspected "${result.general.fileName}"`);

        // Refresh recents
        const updatedRecents = await (window as any).filePeekApi.getRecentFiles();
        if (updatedRecents) setRecentFiles(updatedRecents);
      } else {
        showToast(`Running in preview mode: ${filePath}`);
      }
    } catch (err: any) {
      showToast(`Error inspecting file: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseClick = async () => {
    if ((window as any).filePeekApi?.openFileDialog) {
      try {
        const selectedPath = await (window as any).filePeekApi.openFileDialog();
        if (selectedPath) {
          handleFileSelected(selectedPath);
        }
      } catch (err: any) {
        showToast(`Browse error: ${err.message || 'Could not open dialog'}`);
      }
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if ((window as any).filePeekApi?.saveSettings) {
      await (window as any).filePeekApi.saveSettings(newSettings);
    }
  };

  const handleRemoveRecent = async (idOrPath: string) => {
    setRecentFiles((prev) => prev.filter((r) => r.id !== idOrPath && r.filePath !== idOrPath));
    if ((window as any).filePeekApi?.removeRecentFile) {
      await (window as any).filePeekApi.removeRecentFile(idOrPath);
    }
  };

  const handleClearRecents = async () => {
    setRecentFiles([]);
    if ((window as any).filePeekApi?.clearRecentFiles) {
      await (window as any).filePeekApi.clearRecentFiles();
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        settings={settings}
        onThemeChange={(theme) => handleUpdateSettings({ theme })}
        hasActiveInspection={activeInspection !== null}
        appVersion={appVersion}
      />

      <main className="main-viewport">
        {currentView === 'home' && (
          <HomeView
            onFileSelected={handleFileSelected}
            onBrowseClick={handleBrowseClick}
            recentFiles={recentFiles}
            onRemoveRecent={handleRemoveRecent}
            onClearRecents={handleClearRecents}
            isHistoryEnabled={settings.enableRecentHistory}
            isLoading={isLoading}
          />
        )}

        {currentView === 'dashboard' && activeInspection && (
          <DashboardView
            inspection={activeInspection}
            onBack={() => setCurrentView('home')}
            onReinspect={() => handleFileSelected(activeInspection.general.filePath)}
            onShowToast={showToast}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearHistory={handleClearRecents}
            onShowToast={showToast}
            appVersion={appVersion}
          />
        )}
      </main>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className="toast">
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
