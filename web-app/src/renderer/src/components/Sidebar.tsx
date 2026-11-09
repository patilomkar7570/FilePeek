import React from 'react';
import {
  FileIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
} from './Icons';
import { AppSettings } from '../../../shared/types';

interface SidebarProps {
  currentView: 'home' | 'dashboard' | 'settings';
  onNavigate: (view: 'home' | 'dashboard' | 'settings') => void;
  settings: AppSettings;
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
  hasActiveInspection: boolean;
  appVersion: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  settings,
  onThemeChange,
  hasActiveInspection,
  appVersion,
}) => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-icon-wrapper">
          <FileIcon size={20} strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="brand-title">FilePeek</h1>
          <p className="brand-tagline">Know Your Files</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === 'home' && !hasActiveInspection ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          <FileIcon size={18} />
          <span>Inspect</span>
        </button>

        {hasActiveInspection && (
          <button
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <ShieldCheckIcon size={18} />
            <span>Active Inspection</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
          v{appVersion}
        </span>

        <div className="theme-toggle-group" title="Appearance Mode">
          <button
            className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
            onClick={() => onThemeChange('light')}
            title="Light Theme"
          >
            <SunIcon size={14} />
          </button>
          <button
            className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
            onClick={() => onThemeChange('dark')}
            title="Dark Theme"
          >
            <MoonIcon size={14} />
          </button>
          <button
            className={`theme-btn ${settings.theme === 'system' ? 'active' : ''}`}
            onClick={() => onThemeChange('system')}
            title="System / Auto (Follows Windows OS)"
          >
            <LaptopIcon size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
