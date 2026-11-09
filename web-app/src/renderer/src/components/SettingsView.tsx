import React from 'react';
import {
  SettingsIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  ShieldCheckIcon,
  Trash2Icon,
  InfoIcon,
} from './Icons';
import { AppSettings } from '../../../shared/types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearHistory: () => void;
  onShowToast: (message: string) => void;
  appVersion: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onClearHistory,
  onShowToast,
  appVersion,
}) => {
  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    onUpdateSettings({ theme });
    onShowToast(`Theme set to ${theme}`);
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2 className="settings-title">Preferences & Settings</h2>
        <p className="settings-subtitle">Customize FilePeek's appearance, behavior, and privacy preferences.</p>
      </div>

      {/* Appearance */}
      <section className="settings-group">
        <h3 className="settings-group-title">Appearance</h3>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Interface Theme</span>
            <span className="settings-row-desc">Select dark, light, or sync with your Windows system preference.</span>
          </div>

          <div className="theme-toggle-group">
            <button
              className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
              title="Light theme"
            >
              <SunIcon size={16} />
            </button>
            <button
              className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
              title="Dark theme"
            >
              <MoonIcon size={16} />
            </button>
            <button
              className={`theme-btn ${settings.theme === 'system' ? 'active' : ''}`}
              onClick={() => handleThemeChange('system')}
              title="System theme"
            >
              <LaptopIcon size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* General Settings */}
      <section className="settings-group">
        <h3 className="settings-group-title">General Preferences</h3>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Remember Window Size & Position</span>
            <span className="settings-row-desc">Restore window geometry across application sessions.</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.rememberWindowSize}
              onChange={(e) => {
                onUpdateSettings({ rememberWindowSize: e.target.checked });
                onShowToast(e.target.checked ? 'Window geometry persistence enabled' : 'Window geometry persistence disabled');
              }}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Launch at Windows Startup</span>
            <span className="settings-row-desc">Automatically open FilePeek in background on login.</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.openAtStartup}
              onChange={(e) => {
                onUpdateSettings({ openAtStartup: e.target.checked });
                onShowToast(e.target.checked ? 'Launch on startup enabled' : 'Launch on startup disabled');
              }}
            />
            <span className="slider"></span>
          </label>
        </div>
      </section>

      {/* File History */}
      <section className="settings-group">
        <h3 className="settings-group-title">File History</h3>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Enable Recent Files History</span>
            <span className="settings-row-desc">Save recently inspected file records locally for fast re-opening.</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.enableRecentHistory}
              onChange={(e) => {
                onUpdateSettings({ enableRecentHistory: e.target.checked });
                onShowToast(e.target.checked ? 'Recent files history enabled' : 'Recent files history disabled');
              }}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Clear Recent History</span>
            <span className="settings-row-desc">Remove all entries from the local recently inspected list.</span>
          </div>
          <button
            className="btn-ghost-sm"
            style={{ color: 'var(--danger-text)', border: '1px solid var(--danger-border)', padding: '6px 14px' }}
            onClick={() => {
              if (window.confirm('Clear all recent inspection records?')) {
                onClearHistory();
                onShowToast('Cleared recent files history');
              }
            }}
          >
            Clear All History
          </button>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="settings-group">
        <h3 className="settings-group-title">Privacy Guarantee</h3>

        <div className="settings-row" style={{ background: 'var(--bg-card-subtle)' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <ShieldCheckIcon size={24} color="var(--success-text)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Offline & Local Computing Promise
              </span>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                FilePeek does not collect telemetry, usage analytics, device identifiers, or tracking tokens.
                Inspections, file signature matching, and cryptographic hashing take place entirely on your device.
                No network calls or file uploads are ever initiated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="settings-group">
        <h3 className="settings-group-title">About FilePeek</h3>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">FilePeek Desktop Utility</span>
            <span className="settings-row-desc">Version {appVersion} • Windows Desktop Build</span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Built with Electron, React, TypeScript, and Vite.
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-primary">MIT License</span>
          </div>
        </div>
      </section>
    </div>
  );
};
