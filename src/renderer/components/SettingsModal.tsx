import React from 'react';
import {
  X,
  Palette,
  Clock,
  Shield,
  Info,
  Sliders,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react';
import { AppSettings, ThemeMode } from '../../shared/types';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '../../shared/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearHistory: () => void;
  onResetAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearHistory,
  onResetAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Preferences & Privacy
            </h3>
          </div>

          <button
            className="peek-btn peek-btn-ghost"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* 1. Appearance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Appearance Theme
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdateSettings({ theme: mode })}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: settings.theme === mode ? 'var(--accent-subtle)' : 'var(--bg-input)',
                    border: `1px solid ${settings.theme === mode ? 'var(--accent)' : 'var(--border-color)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {mode === 'dark' && <Moon size={18} style={{ color: settings.theme === mode ? 'var(--accent)' : 'var(--text-secondary)' }} />}
                  {mode === 'light' && <Sun size={18} style={{ color: settings.theme === mode ? 'var(--accent)' : 'var(--text-secondary)' }} />}
                  {mode === 'system' && <Laptop size={18} style={{ color: settings.theme === mode ? 'var(--accent)' : 'var(--text-secondary)' }} />}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      color: settings.theme === mode ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {mode}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. File History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Recent File History
              </span>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Track Recently Inspected Files
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Stores shortcuts locally on this device for quick re-inspection.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={settings.historyEnabled}
                  onChange={(e) => onUpdateSettings({ historyEnabled: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  className="peek-btn peek-btn-secondary"
                  onClick={onClearHistory}
                  style={{ fontSize: '12px' }}
                >
                  <Trash2 size={13} />
                  <span>Clear Recent History Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Privacy Guarantee */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={15} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Privacy & Data Architecture
              </span>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>100% Offline:</strong> No network sockets or cloud backend servers.</li>
                <li><strong>Zero Telemetry:</strong> No tracking, analytics, or user identifiers.</li>
                <li><strong>Local Execution:</strong> File headers and streams remain isolated on your PC.</li>
                <li><strong>No Auto-Execution:</strong> Inspects binary signatures without running files.</li>
              </ul>
            </div>
          </div>

          {/* 4. About */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                About {APP_NAME}
              </span>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {APP_NAME} v{APP_VERSION}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {APP_TAGLINE} • MIT License
                </p>
              </div>

              <button
                className="peek-btn peek-btn-ghost"
                onClick={onResetAll}
                title="Reset all settings and clear local storage"
                style={{ fontSize: '11px' }}
              >
                <RefreshCw size={12} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
